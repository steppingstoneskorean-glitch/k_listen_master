// api/_lib/verifyAdmin.mjs
// Firebase ID 토큰 검증 (identitytoolkit lookup — 관리자 이메일 확인)
//   필요한 Vercel 환경 변수: FIREBASE_API_KEY, (선택) ADMIN_EMAIL

export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'steppingstoneskorean@gmail.com'

/** 관리자면 이메일, 아니면 null */
export async function verifyAdmin(idToken) {
  if (!idToken) return null
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
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user.email
}
