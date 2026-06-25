import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { auth } from './firebase'
import { isDisposableEmail } from './emailValidation'

interface AuthCtx {
  user: User | null
  loading: boolean
  isGuest: boolean
  setIsGuest: (v: boolean) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<'verify'>
  signInWithGoogle: () => Promise<{ email: string | null }>
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
    if (isDisposableEmail(email)) throw new Error('disposable_email')
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await sendEmailVerification(cred.user)
    await fbSignOut(auth)
    setUser(null)
    return 'verify'
  }

  const signInWithGoogle = async (): Promise<{ email: string | null }> => {
    if (!auth) throw new Error('auth_unavailable')
    const provider = new GoogleAuthProvider()
    // Force account-picker every time so users can switch Google accounts
    provider.setCustomParameters({ prompt: 'select_account' })
    const cred = await signInWithPopup(auth, provider)
    return { email: cred.user.email }
  }

  const logout = async () => {
    if (auth) await fbSignOut(auth)
    setUser(null)
    setIsGuest(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, setIsGuest, signIn, signUp, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
