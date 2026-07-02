import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import AuthModal from '@/components/AuthModal'

export default function HomePage() {
  const { t } = useLang()
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()
  const [modalTarget, setModalTarget] = useState<string | null>(null)

  const handlePlay = (to: string) => {
    if (user || isGuest) {
      navigate(to)
    } else {
      setModalTarget(to)
    }
  }

  const LEVELS = [
    {
      id: 'beginner',
      emoji: '🎯',
      label: t('home.level1.label'),
      title: t('home.level1.title'),
      desc: t('home.level1.desc'),
      badge: 'bg-green-500/10 text-green-400 border-green-500/20',
      hover: 'hover:border-green-500/40 hover:shadow-green-500/5',
      rounds: t('home.level1.rounds'),
      comingSoon: false,
      to: '/game',
    },
    {
      id: 'intermediate',
      emoji: '🗣️',
      label: t('home.level2.label'),
      title: t('home.level2.title'),
      desc: t('home.level2.desc'),
      badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      hover: 'hover:border-blue-500/40 hover:shadow-blue-500/5',
      rounds: t('home.level2.rounds'),
      comingSoon: false,
      to: '/dictation?mode=intermediate',
    },
    {
      id: 'advanced',
      emoji: '🎙️',
      label: t('home.level3.label'),
      title: t('home.level3.title'),
      desc: t('home.level3.desc'),
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      hover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/5',
      rounds: t('home.level3.rounds'),
      comingSoon: false,
      to: '/dictation?mode=advanced',
    },
  ]

  return (
    <>
      {modalTarget && (
        <AuthModal
          targetPath={modalTarget}
          onClose={() => setModalTarget(null)}
        />
      )}

      <div className="flex flex-col">
        {/* ── Hero ── */}
        <section className="flex flex-col items-center justify-center px-6 py-10" style={{ minHeight: 'calc(100vh - 5rem)' }}>
          <p className="text-gray-600 text-xs tracking-widest uppercase mb-8">
            {t('home.chooseLevel')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
            {LEVELS.map(card => (
              <div
                key={card.id}
                onClick={() => !card.comingSoon && handlePlay(card.to)}
                className={`flex flex-col p-6 rounded-2xl border border-gray-800 bg-gray-900 hover:shadow-xl transition-all duration-200 ${card.hover} ${card.comingSoon ? 'opacity-60' : 'cursor-pointer'}`}
              >
                <div className="flex flex-col gap-3 h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{card.emoji}</span>
                    {card.comingSoon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700 tracking-wide">
                        {t('home.comingSoon')}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border w-fit ${card.badge}`}>
                    {card.label}
                  </span>
                  <h3 className="text-base font-black text-white">{card.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.desc}</p>
                  <div className={`text-xs mt-1 ${card.comingSoon ? 'text-gray-600' : 'text-gray-700'}`}>
                    {card.comingSoon ? t('home.comingSoon') : card.rounds}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-gray-700 text-xs">{t('home.scrollMore')}</p>
        </section>

        {/* ── Below-fold ── */}
        <section className="border-t border-gray-800 px-6 py-10 text-center">
          <h1 className="text-[1.4625rem] font-extrabold tracking-tight text-white leading-snug">
            {t('home.pitchLine1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              {t('home.pitchLine2')}
            </span>
          </h1>
          <p className="mt-2 text-[0.975rem] text-gray-500 leading-relaxed max-w-xl mx-auto">
            {t('home.pitchDesc')}
          </p>
        </section>
      </div>
    </>
  )
}
