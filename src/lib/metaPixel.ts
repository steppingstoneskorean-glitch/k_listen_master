// src/lib/metaPixel.ts
// Meta 픽셀 — 마케팅 OS 09_tracking(PlayGame · InitiateCheckout) 측정용.
//   · 쿠키 배너에서 '광고 측정'까지 동의한 경우에만 로드한다 (getMarketingConsent === 'granted').
//     기존 GA 동의('분석')만으로는 로드하지 않는다 — 목적이 다르다.
//   · 개인정보처리방침 제3·4조에 고지한 시행일(PIXEL_POLICY_EFFECTIVE) 전에는 아무것도 하지 않는다.
//   · 픽셀 ID(VITE_META_PIXEL_ID)가 없으면 전부 no-op, 배너도 예전처럼 분석 동의만 묻는다.
//   · 고급 매칭(이메일 등 개인정보 해시 전송)은 쓰지 않는다.

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown }
    _fbq?: unknown
  }
}

const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID ?? '').trim()
/** 개인정보처리방침 개정 시행일 (제9조: 7일 전 공지) — 이 날부터만 픽셀 동작 */
export const PIXEL_POLICY_EFFECTIVE = '2026-11-11'

const STANDARD_EVENTS = new Set(['PageView', 'Lead', 'InitiateCheckout', 'CompleteRegistration', 'Purchase', 'ViewContent'])

let loaded = false

/** 픽셀을 쓸 수 있는 상태인지 — ID 설정 + 방침 시행일 이후 (동의 여부와 별개) */
export function pixelAvailable(): boolean {
  if (!/^\d{6,20}$/.test(PIXEL_ID)) return false
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10) // KST
  return today >= PIXEL_POLICY_EFFECTIVE
}

/** 광고 측정 동의 후에만 호출 — Meta 공식 fbevents 로더(스니펫과 동일 동작). 중복 호출은 무시 */
export function loadMetaPixel(): void {
  if (loaded || typeof document === 'undefined' || !pixelAvailable()) return
  loaded = true

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) (fbq.callMethod as (...a: unknown[]) => void)(...args)
    else fbq.queue!.push(args)
  } as NonNullable<Window['fbq']>
  if (!window._fbq) window._fbq = fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)

  fbq('init', PIXEL_ID)
  fbq('track', 'PageView')
}

/** 이벤트 전송 — 픽셀이 로드된 경우(=동의함)에만. 실패해도 앱 흐름에 영향 없음 */
export function trackPixel(event: string, params?: Record<string, unknown>): void {
  try {
    if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
    window.fbq(STANDARD_EVENTS.has(event) ? 'track' : 'trackCustom', event, params ?? {})
  } catch {
    /* 무시 */
  }
}
