import { Link, useNavigate } from 'react-router-dom'
import logoImg from '../../../assets/images/logo.jpg'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'

export default function Header() {
  const { t } = useLang()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoImg} alt="Step Korean" className="h-8 w-auto rounded-lg object-contain" />
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Step</span>
          <span className="text-xl font-black text-white">Korean</span>
        </Link>

        {/* Right nav */}
        <nav className="flex items-center gap-2 flex-wrap justify-end">
          {/* 게임 */}
          <Link
            to="/"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700"
          >
            {t('nav.game')}
          </Link>

          {/* 무료 자료 */}
          <Link
            to="/materials"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700"
          >
            {t('nav.freeMaterials')}
          </Link>

          {/* 오답 확인 */}
          <Link
            to="/errors"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all border border-transparent hover:border-gray-700"
          >
            {t('nav.reviewErrors')}
          </Link>

          {/* 수업 & 교재 */}
          <a
            href={import.meta.env.VITE_PAYHIP_URL ?? 'https://payhip.com/StepKorean'}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-all border border-indigo-500/30 hover:border-indigo-400/60"
          >
            {t('nav.lessonsGuide')}
          </a>

          {/* Language switcher */}
          <LanguageSwitcher compact />

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 hidden sm:block truncate max-w-[100px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-gray-800 hover:border-red-500/30"
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
        </nav>
      </div>
    </header>
  )
}
