// src/components/CookieConsent.tsx
// 쿠키(분석) 동의 배너. EU/GDPR 사전 동의 원칙에 맞춰, 사용자가 "동의"하기 전에는
// Google Analytics 를 로드하지 않는다.
//   · 최초 방문(선택 없음): 배너 노출
//   · 이미 'granted': 배너 숨김 + 이번 세션에 분석 로드
//   · 'denied': 배너 숨김 + 추적 없음
//   · 푸터의 "쿠키 설정"(openCookieSettings 이벤트)으로 언제든 다시 열어 선택 변경 가능

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { loadAnalytics } from '@/lib/analytics'
import { getConsent, setConsent, OPEN_SETTINGS_EVENT } from '@/lib/cookieConsent'

export default function CookieConsent() {
  const { t } = useLang()
  // 아직 선택하지 않았으면(null) 배너를 띄운다 — 렌더 시점에 lazy 초기화(effect 내 setState 회피).
  const [visible, setVisible] = useState(() => getConsent() === null)

  useEffect(() => {
    // 이미 동의한 사용자는 이번 세션에도 분석을 로드한다 (외부 시스템 동기화).
    if (getConsent() === 'granted') loadAnalytics()

    // 푸터 "쿠키 설정" → 배너 재노출
    const reopen = () => setVisible(true)
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen)
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen)
  }, [])

  const accept = () => {
    setConsent('granted')
    loadAnalytics()
    setVisible(false)
  }

  const decline = () => {
    setConsent('denied')
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
          {t('cookie.message')}{' '}
          <Link to="/privacy" className="text-indigo-400 hover:text-indigo-300 underline whitespace-nowrap">
            {t('cookie.privacy')}
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 rounded-xl border border-gray-700 bg-gray-800 text-gray-300 text-xs font-bold hover:border-gray-500 hover:text-white transition-colors"
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-400 transition-colors"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
