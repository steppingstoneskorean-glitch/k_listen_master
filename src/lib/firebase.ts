import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { initializeAppCheck, ReCaptchaV3Provider, getToken, type AppCheck } from 'firebase/app-check'

let _auth: Auth | null = null
let _db: Firestore | null = null
let _app: FirebaseApp | null = null
let _appCheck: AppCheck | null = null

try {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
    const app: FirebaseApp = initializeApp({
      apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
    _app = app
    _auth = getAuth(app)
    _db = getFirestore(app)

    // App Check — 복제앱/스크립트가 우리 백엔드(Firestore·토큰 엔드포인트)를 무단 호출하지 못하게 한다.
    //   · 공개값인 reCAPTCHA v3 사이트키(VITE_RECAPTCHA_SITE_KEY)만 필요. 미설정이면 조용히 건너뛴다
    //     → 키를 넣기 전까지는 아무 동작 변화 없음(안전한 점진 도입).
    //   · DEV 는 디버그 토큰을 콘솔에 출력 → Firebase 콘솔 App Check 에 등록하면 localhost 도 통과.
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined
    if (siteKey && siteKey !== 'undefined' && siteKey !== '') {
      if (import.meta.env.DEV) {
        ;(self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string }).FIREBASE_APPCHECK_DEBUG_TOKEN =
          (import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined) || true
      }
      try {
        _appCheck = initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        })
      } catch (e) {
        console.error('[firebase] App Check init failed:', e)
      }
    }
  } else {
    console.error(
      '[firebase] VITE_FIREBASE_API_KEY is missing at build time — auth/db disabled. ' +
      'Check that VITE_FIREBASE_* env vars are set in the deploy/build environment (not just .env.local).',
    )
  }
} catch (err) {
  console.error('[firebase] init failed — auth/db disabled:', err)
}

export const app = _app
export const auth = _auth
export const db = _db
export const appCheck = _appCheck

/**
 * 커스텀 서버 호출(/api/*)에 붙일 App Check 토큰을 받아온다.
 * App Check 미초기화(키 미설정)면 null → 호출부는 헤더를 생략한다(모니터 모드에서 그대로 통과).
 */
export async function getAppCheckToken(): Promise<string | null> {
  if (!_appCheck) return null
  try {
    const { token } = await getToken(_appCheck)
    return token
  } catch {
    return null
  }
}
