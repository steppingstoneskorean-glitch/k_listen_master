import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useGamification } from '@/lib/gamification'
import { getDueCount } from '@/lib/review'
import type { LevelKey } from '@/data/gameLevels'
import {
  loadPlan,
  setPlanLevel,
  markStepDone,
  resetPlan,
  orderedDoneCount,
  nextStep,
  ORDERED_STEPS,
  type TodayPlan as PlanState,
  type PlanStepKey,
} from '@/lib/todayPlan'

// ─────────────────────────────────────────────────────────────────────────────
// 홈 · '오늘의 계획'
//   1) 레벨 미선택: 초/중/고급 → 세부선택(초급 별1~4 · 중급/고급 빈칸1~2) → 계획 생성
//   2) 레벨 선택 후: 3단계 세로 타임라인 (게임 → 영상 → 복습). 섀도잉은 옵션.
//   진행률은 원형 링 하나(완료 단계 / 3)로 통합.
// ─────────────────────────────────────────────────────────────────────────────

const LEVEL_TO_MODE: Record<LevelKey, 'B' | 'I' | 'A'> = { beginner: 'B', intermediate: 'I', advanced: 'A' }

/** 원형 진행 링 — 완료 단계 수 / 전체 */
function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? done / total : 0
  const r = 34
  const c = 2 * Math.PI * r
  const complete = done >= total
  return (
    <div className="relative h-[76px] w-[76px] shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={complete ? '#10b981' : '#6366f1'}
          strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <span className="text-2xl">🎉</span>
        ) : (
          <>
            <span className="text-lg font-black leading-none tabular-nums text-slate-900">{done}</span>
            <span className="text-[11px] font-semibold leading-none text-slate-400">/ {total}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function TodayPlan() {
  const { t } = useLang()
  const navigate = useNavigate()
  const { progress } = useGamification()
  const [plan, setPlan] = useState<PlanState>(() => loadPlan())
  const [pendingLevel, setPendingLevel] = useState<LevelKey | null>(null)
  const [dueCount, setDueCount] = useState(0)
  const [dueLoaded, setDueLoaded] = useState(false)

  useEffect(() => {
    setDueCount(getDueCount())
    setDueLoaded(true)
  }, [])

  // 복습할 카드가 하나도 없으면 review 단계를 자동 완료로 본다.
  //   · dueCount 초기값(0)이 '아직 로드 전'인지 '정말 0개'인지 구분하기 위해
  //     dueLoaded 이후에만 판정한다(로드 전 0 때문에 review 가 잘못 완료되던 버그 수정).
  //   · video 단계는 completedVideosToday(받아쓰기·섀도잉도 함께 올림) 로 자동 완료하지
  //     않는다 — 실제 K-Stars 영상 퀴즈를 끝내면 KpopQuiz 가 markStepDone('video') 한다.
  useEffect(() => {
    if (!dueLoaded) return
    if (dueCount === 0 && plan.level && !plan.done.includes('review')) {
      markStepDone('review')
      setPlan(loadPlan())
    }
  }, [dueCount, dueLoaded, plan])

  const levelName = (l: LevelKey) =>
    l === 'beginner' ? t('mode.beginner') : l === 'intermediate' ? t('mode.intermediate') : t('mode.advanced')

  // ── 레벨 확정 → 계획 생성 ──
  const commit = (level: LevelKey, subLevel: number) => {
    setPlan(setPlanLevel(level, subLevel))
    setPendingLevel(null)
  }

  const changeLevel = () => {
    setPlan(resetPlan())
    setPendingLevel(null)
  }

  // ── 단계 실행 (완료 표시 + 이동) ──
  const runStep = (step: PlanStepKey, to: string) => {
    setPlan(markStepDone(step))
    navigate(to)
  }

  const gameRoute = (level: LevelKey, sub: number) =>
    level === 'beginner'
      ? `/game?level=${sub}`
      : `/dictation?mode=${level}&level=${sub}`

  // ════════════════════════════ 1) 레벨 선택 ════════════════════════════
  if (!plan.level) {
    const LEVELS: { id: LevelKey; emoji: string; titleKey: 'home.level1.title' | 'home.level2.title' | 'home.level3.title'; descKey: 'home.level1.desc' | 'home.level2.desc' | 'home.level3.desc'; badge: string }[] = [
      { id: 'beginner', emoji: '🎯', titleKey: 'home.level1.title', descKey: 'home.level1.desc', badge: 'border-emerald-200 bg-emerald-50 text-emerald-600' },
      { id: 'intermediate', emoji: '🗣️', titleKey: 'home.level2.title', descKey: 'home.level2.desc', badge: 'border-blue-200 bg-blue-50 text-blue-600' },
      { id: 'advanced', emoji: '🎙️', titleKey: 'home.level3.title', descKey: 'home.level3.desc', badge: 'border-indigo-200 bg-indigo-50 text-indigo-600' },
    ]

    return (
      <section className="mx-auto w-full max-w-lg px-4 pt-5">
        {/* 헤더 */}
        <div className="animate-hero-fade-up rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/50">
          <div className="flex items-center gap-4">
            <ProgressRing done={0} total={ORDERED_STEPS.length} />
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-500">✦ {t('plan.title')}</span>
              <h2 className="mt-0.5 text-lg font-black text-slate-900 break-keep">{t('plan.chooseTitle')}</h2>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                🔥 {t('gamification.streakFmt').replace('{n}', String(progress.currentStreak))}
              </span>
            </div>
          </div>
        </div>

        {/* 레벨 카드 (고정 별 없음) */}
        <p className="mt-5 px-1 text-sm font-black text-slate-600">{t('plan.levelPrompt')}</p>
        <div className="mt-2.5 flex flex-col gap-2.5">
          {LEVELS.map(l => {
            const sel = pendingLevel === l.id
            return (
              <div key={l.id}>
                <button
                  type="button"
                  onClick={() => setPendingLevel(sel ? null : l.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
                    sel ? 'border-indigo-400 ring-4 ring-indigo-100' : 'border-slate-200'
                  }`}
                >
                  <span className="text-2xl">{l.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-black ${l.badge}`}>{levelName(l.id)}</span>
                      <p className="truncate text-sm font-black text-slate-800">{t(l.titleKey)}</p>
                    </div>
                    <p className="truncate text-[11px] text-slate-400">{t(l.descKey)}</p>
                  </div>
                  <span className={`text-lg ${sel ? 'text-indigo-500' : 'text-slate-300'}`}>{sel ? '▾' : '›'}</span>
                </button>

                {/* 세부 선택 */}
                {sel && (
                  <div className="ka-pop mt-2 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/40 p-3">
                    {l.id === 'beginner' ? (
                      <>
                        <p className="text-xs font-bold text-indigo-600">{t('plan.beginnerSub')}</p>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => commit('beginner', n)}
                              className="rounded-xl border border-indigo-100 bg-white px-3 py-2.5 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
                            >
                              <div className="text-sm tracking-widest text-amber-500">{'★'.repeat(n)}</div>
                              <div className="mt-0.5 text-[11px] font-bold text-slate-500">
                                {n === 4 ? t('plan.gameLevel4') : t('plan.gameLevelFmt').replace('{n}', String(n))}
                              </div>
                            </button>
                          ))}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-400">{t('plan.beginnerSubHint')}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-bold text-indigo-600">{t('plan.blankSub')}</p>
                        <div className="mt-2.5 grid grid-cols-2 gap-2">
                          {[1, 2].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => commit(l.id, n)}
                              className="rounded-xl border border-indigo-100 bg-white px-3 py-3 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-95"
                            >
                              <div className={`text-base font-black ${n === 1 ? 'text-blue-500' : 'text-rose-500'}`}>{'▭'.repeat(n)}</div>
                              <div className="mt-0.5 text-[11px] font-bold text-slate-500">{n === 1 ? t('plan.blank1') : t('plan.blank2')}</div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  // ════════════════════════════ 2) 타임라인 ════════════════════════════
  const level = plan.level
  const doneN = orderedDoneCount(plan)
  const next = nextStep(plan)
  const allDone = next === null

  const subLabel =
    level === 'beginner'
      ? '★'.repeat(plan.subLevel)
      : plan.subLevel === 1 ? t('plan.blank1') : t('plan.blank2')

  type StepDef = {
    key: PlanStepKey
    emoji: string
    title: string
    titleNoTranslate?: boolean
    desc: string
    cta: string
    badge?: ReactNode
    run: () => void
  }

  const STEPS: StepDef[] = [
    {
      key: 'game',
      emoji: '🎯',
      title: t('game.catchTheSound'),
      desc: t('plan.stepGameDesc'),
      cta: t('plan.ctaGame'),
      // 게임 단계는 탭이 아니라 '실제 클리어/게임오버' 시 완료된다(GamePage·DictationPage에서 표시).
      run: () => navigate(gameRoute(level, plan.subLevel)),
    },
    {
      key: 'video',
      emoji: '🎬',
      title: t('plan.stepVideo'),
      desc: t('plan.stepVideoDesc'),
      cta: t('plan.ctaVideo'),
      // 영상 단계는 실제로 영상 퀴즈 1개 완료 시 자동 표시된다(completedVideosToday 효과).
      // videos=1: '오늘의 계획 → 영상' 진입 시 Step & Step 퀴즈를 빼고 K-Stars 영상만 노출
      run: () => navigate(`/games?mode=${LEVEL_TO_MODE[level]}&videos=1`),
    },
    {
      key: 'review',
      emoji: '🔁',
      title: t('mission.cardReview'),
      desc: dueCount > 0 ? t('mission.cardReviewDesc').replace('{n}', String(dueCount)) : t('mission.cardReviewEmpty'),
      cta: t('plan.ctaReview'),
      badge: dueCount > 0 ? dueCount : undefined,
      run: () => runStep('review', '/review'),
    },
  ]

  const stepStatus = (key: PlanStepKey): 'done' | 'active' | 'locked' => {
    if (plan.done.includes(key)) return 'done'
    return key === next ? 'active' : 'locked'
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 pt-5">
      {/* 헤더 */}
      <div className="animate-hero-fade-up rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <ProgressRing done={doneN} total={ORDERED_STEPS.length} />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
              ✦ {t('plan.title')} · {levelName(level)} <span className="tracking-normal text-amber-500">{subLabel}</span>
            </span>
            <h2 className="mt-0.5 truncate text-base font-black text-slate-900">
              {allDone ? t('plan.allDone') : t('plan.nextFmt').replace('{s}', STEPS.find(s => s.key === next)?.title ?? '')}
            </h2>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-bold text-orange-600">
                🔥 {t('gamification.streakFmt').replace('{n}', String(progress.currentStreak))}
              </span>
              <button
                type="button"
                onClick={changeLevel}
                className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                ⟳ {t('plan.changeLevel')}
              </button>
            </div>
          </div>
        </div>
        {allDone && <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{t('plan.allDoneSub')}</p>}
      </div>

      {/* 세로 타임라인 */}
      <div className="mt-4">
        {STEPS.map((s, i) => {
          const status = stepStatus(s.key)
          const last = i === STEPS.length - 1
          const nodeCls =
            status === 'done' ? 'bg-emerald-500 text-white'
            : status === 'active' ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
            : 'bg-slate-100 text-slate-300'
          return (
            <div key={s.key} className="flex gap-3 pb-3">
              {/* 레일 */}
              <div className="relative flex flex-col items-center">
                <div className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${nodeCls}`}>
                  {status === 'done' ? '✓' : status === 'active' ? i + 1 : '🔒'}
                </div>
                {!last && <div className={`absolute top-8 bottom-[-2px] w-[2.5px] ${status === 'done' ? 'bg-emerald-200' : 'bg-slate-200'}`} />}
              </div>

              {/* 카드 */}
              <button
                type="button"
                disabled={status === 'locked'}
                onClick={s.run}
                className={`flex-1 rounded-2xl border p-3.5 text-left transition-all ${
                  status === 'active'
                    ? 'border-indigo-200 bg-white shadow-md shadow-indigo-100 hover:-translate-y-0.5 active:scale-[0.99]'
                    : status === 'done'
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200 bg-white opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.emoji}</span>
                  <span className="text-sm font-black text-slate-900" translate={s.titleNoTranslate ? 'no' : undefined}>{s.title}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    {s.badge !== undefined && (
                      <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-black text-white">{s.badge}</span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      status === 'done' ? 'bg-emerald-50 text-emerald-600'
                      : status === 'active' ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-slate-100 text-slate-400'
                    }`}>
                      {status === 'done' ? t('plan.badgeDone') : status === 'active' ? t('plan.badgeNow') : t('plan.badgeLocked')}
                    </span>
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug text-slate-500 break-keep">{s.desc}</p>
                {status === 'active' && (
                  <span className="mt-2 inline-block rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-black text-white">{s.cta} →</span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* 섀도잉 (옵션) — 강조하지 않는 부가 기능이라 은은한 실선 테두리 + 연한 색 */}
      <button
        type="button"
        onClick={() => navigate('/shadowing')}
        className="mt-1 flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 text-left transition-all hover:bg-slate-50 active:scale-[0.99]"
      >
        <span className="text-xl opacity-60">🎤</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-500">{t('mission.cardShadow')}</p>
          <p className="text-[11px] font-medium text-slate-400">{t('mission.cardShadowDesc')}</p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">{t('plan.optional')}</span>
      </button>
    </section>
  )
}
