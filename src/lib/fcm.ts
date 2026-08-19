// src/lib/fcm.ts
// ─────────────────────────────────────────────────────────────────────────────
// FCM(Firebase Cloud Messaging) 웹 푸시 클라이언트
//   · 저녁 리마인더를 받기 위한 브라우저 알림 권한 요청 + FCM 토큰 발급.
//   · 발급한 토큰은 users/{uid}.fcmTokens 배열에 저장한다(서버 발송기가 사용).
//   · 리마인더 on/off·시각·타임존은 gamification.setReminderPrefs 가 저장한다.
//   · 실제 예약 발송은 Vercel 크론(api/send-reminders.js)이 담당한다.
//
//   필요한 환경변수: VITE_FIREBASE_VAPID_KEY (Firebase 콘솔 → 클라우드 메시징 →
//   웹 푸시 인증서에서 발급하는 공개 VAPID 키)
// ─────────────────────────────────────────────────────────────────────────────

import { doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { app, db } from './firebase'

export type EnableResult = 'ok' | 'unsupported' | 'denied' | 'no-vapid' | 'error'

// Vercel 등에 값을 붙여넣을 때 앞뒤 공백/따옴표가 섞이면 getToken 이 실패하므로 방어적으로 정리한다.
const VAPID_KEY = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)
  ?.trim()
  .replace(/^["']|["']$/g, '')

/** 이 브라우저가 웹 푸시를 지원하는지 (SW + Notification + PushManager). */
export function pushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'Notification' in window &&
    'PushManager' in window
  )
}

/** 현재 알림 권한 상태. */
export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/**
 * FCM 전용 서비스워커를 등록한다. 설정값(공개키들)은 쿼리 파라미터로 넘겨
 * 배포 환경마다 다른 값을 SW 가 읽을 수 있게 한다(모두 공개 키라 노출 무방).
 */
async function registerFcmSw(): Promise<ServiceWorkerRegistration> {
  const params = new URLSearchParams({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  })
  // 별도 스코프로 등록해 vite-plugin-pwa 의 Workbox SW(스코프 '/')와 충돌하지 않게 한다.
  // (Firebase 기본 관례와 동일한 스코프)
  const reg = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params.toString()}`, {
    scope: '/firebase-cloud-messaging-push-scope',
  })
  // getToken 은 '활성화된' SW 를 요구한다 — 최초 등록 직후 installing/waiting 상태면
  // 활성화될 때까지 기다린다(SW 미준비로 getToken 이 error 로 실패하던 문제 방지).
  if (!reg.active) {
    await new Promise<void>(resolve => {
      const sw = reg.installing || reg.waiting
      if (!sw) { resolve(); return }
      const onChange = () => {
        if (sw.state === 'activated') {
          sw.removeEventListener('statechange', onChange)
          resolve()
        }
      }
      sw.addEventListener('statechange', onChange)
    })
  }
  return reg
}

/**
 * 알림 권한을 요청하고 FCM 토큰을 발급받아 Firestore 에 저장한다.
 * UI 는 반환값으로 사용자에게 적절한 안내를 보여줄 수 있다.
 */
export async function enablePush(uid: string): Promise<EnableResult> {
  if (!pushSupported() || !app || !db) return 'unsupported'
  if (!VAPID_KEY) return 'no-vapid'

  try {
    const { getMessaging, getToken, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return 'unsupported'

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'

    const swReg = await registerFcmSw()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })
    if (!token) {
      console.warn('[fcm] enablePush: getToken returned an empty token')
      return 'error'
    }

    await setDoc(
      doc(db, 'users', uid),
      { fcmTokens: arrayUnion(token) },
      { merge: true },
    )
    return 'ok'
  } catch (err) {
    // 원격 디버깅(chrome://inspect)에서 정확한 원인을 볼 수 있도록 코드/메시지를 함께 남긴다.
    const e = err as { code?: string; message?: string }
    console.warn('[fcm] enablePush failed:', e?.code ?? e?.message ?? err, err)
    return 'error'
  }
}

/** 이 기기의 토큰을 제거한다(리마인더 끄기 시). 실패해도 조용히 넘어간다. */
export async function removeThisDeviceToken(uid: string): Promise<void> {
  if (!pushSupported() || !app || !db || !VAPID_KEY) return
  try {
    const { getMessaging, getToken } = await import('firebase/messaging')
    const swReg = await registerFcmSw()
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg })
    if (token) {
      await setDoc(doc(db, 'users', uid), { fcmTokens: arrayRemove(token) }, { merge: true })
    }
  } catch (err) {
    console.warn('[fcm] removeThisDeviceToken failed:', err)
  }
}

/**
 * 앱이 포그라운드(열려 있는 상태)일 때 오는 푸시를 처리한다.
 * 반환된 해제 함수를 호출하면 구독을 중단한다.
 */
export async function listenForeground(onMsg: (title: string, body: string) => void): Promise<() => void> {
  if (!pushSupported() || !app) return () => {}
  try {
    const { getMessaging, onMessage, isSupported } = await import('firebase/messaging')
    if (!(await isSupported())) return () => {}
    const messaging = getMessaging(app)
    return onMessage(messaging, payload => {
      const d = payload.data ?? {}
      onMsg(d.title ?? 'Step Korean', d.body ?? '')
    })
  } catch {
    return () => {}
  }
}
