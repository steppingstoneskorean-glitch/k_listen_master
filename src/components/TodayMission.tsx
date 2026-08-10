import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useGamification, goalMet, streakAtRisk } from '@/lib/gamification'
import { getDueCount } from '@/lib/review'
import GoalEditModal from './GoalEditModal'
import ReminderSettings from './ReminderSettings'
import LevelPickerModal from './LevelPickerModal'

/** 목표 진행도를 보여주는 원형 링 */
function GoalRing({ done, goal }: { done: number; goal: number }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? done / goal : 0))
  const r = 34
  const c = 2 * Math.PI * r
  const complete = done >= goal
  return (
    <div className="relative h-[86px] w-[86px] shrink-0">
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
            <span className="text-[11px] font-semibold leading-none text-slate-400">/ {goal}</span>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 홈 상단 '오늘의 미션' 대시보드.
 *   · 스트릭(연속 기록) + 프리즈 상태
 *   · 하루 목표 진행 링 (클릭 시 목표 직접 수정)
 *   · 오늘의 미션 카드 3종 (새 학습 / 복습 / 섀도잉)
 *   · 저녁 리마인더(FCM) 켜기 버튼
 */
export default function TodayMission() {
  const { t } = useLang()
  const navigate = useNavigate()
  const { progress } = useGamification()
  const [dueCount, setDueCount] = useState(0)
  const [showGoal, setShowGoal] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [showLevelPicker, setShowLevelPicker] = useState(false)

  useEffect(() => {
    setDueCount(getDueCount())
  }, [])

  const done = progress.completedVideosToday
  const goal = progress.dailyGoal
  const met = goalMet(progress)
  const atRisk = streakAtRisk(progress)
  const usedFreezeToday = progress.streakFreezeUsedOn === new Date().toISOString().slice(0, 10)

  const nudge = met
    ? t('mission.streakSafe')
    : progress.currentStreak > 0
      ? t('mission.streakAtRisk').replace('{n}', String(progress.currentStreak))
      : t('mission.startStreak')

  const MISSIONS = [
    {
      key: 'new',
      emoji: '🎧',
      title: t('mission.cardNew'),
      desc: t('mission.cardNewDesc'),
      to: '',
      accent: 'hover:border-emerald-300',
      picker: true,
    },
    {
      key: 'review',
      emoji: '🔁',
      title: t('mission.cardReview'),
      desc: dueCount > 0
        ? t('mission.cardReviewDesc').replace('{n}', String(dueCount))
        : t('mission.cardReviewEmpty'),
      to: '/review',
      accent: 'hover:border-indigo-300',
      badge: dueCount > 0 ? dueCount : undefined,
    },
    {
      key: 'shadow',
      emoji: '🎤',
      title: t('mission.cardShadow'),
      desc: t('mission.cardShadowDesc'),
      to: '/shadowing',
      accent: 'hover:border-fuchsia-300',
    },
  ]

  return (
    <>
      {showGoal && <GoalEditModal onClose={() => setShowGoal(false)} />}
      {showReminder && <ReminderSettings onClose={() => setShowReminder(false)} />}
      {showLevelPicker && <LevelPickerModal onClose={() => setShowLevelPicker(false)} />}

      <section className="mx-auto w-full max-w-4xl px-6 pt-6">
        <div className="animate-hero-fade-up rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-lg shadow-slate-200/50 backdrop-blur sm:p-6">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black uppercase tracking-widest text-indigo-500">✦ {t('mission.title')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowReminder(true)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                progress.reminderEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <span>🔔</span>
              <span className="hidden sm:inline">
                {progress.reminderEnabled
                  ? t('mission.reminderOn').replace('{h}', String(progress.reminderHour))
                  : t('mission.reminderOff')}
              </span>
            </button>
          </div>

          {/* Streak + goal ring */}
          <div className="mt-4 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowGoal(true)}
              className="group flex items-center gap-4 rounded-2xl p-1 text-left transition-transform hover:scale-[1.02]"
              aria-label={t('mission.editGoal')}
            >
              <GoalRing done={done} goal={goal} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{t('mission.goalLabel')}</span>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-500">
                    ✎ {t('mission.editGoal')}
                  </span>
                </div>
                <p className={`mt-0.5 text-sm font-semibold ${met ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {met ? t('mission.goalDone') : `${done} / ${goal}`}
                </p>
                {/* Streak */}
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-bold text-orange-600">
                    🔥 {t('gamification.streakFmt').replace('{n}', String(progress.currentStreak))}
                  </span>
                  {progress.freezeTokens > 0 && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-xs font-bold text-sky-600"
                      title={t('mission.freezeTip')}
                    >
                      🧊 {t('mission.freezeAvail').replace('{n}', String(progress.freezeTokens))}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Nudge line */}
          <div
            className={`mt-4 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
              met
                ? 'bg-emerald-50 text-emerald-700'
                : atRisk
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-indigo-50 text-indigo-700'
            }`}
          >
            <span>{met ? '✅' : atRisk ? '⚡' : '👋'}</span>
            <span className="break-keep">{nudge}</span>
          </div>
          {usedFreezeToday && (
            <p className="mt-2 text-xs font-medium text-sky-600">{t('mission.freezeUsed')}</p>
          )}

          {/* Mission cards */}
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {MISSIONS.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => (m.picker ? setShowLevelPicker(true) : navigate(m.to))}
                className={`group relative flex flex-col items-start gap-1 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${m.accent}`}
              >
                {m.badge !== undefined && (
                  <span className="absolute right-2 top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-black text-white">
                    {m.badge}
                  </span>
                )}
                <span className="text-2xl transition-transform group-hover:scale-110">{m.emoji}</span>
                <span className="mt-0.5 text-sm font-black text-slate-800">{m.title}</span>
                <span className="text-[11px] leading-snug text-slate-400 break-keep">{m.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
