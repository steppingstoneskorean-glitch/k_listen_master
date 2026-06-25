import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

const LEVELS = [
  {
    emoji: '🎯',
    labelKey: 'BEGINNER',
    title: 'Ear-Opening Room',
    desc: '불 vs 뿔, 살 vs 쌀 — catch subtle phonetic differences through card-tap drills.',
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    hover: 'hover:border-green-500/40 hover:shadow-green-500/5 cursor-pointer',
    rounds: 'Level 1–4 · Card tap',
    comingSoon: false,
    to: '/game',
  },
  {
    emoji: '🗣️',
    labelKey: 'INTERMEDIATE',
    title: 'Real-Life Dictation',
    desc: 'Restaurants, subways, phone calls — type exactly what you hear in everyday situations.',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hover: 'hover:border-blue-500/40 hover:shadow-blue-500/5 cursor-pointer',
    rounds: '10 questions · Dictation',
    comingSoon: false,
    to: '/dictation?mode=intermediate',
  },
  {
    emoji: '🎙️',
    labelKey: 'ADVANCED',
    title: 'Media & Professional',
    desc: 'Master connected speech from news briefings, business meetings, and variety shows.',
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    hover: 'hover:border-indigo-500/40 hover:shadow-indigo-500/5 cursor-pointer',
    rounds: '10 questions · Dictation',
    comingSoon: false,
    to: '/dictation?mode=advanced',
  },
]

export default function HomePage() {
  const { t } = useLang()

  return (
    <div className="flex flex-col">
      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-6 py-10" style={{ minHeight: 'calc(100vh - 5rem)' }}>
        <p className="text-gray-600 text-xs tracking-widest uppercase mb-8">
          {t('home.chooseLevel')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
          {LEVELS.map(card => {
            const inner = (
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
                  {card.labelKey}
                </span>
                <h3 className="text-base font-black text-white">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed flex-1">{card.desc}</p>
                <div className={`text-xs mt-1 ${card.comingSoon ? 'text-gray-600' : 'text-gray-700'}`}>
                  {card.comingSoon ? t('home.comingSoon') : card.rounds}
                </div>
              </div>
            )

            const cls = `flex flex-col p-6 rounded-2xl border border-gray-800 bg-gray-900 hover:shadow-xl transition-all duration-200 ${card.hover}`

            return card.comingSoon ? (
              <div key={card.labelKey} className={cls}>{inner}</div>
            ) : (
              <Link key={card.labelKey} to={card.to} className={cls}>{inner}</Link>
            )
          })}
        </div>

        <div className="mt-10">
          <Link
            to="/game"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-indigo-500/30 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-200"
          >
            {t('home.startNow')}
          </Link>
        </div>

        <p className="mt-10 text-gray-700 text-xs">{t('home.scrollMore')}</p>
      </section>

      {/* ── Below-fold ── */}
      <section className="border-t border-gray-800 px-6 py-10 text-center">
        <h1 className="text-[1.4625rem] font-extrabold tracking-tight text-white leading-snug">
          Stop feeling nervous when speaking Korean.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            Speak like a local.
          </span>
        </h1>
        <p className="mt-2 text-[0.975rem] text-gray-500 leading-relaxed max-w-xl mx-auto">
          Whether you are a beginner struggling to hear or an advanced learner blocked by
          pronunciation barriers — start practicing with Step Korean to open your ears and
          perfect your accent.
        </p>
      </section>
    </div>
  )
}
