// src/components/CookieConsent.tsx
// 쿠키 동의 배너. EU/GDPR 사전 동의 원칙에 맞춰, 사용자가 "동의"하기 전에는
// Google Analytics(분석)도 Meta 픽셀(광고 측정)도 로드하지 않는다.
//   · 최초 방문(선택 없음): 배너 노출
//   · 이미 'granted': 배너 숨김 + 이번 세션에 해당 스크립트 로드
//   · 'denied': 배너 숨김 + 추적 없음
//   · 픽셀을 쓸 수 있는 상태(ID 설정 + 방침 시행일 이후)인데 광고 측정 동의를 아직 안 물었으면
//     배너를 다시 띄운다 — 기존 분석 동의를 광고 측정에 넘겨쓰지 않는다(목적이 다름).
//     이때 버튼은 [거부] [분석만] [모두 동의] 세 개, 픽셀이 없으면 예전처럼 [거부] [동의] 두 개.
//   · 프로필의 "쿠키 설정"(openCookieSettings 이벤트)으로 언제든 다시 열어 선택 변경 가능

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { loadAnalytics } from '@/lib/analytics'
import { loadMetaPixel, pixelAvailable } from '@/lib/metaPixel'
import {
  getConsent,
  setConsent,
  getMarketingConsent,
  setMarketingConsent,
  OPEN_SETTINGS_EVENT,
  type ConsentChoice,
} from '@/lib/cookieConsent'

export default function CookieConsent() {
  const { t } = useLang()
  const withAds = pixelAvailable()
  // 아직 선택하지 않았으면(null) 배너를 띄운다 — 렌더 시점에 lazy 초기화(effect 내 setState 회피).
  const [visible, setVisible] = useState(
    () => getConsent() === null || (withAds && getMarketingConsent() === null),
  )

  useEffect(() => {
    // 이미 동의한 사용자는 이번 세션에도 로드한다 (외부 시스템 동기화).
    if (getConsent() === 'granted') loadAnalytics()
    if (getMarketingConsent() === 'granted') loadMetaPixel()

    // "쿠키 설정" → 배너 재노출
    const reopen = () => setVisible(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen)
  }, [])

  const choose = (analytics: ConsentChoice, marketing: ConsentChoice) => {
    setConsent(analytics)
    if (analytics === 'granted') loadAnalytics()
    if (withAds) {
      setMarketingConsent(marketing)
      if (marketing === 'granted') loadMetaPixel()
      // 이번 세션에 이미 로드된 픽셀은 철회 즉시 전송을 멈춘다
      else window.fbq?.('consent', 'revoke')
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t('cookie.settings')}
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-700 bg-gray-900/95 backdrop-blur px-4 py-3 shadow-2xl flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="flex-1 text-[12px] leading-snug text-gray-300">
          {t(withAds ? 'cookie.messageWithAds' : 'cookie.message')}{' '}
          <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap">
            {t('cookie.privacy')}
          </Link>
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => choose('denied', 'denied')}
            className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-xs font-bold hover:border-gray-500 hover:text-white transition-colors"
          >
            {t('cookie.decline')}
          </button>
          {withAds && (
            <button
              onClick={() => choose('granted', 'denied')}
              className="px-4 py-2 rounded-xl border border-gray-600 bg-gray-800 text-gray-200 text-xs font-bold hover:border-gray-400 hover:text-white transition-colors"
            >
              {t('cookie.analyticsOnly')}
            </button>
          )}
          <button
            onClick={() => choose('granted', 'granted')}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-400 transition-colors"
          >
            {t(withAds ? 'cookie.acceptAll' : 'cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
