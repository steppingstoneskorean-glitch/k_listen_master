// api/_lib/verifyAppCheck.mjs
// ─────────────────────────────────────────────────────────────────────────────
// Firebase App Check 서버 검증 — 복제앱/스크립트가 우리 비용 엔드포인트를 무단 호출하지 못하게.
//   · 클라이언트(src/lib/firebase.ts)가 'X-Firebase-AppCheck' 헤더로 토큰을 보낸다.
//   · 기본은 '모니터' 모드: 토큰이 없거나 틀려도 통과시킨다 → 배포해도 기존 동작이 깨지지 않는다.
//   · 준비가 되면 Vercel 환경변수 APPCHECK_ENFORCE=1 로 '강제' 모드 전환 → 유효 토큰 없으면 거부.
//   · firebase-admin 은 FIREBASE_SERVICE_ACCOUNT 로 초기화(다른 api 함수와 동일 패턴).
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAppCheck } from 'firebase-admin/app-check'

function initAdmin() {
  if (getApps().length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing')
  const sa = JSON.parse(raw)
  if (sa.private_key && sa.private_key.includes('\\n')) sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  initializeApp({ credential: cert(sa) })
}

/**
 * App Check 통과 여부를 반환한다.
 *   · 통과 → true
 *   · 강제 모드에서 실패 → res 에 거부 응답(401/403)을 쓰고 false 반환(호출부는 즉시 return)
 *   · 모니터 모드 → 항상 true (경고 로그만)
 */
export async function requireAppCheck(req, res) {
  const enforce = process.env.APPCHECK_ENFORCE === '1'
  const token = req.headers['x-firebase-appcheck']

  if (!token) {
    if (enforce) {
      res.status(401).json({ error: 'App Check token required' })
      return false
    }
    return true // 모니터 모드 — 헤더 없어도 통과
  }

  try {
    initAdmin()
    await getAppCheck().verifyToken(token)
    return true
  } catch (e) {
    console.warn('[appcheck] verify failed:', e && e.message ? e.message : e)
    if (enforce) {
      res.status(403).json({ error: 'Invalid App Check token' })
      return false
    }
    return true // 모니터 모드 — 검증 실패해도 통과(로그만)
  }
}
