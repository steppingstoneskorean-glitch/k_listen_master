import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth } from './firebase'

interface AuthCtx {
  user: User | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (v: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<'verify'>
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

  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('auth_unavailable')
    const cred = await signInWithEmailAndPassword(auth, email, password)
    if (!cred.user.emailVerified) {
      await fbSignOut(auth)
      setUser(null)
      throw new Error('email_not_verified')
    }
  }

  const signUp = async (email: string, password: string, displayName: string): Promise<'verify'> => {
    if (!auth) throw new Error('auth_unavailable')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await sendEmailVerification(cred.user)
    await fbSignOut(auth)
    setUser(null)
    return 'verify'
  }

  const logout = async () => {
    if (auth) await fbSignOut(auth)
    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, setIsGuest, signIn, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
