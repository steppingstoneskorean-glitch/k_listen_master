import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

// 듣기 허브 — 리스닝 디코딩 3개 모드 진입점. 하단탭 '듣기'에서 도달(Layout 래핑).
//   각 카드는 풀스크린 훈련 모드로 이동: 소리 듣기(/notice) · 디코드(/decode) · 소리 구별(/contrast).
export default function ListenHubPage() {
  const { t } = useLang()

  const cards = [
    { to: '/notice', emoji: '👂', titleKey: 'listen.notice.title', descKey: 'listen.notice.desc' },
    { to: '/decode', emoji: '🎧', titleKey: 'listen.decode.title', descKey: 'listen.decode.desc' },
    { to: '/contrast', emoji: '🔀', titleKey: 'listen.contrast.title', descKey: 'listen.contrast.desc' },
  ] as const

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 pb-8 pt-6">
        <header>
          <h1 className="text-2xl font-black text-slate-900">{t('listen.hubTitle')}</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{t('listen.hubSubtitle')}</p>
        </header>

        <div className="flex flex-col gap-3">
          {cards.map(c => (
            <Link
              key={c.to}
              to={c.to}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-indigo-300"
            >
              <span className="text-3xl leading-none">{c.emoji}</span>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900">{t(c.titleKey)}</span>
                <span className="text-xs leading-snug text-slate-500">{t(c.descKey)}</span>
              </div>
              <span className="ml-auto text-lg text-slate-300">›</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
