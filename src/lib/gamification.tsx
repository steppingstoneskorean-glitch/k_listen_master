import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { doc, onSnapshot, runTransaction } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './auth'

export interface UserProgress {
  lastLoginDate: string
  currentStreak: number
  lastCompletionDate: string
  completedVideosToday: number
}

const DEFAULT_PROGRESS: UserProgress = {
  lastLoginDate: '',
  currentStreak: 0,
  lastCompletionDate: '',
  completedVideosToday: 0,
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

interface GamificationCtx {
  progress: UserProgress
  loading: boolean
  markVideoCompleted: () => Promise<void>
}

const GamificationContext = createContext<GamificationCtx>({
  progress: DEFAULT_PROGRESS,
  loading: false,
  markVideoCompleted: async () => {},
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

      const diff = prevLogin ? daysBetween(prevLogin, today) : null
      const nextStreak = diff === 1 ? (data.currentStreak ?? 0) + 1 : 1

      tx.set(ref, {
        lastLoginDate: today,
        currentStreak: nextStreak,
        completedVideosToday: data.completedVideosToday ?? 0,
        lastCompletionDate: data.lastCompletionDate ?? '',
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

  return (
    <GamificationContext.Provider value={{ progress, loading, markVideoCompleted }}>
      {children}
    </GamificationContext.Provider>
  )
}

export function useGamification() {
  return useContext(GamificationContext)
}
