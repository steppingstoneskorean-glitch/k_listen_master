import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../../../assets/images/logo.jpg'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useGamification } from '@/lib/gamification'

export default function Header() {
  const { t } = useLang()
  const { user, logout } = useAuth()
  const { progress } = useGamification()
  const navigate = useNavigate()
  const [showComingSoon, setShowComingSoon] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header className="border-b border-emerald-100/60 bg-[#e9fbf2]/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-3">
          {/* Top row: logo + language / auth */}
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <img src={logoImg} alt="Step Korean" className="h-8 w-auto rounded-lg object-contain" />
              <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Step</span>
              <span className="text-xl font-black text-slate-900">Korean</span>
            </Link>

            <div className="flex items-center gap-2">
              {/* YouTube channel */}
              <a
                href="https://www.youtube.com/@steppingstones.Korean"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Step Korean YouTube channel"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#FF0000] transition-all hover:bg-red-50"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.4 31.4 0 0 0 0 12a31.4 31.4 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 24 12a31.4 31.4 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
                </svg>
              </a>

              {/* Language switcher */}
              <LanguageSwitcher compact />

              {/* Auth */}
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 text-xs font-bold whitespace-nowrap">
                    🔥 {t('gamification.streakFmt').replace('{n}', String(progress.currentStreak))}
                  </span>
                  <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold whitespace-nowrap">
                    🎬 {t('gamification.completedFmt').replace('{n}', String(progress.completedVideosToday))}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[100px]">
                    {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200"
                  >
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>
          </div>

          {/* Bottom row: primary navigation, kept on a single horizontal row */}
          <nav className="flex flex-nowrap items-center gap-1.5 overflow-x-auto">
            {/* 게임 (통합 게임 허브) */}
            <Link
              to="/games"
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              {t('nav.game')}
            </Link>

            {/* 무료 자료 */}
            <button
              type="button"
              onClick={() => setShowComingSoon(true)}
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              {t('nav.freeMaterials')}
            </button>

            {/* 오답 확인 */}
            <Link
              to="/errors"
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
            >
              {t('nav.reviewErrors')}
            </Link>

            {/* 수업 & 교재 */}
            <a
              href={import.meta.env.VITE_PAYHIP_URL ?? 'https://payhip.com/StepKorean'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-all border border-indigo-200 hover:border-indigo-300"
            >
              {t('nav.lessonsGuide')}
            </a>
          </nav>
        </div>
      </header>

      {/* Free Materials — Coming soon modal. Rendered outside <header> so `fixed inset-0`
          sizes against the real viewport instead of the header's backdrop-filter containing block. */}
      {showComingSoon && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowComingSoon(false)}
        >
          <div
            className="w-full max-w-xs bg-gray-900 border border-gray-700 rounded-2xl p-6 text-center shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-lg font-bold text-white">{t('materials.comingSoon')}</p>
            <button
              type="button"
              onClick={() => setShowComingSoon(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              {t('common.ok')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
