// src/lib/analytics.ts
// Google Analytics(gtag.js) 로더 — 반드시 쿠키 동의(opt-in) 이후에만 호출한다.
//   · EU(GDPR/ePrivacy)는 분석 쿠키에 대해 "사전 동의"를 요구하므로, index.html 에서
//     자동 로드하지 않고 CookieConsent 배너에서 동의를 받은 뒤에만 이 함수를 부른다.
//   · anonymize_ip 로 IP 를 익명화한다.

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const GA_MEASUREMENT_ID = 'G-MD94NL6YHD'

let loaded = false

/** 동의한 사용자에 한해 gtag.js 스크립트를 주입하고 GA 를 초기화한다. 중복 호출은 무시. */
export function loadAnalytics(): void {
  if (loaded || typeof document === 'undefined') return
  loaded = true

  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(s)

  window.dataLayer = window.dataLayer || []
  const gtag = (...args: unknown[]) => {
    window.dataLayer.push(args)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true })
}

/**
 * 커스텀 이벤트 전송 — **동의로 GA가 로드된 경우에만** 작동(window.gtag 존재 시).
 * 미동의 상태에선 조용히 무시되어 개인정보/동의 원칙을 지킨다. 분석은 부가 기능이라 실패해도
 * 앱 흐름에 영향 주지 않는다(try/catch). 기능 사용량·재방문 분석(프리미엄 판단)용.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('event', name, params ?? {})
  } catch {
    /* 무시 */
  }
}
