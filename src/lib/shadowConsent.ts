// src/lib/shadowConsent.ts
// 섀도잉 'AI 발음 채점'(Azure 전송) 동의 상태를 localStorage 에 저장/조회한다.
//   · 채점은 음성을 Microsoft Azure(미국)로 실시간 전송하므로, 사전 명시 동의가 있어야만 동작한다.
//   · null/false = 미동의 → 채점 실행 전에 동의 UI 를 먼저 띄운다.
//   · 동의는 언제든 철회 가능(프로필/설정에서 clear).

const STORAGE_KEY = 'klisten_shadow_score_consent'

// ⏸ 일시 중지 마스터 스위치 — Azure 무료 크레딧 만료(2026-09).
//   정식 출시 후 구독 매출로 유료 Speech 리소스를 운영하기 전까지 AI 채점을 전면 중지한다.
//   재개: 아래를 false 로 바꾸기만 하면 기존 DEV/플래그 노출 로직이 그대로 복원된다.
const SHADOW_SCORE_PAUSED = true

// AI 발음 채점(Azure) 노출 여부 — 동의 UI·개인정보처리방침·CSP가 갖춰졌더라도,
// 프로덕션에서 켜려면 빌드 시 VITE_ENABLE_SHADOW_SCORE=1 을 설정한다. 개발환경은 항상 노출.
// 단, SHADOW_SCORE_PAUSED 가 켜져 있으면 DEV·플래그와 무관하게 항상 꺼진다(크레딧 만료 대비).
export const AI_SCORE_ENABLED =
  !SHADOW_SCORE_PAUSED &&
  (import.meta.env.DEV || import.meta.env.VITE_ENABLE_SHADOW_SCORE === '1')

export function hasShadowConsent(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'granted'
  } catch {
    return false
  }
}

export function setShadowConsent(granted: boolean): void {
  try {
    if (granted) localStorage.setItem(STORAGE_KEY, 'granted')
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* 저장 실패(프라이빗 모드 등) — 이번 세션 동안만 유효 */
  }
}
