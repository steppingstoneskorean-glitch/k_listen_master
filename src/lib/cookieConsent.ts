// src/lib/cookieConsent.ts
// 쿠키(분석) 동의 상태를 localStorage 에 저장/조회한다.
//   · 'granted' 이전에는 어떤 분석 스크립트도 로드되지 않는다 (EU 사전 동의 원칙).
//   · null = 아직 선택 안 함 → 배너 노출. 'denied' = 거부 → 배너 숨김, 추적 없음.
//   · 푸터의 "쿠키 설정" 이 openCookieSettings 이벤트로 배너를 다시 띄운다(동의 철회 경로).

export type ConsentChoice = 'granted' | 'denied'

const STORAGE_KEY = 'cookie_consent'
export const OPEN_SETTINGS_EVENT = 'openCookieSettings'

export function getConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(STORAGE_KEY, choice)
  } catch {
    /* 저장 실패(프라이빗 모드 등)해도 조용히 무시 — 이번 세션 동안만 유효 */
  }
}

// 광고 측정(Meta 픽셀) 동의 — 분석(GA) 동의와 목적이 달라 따로 저장한다.
//   null = 아직 안 물어봄 → 픽셀을 쓸 수 있는 상태(pixelAvailable)면 배너를 다시 띄워 묻는다.
const MARKETING_KEY = 'cookie_consent_marketing'

export function getMarketingConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(MARKETING_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

export function setMarketingConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(MARKETING_KEY, choice)
  } catch {
    /* 무시 — 이번 세션 동안만 유효 */
  }
}

/** 푸터 등에서 호출 — 동의 배너를 다시 열어 사용자가 선택을 바꿀 수 있게 한다. */
export function openCookieSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT))
}
