import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  deleteUser,
  reauthenticateWithPopup,
} from 'firebase/auth'
import { doc, deleteDoc } from 'firebase/firestore'
import { auth, db } from './firebase'

interface AuthCtx {
  user: User | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (v: boolean) => void
  signInWithGoogle: () => Promise<{ email: string | null; uid: string }>
  signInWithApple: () => Promise<{ email: string | null; uid: string }>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (!auth) { setLoading(false); return }
    return onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  const signInWithGoogle = async (): Promise<{ email: string | null; uid: string }> => {
    if (!auth) throw new Error('auth_unavailable')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const cred = await signInWithPopup(auth, provider)
    return { email: cred.user.email, uid: cred.user.uid }
  }

  const signInWithApple = async (): Promise<{ email: string | null; uid: string }> => {
    if (!auth) throw new Error('auth_unavailable')
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    const cred = await signInWithPopup(auth, provider)
    return { email: cred.user.email, uid: cred.user.uid }
  }

  const logout = async () => {
    if (auth) await fbSignOut(auth)
    setUser(null)
    setIsGuest(false)
  }

  // 인앱 계정 삭제 (GDPR 삭제권 + Google Play/Apple 심사 요구).
  //   1) Firestore 사용자 데이터 삭제 — 계정을 지우기 전에 먼저 지워야 한다.
  //      삭제 후에는 request.auth 가 null 이라 규칙상 문서를 못 지운다.
  //      모든 사용자 데이터는 단일 users/{uid} 문서에 있다(서브컬렉션 없음).
  //   2) Firebase 인증 계정 삭제 — 최근 로그인이 오래됐으면 소셜 재인증 후 재시도.
  const deleteAccount = async () => {
    const u = auth?.currentUser
    if (!auth || !u) throw new Error('auth_unavailable')

    if (db) {
      try {
        await deleteDoc(doc(db, 'users', u.uid))
      } catch {
        /* 문서가 없거나 일시 오류 — 계정 삭제는 계속 진행 */
      }
    }

    try {
      await deleteUser(u)
    } catch (err) {
      if ((err as { code?: string })?.code === 'auth/requires-recent-login') {
        const providerId = u.providerData[0]?.providerId
        const provider =
          providerId === 'apple.com' ? new OAuthProvider('apple.com') : new GoogleAuthProvider()
        await reauthenticateWithPopup(u, provider) // 팝업 취소 시 throw → 호출부에서 안내
        await deleteUser(u)
      } else {
        throw err
      }
    }

    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, setIsGuest, signInWithGoogle, signInWithApple, logout, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
