import { Link, useLocation } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

// 하단 고정 탭바 (app5 스타일) — 홈 · 게임 · 복습 · 프로필.
//   · 상단의 긴 메뉴를 대체하는 앱형 1차 내비게이션.
//   · safe-area(제스처 바) 고려한 하단 여백. 라이트 테마.

type Tab = {
  to: string
  key: 'home' | 'game' | 'review' | 'profile'
  label: string
  icon: (active: boolean) => React.ReactNode
  match: (path: string) => boolean
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      {children}
    </svg>
  )
}

export default function BottomNav() {
  const { t } = useLang()
  const { pathname } = useLocation()

  const tabs: Tab[] = [
    {
      to: '/',
      key: 'home',
      label: t('nav.home'),
      match: p => p === '/',
      icon: () => <Icon><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></Icon>,
    },
    {
      to: '/games',
      key: 'game',
      label: t('nav.game'),
      match: p => p.startsWith('/games') || p.startsWith('/game') || p.startsWith('/dictation') || p.startsWith('/shadowing') || p.startsWith('/kpop-quiz'),
      icon: () => <Icon><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M8 12h3M9.5 10.5v3" /><circle cx="16" cy="11" r="1" /><circle cx="18" cy="14" r="1" /></Icon>,
    },
    {
      to: '/review',
      key: 'review',
      label: t('nav.review'),
      match: p => p.startsWith('/review'),
      icon: () => <Icon><path d="M4 12a8 8 0 1 1 2.3 5.6" /><path d="M4 20v-4h4" /></Icon>,
    },
    {
      to: '/profile',
      key: 'profile',
      label: t('nav.profile'),
      match: p => p.startsWith('/profile'),
      icon: () => <Icon><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c1-3.6 4-5.5 7-5.5s6 1.9 7 5.5" /></Icon>,
    },
  ]

  return (
    <nav
      aria-label={t('plan.title')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="mx-auto flex max-w-lg items-stretch">
        {tabs.map(tab => {
          const active = tab.match(pathname)
          return (
            <Link
              key={tab.key}
              to={tab.to}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-bold transition-colors ${
                active ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon(active)}
              <span>{tab.label}</span>
              <span className={`mt-0.5 h-1 w-1 rounded-full ${active ? 'bg-indigo-600' : 'bg-transparent'}`} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
