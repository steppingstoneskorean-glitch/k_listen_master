// src/lib/marketingConsent.ts
// 마케팅(광고성) 이메일 수신 동의 기록 — users/{uid} 문서에 merge 저장.
//   · 정보통신망법 제50조: 광고성 정보는 사전 opt-in 동의 필요 → 동의 시각까지 기록해 증빙.
//   · 체크한 경우에만 호출한다. 로그인 시 체크하지 않았다고 기존 동의를 false 로
//     덮어쓰지 않는다 — 철회는 별도 요청(이메일/수신거부 링크)으로 처리.

import { doc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

export async function recordMarketingConsent(uid: string): Promise<void> {
  if (!db) return
  try {
    await setDoc(
      doc(db, 'users', uid),
      { marketingConsent: true, marketingConsentAt: Date.now() },
      { merge: true },
    )
  } catch (err) {
    console.warn('Failed to record marketing consent:', err)
  }
}
