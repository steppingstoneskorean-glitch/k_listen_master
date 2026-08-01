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
