import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { doc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './auth'

export interface UserProgress {
  lastLoginDate: string
  currentStreak: number
  lastCompletionDate: string
  completedVideosToday: number
  /** 사용자가 스스로 정하는 하루 목표 학습량 (완료 세션 수). 1~20 */
  dailyGoal: number
  /** 스트릭 프리즈 토큰 — 하루를 빠져도 스트릭을 지켜주는 '봐주기' 재화 */
  freezeTokens: number
  /** 마지막으로 프리즈가 소비된 날짜(YYYY-MM-DD). 대시보드에 "프리즈 사용됨" 표시용 */
  streakFreezeUsedOn: string
  /** 저녁 리마인더(FCM 푸시) 사용 여부 */
  reminderEnabled: boolean
  /** 리마인더 발송 시각 (로컬 기준 0~23시) */
  reminderHour: number
}

const DEFAULT_GOAL = 3
const DEFAULT_FREEZE_TOKENS = 2
const MAX_FREEZE_TOKENS = 3

const DEFAULT_PROGRESS: UserProgress = {
  lastLoginDate: '',
  currentStreak: 0,
  lastCompletionDate: '',
  completedVideosToday: 0,
  dailyGoal: DEFAULT_GOAL,
  freezeTokens: DEFAULT_FREEZE_TOKENS,
  streakFreezeUsedOn: '',
  reminderEnabled: false,
  reminderHour: 20,
}

function clampGoal(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_GOAL
  return Math.max(1, Math.min(20, Math.round(n)))
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Whole-day difference between two 'YYYY-MM-DD' strings (to - from), ignoring local time-of-day.
function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number)
  const [ty, tm, td] = to.split('-').map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86400000)
}

// Client-side "midnight reset" for completedVideosToday: only applied to what's
// shown, the stored doc is lazily corrected next time markVideoCompleted runs.
function applyDailyReset(data: UserProgress): UserProgress {
  return data.lastCompletionDate !== todayStr()
    ? { ...data, completedVideosToday: 0 }
    : data
}

/** 오늘 목표를 달성했는지 */
export function goalMet(p: UserProgress): boolean {
  return p.completedVideosToday >= p.dailyGoal
}

/**
 * 스트릭이 '위험'한 상태인지 — 오늘 아직 학습을 하나도 완료하지 않았고,
 * 지켜야 할 연속 기록이 있는 경우. 대시보드에서 "오늘 학습하면 연속 유지" 넛지에 사용.
 */
export function streakAtRisk(p: UserProgress): boolean {
  return p.currentStreak > 0 && p.completedVideosToday === 0
}

interface GamificationCtx {
  progress: UserProgress
  loading: boolean
  markVideoCompleted: () => Promise<void>
  /** 하루 목표 학습량을 사용자가 직접 설정 */
  setDailyGoal: (n: number) => Promise<void>
  /** 리마인더(FCM) 사용 여부/시각/언어를 저장 */
  setReminderPrefs: (prefs: { enabled?: boolean; hour?: number; lang?: string }) => Promise<void>
}

const GamificationContext = createContext<GamificationCtx>({
  progress: DEFAULT_PROGRESS,
  loading: false,
  markVideoCompleted: async () => {},
  setDailyGoal: async () => {},
  setReminderPrefs: async () => {},
})

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS)
  const [loading, setLoading] = useState(false)

  // Real-time subscription to this user's progress doc
  useEffect(() => {
    if (!db || !user) {
      setProgress(DEFAULT_PROGRESS)
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      snap => {
        setProgress(applyDailyReset({ ...DEFAULT_PROGRESS, ...(snap.data() as Partial<UserProgress> | undefined) }))
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  // Streak bookkeeping: runs once per day, the first time this user is seen logged in
  useEffect(() => {
    if (!db || !user) return
    const ref = doc(db, 'users', user.uid)
    runTransaction(db, async tx => {
      const snap = await tx.get(ref)
      const data = (snap.exists() ? snap.data() : {}) as Partial<UserProgress>
      const today = todayStr()
      const prevLogin = data.lastLoginDate ?? ''
      if (prevLogin === today) return // already recorded today

      const prevStreak = data.currentStreak ?? 0
      const diff = prevLogin ? daysBetween(prevLogin, today) : null

      // ── 스트릭 계산 (프리즈 반영) ──
      //   diff === 1  : 어제도 접속 → 정상적으로 +1
      //   diff === 2  : 딱 하루 빠짐 → 프리즈 토큰이 있으면 1개 소비하고 스트릭 유지(+1)
      //   그 외(더 오래 빠짐 / 토큰 없음) : 스트릭 리셋(1)
      let tokens = data.freezeTokens ?? DEFAULT_FREEZE_TOKENS
      let freezeUsedOn = data.streakFreezeUsedOn ?? ''
      let nextStreak: number
      if (diff === 1) {
        nextStreak = prevStreak + 1
      } else if (diff === 2 && tokens > 0) {
        nextStreak = prevStreak + 1
        tokens -= 1
        freezeUsedOn = today
      } else {
        nextStreak = 1
      }

      // 7일 연속 달성마다 프리즈 토큰 1개 보충 (상한 MAX_FREEZE_TOKENS)
      if (nextStreak > prevStreak && nextStreak % 7 === 0) {
        tokens = Math.min(MAX_FREEZE_TOKENS, tokens + 1)
      }

      tx.set(ref, {
        lastLoginDate: today,
        currentStreak: nextStreak,
        freezeTokens: tokens,
        streakFreezeUsedOn: freezeUsedOn,
        completedVideosToday: data.completedVideosToday ?? 0,
        lastCompletionDate: data.lastCompletionDate ?? '',
        // 신규 사용자/기존 문서에 목표 필드가 없으면 기본값을 채워둔다
        dailyGoal: data.dailyGoal ?? DEFAULT_GOAL,
      }, { merge: true })
    }).catch(err => console.warn('Failed to record login streak:', err))
  }, [user])

  const markVideoCompleted = useCallback(async () => {
    if (!db || !user) return
    const ref = doc(db, 'users', user.uid)
    try {
      await runTransaction(db, async tx => {
        const snap = await tx.get(ref)
        const data = (snap.exists() ? snap.data() : {}) as Partial<UserProgress>
        const today = todayStr()
        const sameDay = data.lastCompletionDate === today
        tx.set(ref, {
          completedVideosToday: (sameDay ? data.completedVideosToday ?? 0 : 0) + 1,
          lastCompletionDate: today,
        }, { merge: true })
      })
    } catch (err) {
      console.warn('Failed to record video completion:', err)
    }
  }, [user])

  const setDailyGoal = useCallback(async (n: number) => {
    if (!db || !user) return
    const goal = clampGoal(n)
    const ref = doc(db, 'users', user.uid)
    // 낙관적 업데이트 — 스냅샷이 곧 덮어쓴다
    setProgress(prev => ({ ...prev, dailyGoal: goal }))
    try {
      await setDoc(ref, { dailyGoal: goal }, { merge: true })
    } catch (err) {
      console.warn('Failed to save daily goal:', err)
    }
  }, [user])

  const setReminderPrefs = useCallback(async (prefs: { enabled?: boolean; hour?: number; lang?: string }) => {
    if (!db || !user) return
    const ref = doc(db, 'users', user.uid)
    const patch: Record<string, unknown> = {}
    if (typeof prefs.enabled === 'boolean') patch.reminderEnabled = prefs.enabled
    if (typeof prefs.hour === 'number') patch.reminderHour = Math.max(0, Math.min(23, Math.round(prefs.hour)))
    if (typeof prefs.lang === 'string') patch.lang = prefs.lang
    // 서버 발송기가 사용자의 로컬 시각을 계산할 수 있도록 IANA 타임존을 함께 저장
    try {
      patch.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    } catch {
      patch.timezone = 'UTC'
    }
    setProgress(prev => ({
      ...prev,
      reminderEnabled: typeof prefs.enabled === 'boolean' ? prefs.enabled : prev.reminderEnabled,
      reminderHour: typeof prefs.hour === 'number' ? patch.reminderHour as number : prev.reminderHour,
    }))
    try {
      await setDoc(ref, patch, { merge: true })
    } catch (err) {
      console.warn('Failed to save reminder prefs:', err)
    }
  }, [user])

  return (
    <GamificationContext.Provider value={{ progress, loading, markVideoCompleted, setDailyGoal, setReminderPrefs }}>
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  return useContext(GamificationContext)
}
