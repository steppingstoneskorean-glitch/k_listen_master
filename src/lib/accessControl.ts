// src/lib/accessControl.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 사용자 등급(tier) 기반 K-Artist Live 영상 접근 제어
//
//   · users/{uid} 문서 스키마: tier, lastUnlockedDate('YYYY-MM-DD', KST), unlockedVideoId
//   · tier 는 클라이언트가 절대 쓰지 않는다 — 문서에 없으면 'BETA_FREE' 로 취급한다.
//     (요금제 부여는 나중에 신뢰된 백엔드에서만 수행 — 지금은 그 경로 자체가 없음)
//   · BETA_FREE / PREMIUM: 무제한. NORMAL_FREE: 하루 1개 영상만 새로 선택 가능,
//     같은 영상은 그날 몇 번이든 재생 가능.
//   · 현재는 모든 유저가 BETA_FREE 이므로 이 게이팅은 항상 allowed:true — 나중에
//     실제로 NORMAL_FREE 를 부여하기 시작할 때를 위한 미리 짜둔 로직이다.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, createElement } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './auth'

export type UserTier = 'BETA_FREE' | 'NORMAL_FREE' | 'PREMIUM'

export interface UnlockState {
  lastUnlockedDate?: string
  unlockedVideoId?: string
}

export interface AccessResult {
  allowed: boolean
  reason?: 'daily_limit'
}

/** 오늘 날짜를 KST(Asia/Seoul) 기준 'YYYY-MM-DD' 문자열로 반환 — 자정 리셋 기준 */
export function getTodayKST(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

/** 순수 함수: tier + 현재 unlock 상태 + 요청 videoId → 허용 여부 */
export function checkVideoAccess(tier: UserTier, unlock: UnlockState, videoId: string): AccessResult {
  if (tier !== 'NORMAL_FREE') return { allowed: true }

  const today = getTodayKST()
  if (unlock.lastUnlockedDate !== today) return { allowed: true } // 오늘의 새 패스 사용 가능
  if (unlock.unlockedVideoId === videoId) return { allowed: true } // 오늘 이미 고른 그 영상 재생
  return { allowed: false, reason: 'daily_limit' }
}

interface VideoAccessCtx {
  tier: UserTier
  loading: boolean
  checkAccess: (videoId: string) => AccessResult
  /** checkAccess 가 allowed 일 때만 호출 — 오늘 첫 선택이면 unlock 상태를 기록한다 */
  unlock: (videoId: string) => Promise<void>
}

const VideoAccessContext = createContext<VideoAccessCtx>({
  tier: 'BETA_FREE',
  loading: false,
  checkAccess: () => ({ allowed: true }),
  unlock: async () => {},
})

export function VideoAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [unlockState, setUnlockState] = useState<UnlockState>({})
  const [tier, setTier] = useState<UserTier>('BETA_FREE')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!db || !user) {
      setTier('BETA_FREE')
      setUnlockState({})
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      snap => {
        const data = snap.data() as (Partial<UnlockState> & { tier?: UserTier }) | undefined
        setTier(data?.tier ?? 'BETA_FREE')
        setUnlockState({ lastUnlockedDate: data?.lastUnlockedDate, unlockedVideoId: data?.unlockedVideoId })
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  const checkAccess = useCallback((videoId: string) => checkVideoAccess(tier, unlockState, videoId), [tier, unlockState])

  const unlock = useCallback(
    async (videoId: string) => {
      if (!db || !user) return
      const today = getTodayKST()
      if (unlockState.lastUnlockedDate === today) return // 오늘 이미 패스를 사용함 — 상태 변경 없음
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { lastUnlockedDate: today, unlockedVideoId: videoId }, { merge: true })
      setUnlockState({ lastUnlockedDate: today, unlockedVideoId: videoId })
    },
    [user, unlockState],
  )

  return createElement(VideoAccessContext.Provider, { value: { tier, loading, checkAccess, unlock } }, children)
}

export function useVideoAccess() {
  return useContext(VideoAccessContext)
}
