// api/send-reminders.js
// ─────────────────────────────────────────────────────────────────────────────
// 저녁 학습 리마인더 발송기 (Serverless Function)
//   · 무료 운영을 위해 Vercel 크론(Pro 필요) 대신 GitHub Actions 스케줄러가
//     매시 정각(UTC)에 이 엔드포인트를 POST 로 호출한다
//     (.github/workflows/send-reminders.yml).
//   · reminderEnabled=true 인 사용자 중, 사용자의 로컬 시각이 reminderHour 와
//     일치하고 · 오늘 목표를 아직 못 채웠고 · 오늘 아직 안 보낸 사람에게만
//     FCM 데이터 메시지를 보낸다(표시는 firebase-messaging-sw.js 가 담당).
//
//   필요한 Vercel 환경 변수:
//     FIREBASE_SERVICE_ACCOUNT — 서비스 계정 키 JSON 전체(문자열)
//     CRON_SECRET              — 호출자(GitHub Actions)가 보내는 Bearer 토큰과 대조
// ─────────────────────────────────────────────────────────────────────────────

import admin from 'firebase-admin'

// Hobby 플랜 서버리스 함수 실행시간 상한(60초). 사용자가 많아 60초를 넘기면
// 배치/페이지네이션 도입 필요.
export const config = { maxDuration: 60 }

function initAdmin() {
  if (admin.apps.length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing')
  const sa = JSON.parse(raw)
  if (sa.private_key && sa.private_key.includes('\\n')) {
    sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  }
  admin.initializeApp({ credential: admin.credential.cert(sa) })
}

/** 주어진 IANA 타임존에서의 현재 'YYYY-MM-DD' 와 시(0~23). */
function localDateHour(tz) {
  const safeTz = tz || 'UTC'
  const now = new Date()
  let date
  try {
    date = new Intl.DateTimeFormat('en-CA', {
      timeZone: safeTz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now)
  } catch {
    // 잘못된 타임존이면 UTC 로 대체
    date = new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    tz = 'UTC'
  }
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz || 'UTC', hour: 'numeric', hour12: false, hourCycle: 'h23',
  }).format(now)
  return { date, hour: Number(hourStr) % 24 }
}

// 리마인더 문구 (언어별). 목표까지 남은 개수를 {n} 으로 치환.
const COPY = {
  en: { title: 'Step Korean 🔥', body: "Keep your streak alive — finish today's goal!" },
  ko: { title: 'Step Korean 🔥', body: '오늘 학습으로 연속 기록을 이어가세요! 목표까지 조금 남았어요.' },
  ja: { title: 'Step Korean 🔥', body: '今日の学習で連続記録を続けましょう！目標まであと少しです。' },
  es: { title: 'Step Korean 🔥', body: '¡Mantén tu racha — completa la meta de hoy!' },
}

export default async function handler(req, res) {
  // ── 크론 인증 ──
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers['authorization'] || ''
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'unauthorized' })
    }
  }

  try {
    initAdmin()
  } catch (err) {
    console.error('[send-reminders] admin init failed:', err.message)
    return res.status(500).json({ error: 'init_failed' })
  }

  const db = admin.firestore()
  const messaging = admin.messaging()

  let sent = 0
  let candidates = 0
  const invalidTokenOps = []

  try {
    const snap = await db.collection('users').where('reminderEnabled', '==', true).get()

    for (const doc of snap.docs) {
      const u = doc.data()
      const tokens = Array.isArray(u.fcmTokens) ? u.fcmTokens.filter(Boolean) : []
      if (tokens.length === 0) continue

      const tz = u.timezone || 'UTC'
      const { date: localToday, hour: localHour } = localDateHour(tz)
      const reminderHour = Number.isFinite(u.reminderHour) ? u.reminderHour : 20

      // 사용자의 로컬 발송 시각이 아니면 건너뜀 (크론은 매시 정각 실행)
      if (localHour !== reminderHour) continue
      // 오늘 이미 보냈으면 건너뜀
      if (u.lastReminderSentDate === localToday) continue

      // 오늘 목표 달성 여부
      const doneToday = u.lastCompletionDate === localToday ? (u.completedVideosToday || 0) : 0
      const goal = Number.isFinite(u.dailyGoal) ? u.dailyGoal : 3
      if (doneToday >= goal) continue // 이미 목표 달성 → 리마인더 불필요

      candidates++

      const copy = COPY[u.lang] || COPY.en
      const remaining = Math.max(1, goal - doneToday)
      const message = {
        tokens,
        data: {
          title: copy.title,
          body: copy.body.replace('{n}', String(remaining)),
          url: '/',
        },
        // 데이터 전용 메시지지만 웹 푸시 우선순위를 높여 배달 지연을 줄인다
        webpush: { headers: { Urgency: 'high' } },
      }

      const resp = await messaging.sendEachForMulticast(message)
      sent += resp.successCount

      // 만료/무효 토큰 정리
      const bad = []
      resp.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error && r.error.code
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token' ||
            code === 'messaging/invalid-argument'
          ) {
            bad.push(tokens[i])
          }
        }
      })

      const update = { lastReminderSentDate: localToday }
      if (bad.length > 0) {
        update.fcmTokens = admin.firestore.FieldValue.arrayRemove(...bad)
      }
      invalidTokenOps.push(doc.ref.set(update, { merge: true }))
    }

    await Promise.all(invalidTokenOps)
    return res.status(200).json({ ok: true, candidates, sent })
  } catch (err) {
    console.error('[send-reminders] failed:', err)
    return res.status(500).json({ error: 'send_failed', message: err.message })
  }
}
