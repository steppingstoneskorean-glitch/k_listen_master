// src/lib/shadowConsent.ts
// 섀도잉 'AI 발음 채점'(Azure 전송) 동의 상태를 localStorage 에 저장/조회한다.
//   · 채점은 음성을 Microsoft Azure(미국)로 실시간 전송하므로, 사전 명시 동의가 있어야만 동작한다.
//   · null/false = 미동의 → 채점 실행 전에 동의 UI 를 먼저 띄운다.
//   · 동의는 언제든 철회 가능(프로필/설정에서 clear).

const STORAGE_KEY = 'klisten_shadow_score_consent'

// AI 발음 채점(Azure) 노출 여부 — 동의 UI·개인정보처리방침·CSP가 갖춰졌더라도,
// 프로덕션에서 켜려면 빌드 시 VITE_ENABLE_SHADOW_SCORE=1 을 설정한다. 개발환경은 항상 노출.
export const AI_SCORE_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SHADOW_SCORE === '1'

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
