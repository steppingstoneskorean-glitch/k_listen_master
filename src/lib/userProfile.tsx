// src/lib/userProfile.tsx
// 리더보드 닉네임 프로필 — users/{uid} 문서의 leaderboardNickname 필드를 관리한다.
//   · gamification.tsx 와 같은 문서를 공유하지만(merge:true) 관심사를 분리해 별도 관리한다.
//   · 최초 1회만 닉네임을 물어보고, 이후 모든 점수 제출에 재사용한다.

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { useAuth } from './auth'

export type GoalPreset = 'drama' | 'kpop' | 'travel' | 'topik' | 'work' | 'custom'
/** 사용자의 대표 학습 목표(선택). custom 이면 text 사용. 향후 개인화용 구조화 필드. */
export interface UserGoal { preset: GoalPreset; text?: string }

interface UserProfileCtx {
  nickname: string | null
  goal: UserGoal | null
  loading: boolean
  saveNickname: (name: string) => Promise<void>
  saveGoal: (goal: UserGoal | null) => Promise<void>
}

const UserProfileContext = createContext<UserProfileCtx>({
  nickname: null,
  goal: null,
  loading: false,
  saveNickname: async () => {},
  saveGoal: async () => {},
})

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [nickname, setNickname] = useState<string | null>(null)
  const [goal, setGoal] = useState<UserGoal | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!db || !user) {
      setNickname(null)
      setGoal(null)
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', user.uid)
    const unsub = onSnapshot(
      ref,
      snap => {
        const data = snap.data() as { leaderboardNickname?: string; goal?: UserGoal } | undefined
        setNickname(data?.leaderboardNickname?.trim() || null)
        setGoal(data?.goal ?? null)
        setLoading(false)
      },
      () => setLoading(false),
    )
    return unsub
  }, [user])

  const saveNickname = useCallback(
    async (name: string) => {
      const trimmed = name.trim()
      if (!db || !user || !trimmed) return
      const ref = doc(db, 'users', user.uid)
      await setDoc(ref, { leaderboardNickname: trimmed }, { merge: true })
      setNickname(trimmed) // onSnapshot 이 곧 같은 값으로 재확인해준다
    },
    [user],
  )

  const saveGoal = useCallback(
    async (next: UserGoal | null) => {
      if (!db || !user) return
      const ref = doc(db, 'users', user.uid)
      setGoal(next) // 낙관적 — onSnapshot 이 곧 재확인
      await setDoc(ref, { goal: next }, { merge: true })
    },
    [user],
  )

  return (
    <UserProfileContext.Provider value={{ nickname, goal, loading, saveNickname, saveGoal }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  return useContext(UserProfileContext)
}
