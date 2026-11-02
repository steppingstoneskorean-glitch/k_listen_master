// src/lib/guestProgress.ts
// ─────────────────────────────────────────────────────────────────────────────
// 게스트(비로그인) 체험 완료를 로그인 시 계정에 "한 번" 소급 반영하기 위한 플래그.
//   · 게스트가 게임/퀴즈를 1판 완료하면 setGuestPending() 으로 기기(localStorage)에 표시한다.
//   · 로그인 직후 GamificationProvider 가 consumeGuestPending() 으로 확인하고, 있으면
//     markVideoCompleted() 를 1회 호출해 "오늘 완료 1"로 이어준다 — 첫 성취감을 지킨다.
//   · 오답노트·개인복습(SRS)은 이미 기기 localStorage(uid 무관)라 로그인 후에도 그대로 남는다.
//     이 플래그는 "계정 문서(연속·오늘 완료)"에만 없던 연결을 보완한다.
// ─────────────────────────────────────────────────────────────────────────────

const KEY = 'klisten_guest_pending'

/** 게스트가 1판 완료했음을 기기에 표시(로그인 시 소급 반영 대상). */
export function setGuestPending(): void {
  try { localStorage.setItem(KEY, '1') } catch { /* 저장 실패는 조용히 무시 */ }
}

/** 플래그가 있으면 true 를 반환하고 즉시 제거한다(중복 반영 방지). */
export function consumeGuestPending(): boolean {
  try {
    if (localStorage.getItem(KEY) === '1') {
      localStorage.removeItem(KEY)
      return true
    }
  } catch { /* 무시 */ }
  return false
}
