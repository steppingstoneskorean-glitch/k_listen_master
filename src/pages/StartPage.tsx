import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { getLevelPref } from '@/lib/todayPlan'
import { recordMarketingConsent } from '@/lib/marketingConsent'
import logoImg from '../../assets/images/logo.png'
import wordGuessImg from '../../assets/images/단어 맞히기.png'
import intermediateGameImg from '../../assets/images/Intermediate game.png'
import advancedGameImg from '../../assets/images/Advanced game.png'

function readSession(key: string): string | undefined {
  try { return sessionStorage.getItem(key) ?? undefined } catch { return undefined }
}

export default function StartPage() {
  const { t } = useLang()
  const { signInWithGoogle, signInWithApple, setIsGuest, user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // 로그인 후 원래 가려던 경로로 복귀 (없으면 홈).
  //   리다이렉트 로그인은 페이지가 새로고침되어 location.state 가 사라지므로,
  //   직전에 sessionStorage 에 저장해둔 목적지를 폴백으로 사용한다.
  const stateFrom = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const from = stateFrom ?? readSession('pendingLoginFrom') ?? '/'
  // 온보딩(레벨 미설정)이면 직전 경로 대신 항상 홈으로 → 언어→레벨→닉네임 순서가 먼저 나온다.
  const dest = getLevelPref() === null ? '/' : from

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false) // 기본 해제 — 사전 체크된 박스는 유효한 동의가 아님

  if (!loading && user) {
    try { sessionStorage.removeItem('pendingLoginFrom') } catch { /* 무시 */ }
    navigate(dest, { replace: true })
    return null
  }

  // 로그인 없이 먼저 체험 — K-content 허브로 보낸다. 거기서 1개 플레이 → 완료 후 로그인 유도.
  // (게스트 완료는 로그인 시 '오늘 완료'로 소급 반영됨 — guestProgress)
  const handleGuest = () => {
    setIsGuest(true)
    navigate('/games')
  }

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setError('')
    setSubmitting(true)
    // 리다이렉트 경로는 페이지를 떠나므로, 동의·목적지를 미리 보존한다.
    try {
      if (marketingOptIn) sessionStorage.setItem('pendingMarketingConsent', '1')
      else sessionStorage.removeItem('pendingMarketingConsent')
      sessionStorage.setItem('pendingLoginFrom', from)
    } catch { /* 무시 */ }
    try {
      const { uid } = provider === 'google' ? await signInWithGoogle() : await signInWithApple()
      // 여기 도달 = 팝업 성공(리다이렉트는 페이지 이탈로 도달하지 않음)
      if (marketingOptIn && uid) void recordMarketingConsent(uid)
      navigate(dest, { replace: true })
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'auth_unavailable') {
        setError('Authentication service unavailable.')
      } else if (provider === 'google') {
        setError('Google sign-in failed. Please try again.')
      } else {
        setError('Apple sign-in failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-fuchsia-50 px-5 pb-8 text-slate-900">
      {/* Ambient glow — 밝은 배경 위 은은한 브랜드 컬러 번짐 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/2 h-[320px] w-[480px] -translate-x-1/2 rounded-full bg-fuchsia-300/30 blur-[120px]" />
        <div className="absolute top-44 left-1/2 h-[260px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-300/30 blur-[130px]" />
      </div>

      {/* Language switcher */}
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-7">
        {/* K-content 히어로 — 실제 콘텐츠(앱 썸네일)를 기울인 카드로 앞세운다 */}
        <div className="relative mt-16 flex select-none items-end justify-center">
          <img
            src={wordGuessImg} alt="" aria-hidden="true"
            className="pointer-events-none h-28 w-20 -mr-5 translate-y-2 rotate-[-9deg] rounded-2xl object-cover shadow-lg shadow-indigo-300/40 ring-1 ring-slate-900/10"
          />
          <img
            src={intermediateGameImg} alt="K-Listen"
            className="pointer-events-none relative z-10 h-36 w-28 rounded-2xl object-cover shadow-xl shadow-indigo-400/30 ring-1 ring-slate-900/10"
          />
          <img
            src={advancedGameImg} alt="" aria-hidden="true"
            className="pointer-events-none h-28 w-20 -ml-5 translate-y-2 rotate-[9deg] rounded-2xl object-cover shadow-lg shadow-fuchsia-300/40 ring-1 ring-slate-900/10"
          />
        </div>

        {/* Brand + headline (텍스트 최소화) */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="" aria-hidden="true" className="h-6 w-6 rounded-lg object-contain" />
            <span className="text-base font-black tracking-tight">
              <span className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">K-Listen</span>
            </span>
          </div>
          <h1 className="max-w-[300px] whitespace-pre-line text-balance break-keep text-center text-[22px] font-black leading-tight text-slate-900">
            {t('start.tagline')}
          </h1>
          <p className="max-w-[280px] break-keep text-center text-xs leading-relaxed text-slate-500">
            {t('start.subtagline')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          {/* 1차 CTA — 로그인 없이 체험 */}
          <button
            type="button"
            onClick={handleGuest}
            className="group w-full rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-4 text-[15px] font-black text-white shadow-lg shadow-fuchsia-500/25 transition-all hover:opacity-95 active:scale-[0.98]"
          >
            {t('start.guestBrowse')}
            <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="whitespace-nowrap text-[11px] text-slate-400">{t('start.orSignIn')}</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* 소셜 로그인 — 2열 컴팩트 */}
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              disabled={submitting}
              aria-label={t('auth.continueWithGoogle')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-40"
            >
              <GoogleIcon /> Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn('apple')}
              disabled={submitting}
              aria-label={t('auth.continueWithApple')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-40"
            >
              <AppleIcon /> Apple
            </button>
          </div>
          {error && <p className="text-center text-xs text-red-500">{error}</p>}

          {/* 마케팅 동의 (선택) — 사전 체크 안 함 */}
          <label className="mt-0.5 flex cursor-pointer select-none items-start gap-2">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={e => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 bg-white accent-fuchsia-500"
            />
            <span className="text-[11px] leading-snug text-slate-500">{t('auth.marketingConsent')}</span>
          </label>

          {/* 법적 링크 + 웹 폴백(설치앱 로그인 막힐 때 우회) — 한 줄로 */}
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <Link to="/privacy" className="underline transition-colors hover:text-slate-600">{t('cookie.privacy')}</Link>
            <span className="text-slate-300">·</span>
            <a href="https://k-listen-master.vercel.app" className="underline transition-colors hover:text-slate-600">{t('start.webFallback')}</a>
          </div>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zm-3.1-17.6c.06 2.3-1.67 4.2-3.9 4.3-1.05-2.6 1.43-4.35 3.9-4.3z" />
    </svg>
  )
}
