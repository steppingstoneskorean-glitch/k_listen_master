import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

let _auth: Auth | null = null
let _db: Firestore | null = null
let _app: FirebaseApp | null = null

// signInWithRedirect(TWA/모바일) 의 결과는 authDomain 도메인의 저장소에서 읽어야 하는데,
// authDomain 이 {project}.firebaseapp.com 이면 앱과 교차 도메인이라 최신 브라우저가 차단한다.
// 배포 도메인에서 서빙될 때는 authDomain 을 '앱 자신의 도메인'으로 둔다.
//   · vercel.json 이 /__/auth/* 를 firebaseapp.com 핸들러로 프록시 → same-origin 처리.
//   · 로컬 개발(localhost)은 팝업을 쓰므로 env 기본값(firebaseapp.com) 유지.
//   ⚠️ 앱 도메인이 Firebase 콘솔의 '승인된 도메인'에 등록돼 있어야 한다.
function resolveAuthDomain(): string | undefined {
  const envDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined
  if (typeof window === 'undefined') return envDomain
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return envDomain
  return window.location.host
}

try {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
    const app: FirebaseApp = initializeApp({
      apiKey,
      authDomain: resolveAuthDomain(),
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    })
    _app = app
    _auth = getAuth(app)
    _db = getFirestore(app)
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
