import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import AuthModal from '@/components/AuthModal'
import KArtistLive from '@/components/KArtistLive'
import { Stars } from '@/components/kartist/ui'
import { LEVEL_STARS } from '@/data/gameLevels'

/* Scroll-triggered reveal: slides children up once they enter the viewport */
function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const PAYHIP_URL = import.meta.env.VITE_PAYHIP_URL ?? 'https://payhip.com/StepKorean'

export default function HomePage() {
  const { t } = useLang()
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()
  const [modalTarget, setModalTarget] = useState<string | null>(null)
  const [showComingSoon, setShowComingSoon] = useState(false)

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
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      accent: 'hover:border-emerald-300 hover:shadow-emerald-500/10',
      rounds: t('home.level1.rounds'),
      stars: LEVEL_STARS.beginner,
      to: '/game',
    },
    {
      id: 'intermediate',
      emoji: '🗣️',
      label: t('home.level2.label'),
      title: t('home.level2.title'),
      desc: t('home.level2.desc'),
      badge: 'bg-blue-50 text-blue-600 border-blue-200',
      accent: 'hover:border-blue-300 hover:shadow-blue-500/10',
      rounds: t('home.level2.rounds'),
      stars: LEVEL_STARS.intermediate,
      to: '/dictation?mode=intermediate',
    },
    {
      id: 'advanced',
      emoji: '🎙️',
      label: t('home.level3.label'),
      title: t('home.level3.title'),
      desc: t('home.level3.desc'),
      badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      accent: 'hover:border-indigo-300 hover:shadow-indigo-500/10',
      rounds: t('home.level3.rounds'),
      stars: LEVEL_STARS.advanced,
      to: '/dictation?mode=advanced',
    },
  ]

  const STEPS = [
    {
      tag: 'STEP 01',
      title: t('landing.step1.title'),
      icon: (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
            <path d="M6 11h4M8 9v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="15.5" cy="10.5" r="1.1" fill="currentColor" />
            <circle cx="18" cy="13" r="1.1" fill="currentColor" />
            <path d="M7.2 6h9.6a4.8 4.8 0 0 1 4.7 5.7l-.7 3.9a2.6 2.6 0 0 1-4.6 1.1L14.7 15h-5.4l-1.5 1.7a2.6 2.6 0 0 1-4.6-1.1l-.7-3.9A4.8 4.8 0 0 1 7.2 6Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </div>
      ),
      body: (
        <>
          <p className="text-sm leading-relaxed text-slate-500">{t('landing.step1.desc')}</p>
          <p className="mt-2 text-sm font-extrabold text-slate-800">{t('landing.step1.bold')}</p>
        </>
      ),
    },
    {
      tag: 'STEP 02',
      title: t('landing.step2.title'),
      icon: (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-emerald-500">
            <path d="M6 2.5h8L19.5 8v12A1.5 1.5 0 0 1 18 21.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M14 2.5V8h5.5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 13h8M8 16.5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ),
      body: (
        <>
          <p className="text-sm leading-relaxed text-slate-500">{t('landing.step2.desc')}</p>
          <p className="mt-2 text-xs italic text-slate-400">“{t('landing.step2.sub')}”</p>
        </>
      ),
    },
    {
      tag: 'STEP 03',
      title: t('landing.step3.title'),
      icon: (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-emerald-500 shadow-lg shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
            <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9.5" cy="10" r="2" stroke="currentColor" strokeWidth="1.8" />
            <circle cx="15" cy="10.5" r="1.6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M5.8 16.5c.5-1.8 2-2.8 3.7-2.8s3.2 1 3.7 2.8M13.5 14.6c1.5-.5 3.6.2 4.2 1.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      ),
      body: <p className="text-sm leading-relaxed text-slate-500">{t('landing.step3.desc')}</p>,
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

      <div className="bg-gradient-to-b from-white via-slate-50 to-indigo-50 text-slate-900">
        {/* ══ 1. Video Quizzes + Game Selection ══ */}
        <section className="relative overflow-hidden px-6 pt-10 pb-20">
          {/* soft ambient glows */}
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute top-40 -right-20 h-64 w-64 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            {/* Listen to K-Stars — 홈 진입 시 바로 영상 퀴즈 노출 */}
            <div className="animate-hero-fade-up w-full">
              <KArtistLive onPlay={handlePlay} className="" />
            </div>

            {/* Catch the Sound — 레벨 카드 섹션 타이틀 (Listen to K-Stars 와 통일감) */}
            <div className="animate-hero-fade-up mt-16 text-center" style={{ animationDelay: '260ms' }}>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl" translate="no">
                🎯 Catch the <span className="text-emerald-500">Sound</span>
              </h2>
              <p className="mx-auto mt-2 max-w-md text-balance break-keep text-sm font-semibold text-slate-500">{t('realsound.subtitle')}</p>
            </div>

            {/* Game selection cards */}
            <div className="mt-8 grid w-full grid-cols-1 gap-5 md:grid-cols-3">
              {LEVELS.map((card, i) => (
                <div
                  key={card.id}
                  className="animate-hero-fade-up"
                  style={{ animationDelay: `${280 + i * 110}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => handlePlay(card.to)}
                    className={`group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-md shadow-slate-200/60 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl active:scale-[0.98] cursor-pointer ${card.accent}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{card.emoji}</span>
                      <span className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${card.badge}`}>
                        {card.label}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <h3 className="break-keep text-lg font-black text-slate-900">{card.title}</h3>
                      <Stars count={card.stars} ariaLabel={t('kartist.starsAria').replace('{n}', String(card.stars))} className="h-4 w-4 shrink-0" />
                    </div>
                    <p className="mt-1.5 flex-1 text-xs leading-relaxed text-slate-500">{card.desc}</p>
                    <div className="mt-4 flex items-center justify-between text-xs">
                      <span className="text-slate-400">{card.rounds}</span>
                      <span className="font-bold text-emerald-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-1.5">
                        {t('home.startNow')}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {/* Login benefit micro-text */}
            <p className="animate-hero-fade-up mt-8 flex items-center gap-1.5 text-xs font-medium text-slate-500" style={{ animationDelay: '640ms' }}>
              <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-indigo-400">
                <path d="M12 2a5 5 0 0 1 5 5v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v3h6V7a3 3 0 0 0-3-3Z" fill="currentColor" />
              </svg>
              {t('landing.loginBenefit')}
            </p>
          </div>
        </section>

        {/* ══ 2. 3-Step Process ══ */}
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.tag} delay={i * 160}>
                <div className="flex h-full flex-col rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-100">
                  <p className="text-xs font-black tracking-[0.2em] text-indigo-600">{step.tag}</p>
                  <div className="mt-6">{step.icon}</div>
                  <h3 className="mt-6 text-xl font-black text-slate-900">{step.title}</h3>
                  <div className="mt-3">{step.body}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ 3. Dark CTA Banner ══ */}
        <section className="px-6 pb-20">
          <Reveal className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-16 text-center shadow-2xl shadow-slate-900/30 sm:px-12">
              {/* subtle glow inside banner */}
              <div aria-hidden className="pointer-events-none absolute -top-20 left-1/4 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />

              <h2 className="relative text-2xl font-black leading-snug text-white sm:text-4xl">
                {t('landing.ctaTitle1')}
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
                  {t('landing.ctaTitle2')}
                </span>
              </h2>
              <p className="relative mt-4 text-sm leading-relaxed text-slate-400 sm:text-base">
                {t('landing.ctaSub')}
              </p>

              <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowComingSoon(true)}
                  className="w-full rounded-full bg-white px-8 py-4 text-sm font-extrabold text-indigo-600 shadow-lg transition-all duration-200 hover:scale-[1.04] hover:shadow-xl active:scale-[0.97] sm:w-auto cursor-pointer"
                >
                  {t('landing.ctaGuide')}
                </button>
                <a
                  href={PAYHIP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full flex-col items-center rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 px-8 py-3 text-sm font-extrabold leading-tight text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.04] hover:shadow-xl hover:shadow-emerald-500/30 active:scale-[0.97] sm:w-auto"
                >
                  <span>{t('landing.ctaBookLesson')}</span>
                  <span className="text-xs font-semibold opacity-90">{t('landing.ctaBookLessonSub')}</span>
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </>
  )
}
