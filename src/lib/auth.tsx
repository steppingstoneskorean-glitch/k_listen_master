import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signOut as fbSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthCtx {
  user: User | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (v: boolean) => void
  signInWithGoogle: () => Promise<{ email: string | null }>
  signInWithApple: () => Promise<{ email: string | null }>
  logout: () => Promise<void>
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

  const signInWithGoogle = async (): Promise<{ email: string | null }> => {
    if (!auth) throw new Error('auth_unavailable')
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    const cred = await signInWithPopup(auth, provider)
    return { email: cred.user.email }
  }

  const signInWithApple = async (): Promise<{ email: string | null }> => {
    if (!auth) throw new Error('auth_unavailable')
    const provider = new OAuthProvider('apple.com')
    provider.addScope('email')
    provider.addScope('name')
    const cred = await signInWithPopup(auth, provider)
    return { email: cred.user.email }
  }

  const logout = async () => {
    if (auth) await fbSignOut(auth)
    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, setIsGuest, signInWithGoogle, signInWithApple, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
