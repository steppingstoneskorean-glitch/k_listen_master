// api/speech-token.js
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — Azure Speech 단기 인증 토큰 발급 (Vercel Serverless Function)
//   섀도잉 발음 채점(Pronunciation Assessment)용. Azure 구독 키는 서버에만 두고,
//   클라이언트에는 약 10분 유효한 임시 토큰 + 리전만 내려준다(키 노출 방지).
//
//   POST /api/speech-token
//   Headers: Authorization: Bearer <Firebase ID Token>  (로그인 사용자만 — 무료 쿼터 보호)
//   Returns: { token: string, region: string }
//
//   필요한 Vercel 환경 변수:
//     AZURE_SPEECH_KEY     — Azure Speech 리소스 키 (F0 무료 등급 가능)
//     AZURE_SPEECH_REGION  — 리소스 리전 (예: koreacentral, eastus)
//     FIREBASE_API_KEY     — Firebase Web API 키 (ID 토큰 검증용, generate-quiz 와 동일)
//
//   ※ 발음 평가는 실시간 처리라 Microsoft 가 오디오를 보존/저장하지 않는다.
//     (공식 문서: real-time STT·pronunciation assessment — no data at rest)
// ─────────────────────────────────────────────────────────────────────────────

// ── Firebase ID 토큰 검증 (로그인 여부만 확인 — 관리자 제한 없음) ─────────────
async function verifyUser(idToken) {
  const key = process.env.FIREBASE_API_KEY
  if (!key) throw new Error('FIREBASE_API_KEY env var is not set on Vercel')
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )
  if (!r.ok) return null
  const data = await r.json()
  const user = data.users && data.users[0]
  return user ? (user.localId || user.email || 'ok') : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const region = process.env.AZURE_SPEECH_REGION
  const key = process.env.AZURE_SPEECH_KEY
  if (!region || !key) {
    return res.status(500).json({ error: 'Azure Speech 환경변수(AZURE_SPEECH_KEY / AZURE_SPEECH_REGION)가 설정되지 않았습니다' })
  }

  try {
    // 1) 로그인 사용자 확인 — 키/쿼터 무단 사용 방지
    const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!idToken) return res.status(401).json({ error: '로그인이 필요합니다 (ID token missing)' })
    const uid = await verifyUser(idToken)
    if (!uid) return res.status(403).json({ error: '유효하지 않은 로그인입니다' })

    // 2) Azure STS 에서 단기 토큰 발급 (약 10분 유효)
    const r = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': '0',
        },
      },
    )
    if (!r.ok) {
      const body = await r.text().catch(() => '')
      console.error('[speech-token] issueToken HTTP', r.status, body.slice(0, 200))
      return res.status(502).json({ error: `Azure 토큰 발급 실패 (HTTP ${r.status})` })
    }
    const token = await r.text()
    // 토큰은 민감정보 아님(10분 만료). 캐시 방지만 지정.
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ token, region })
  } catch (e) {
    console.error('[speech-token] failed', e)
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
  }
}
