import { Link } from 'react-router-dom'
import logoImg from '../../../assets/images/logo.png'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useGamification } from '@/lib/gamification'

// 슬림 상단바 — 로고 + 연속(스트릭) + 언어.
//   1차 내비게이션(게임/복습/문법/프로필 등)은 하단 탭바(BottomNav)와 프로필 탭으로 이동.
export default function Header() {
  const { t } = useLang()
  const { user } = useAuth()
  const { progress } = useGamification()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={logoImg} alt="K-Listen Master" className="h-7 w-auto shrink-0 rounded-lg object-contain" />
          <span className="truncate text-base font-black">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">K-Listen</span>
            <span className="text-slate-900"> Master</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          {user && (
            <span className="flex items-center gap-1 whitespace-nowrap rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
              🔥 {t('gamification.streakFmt').replace('{n}', String(progress.currentStreak))}
            </span>
          )}
          <LanguageSwitcher compact />
        </div>
      </div>
    </header>
  )
}
