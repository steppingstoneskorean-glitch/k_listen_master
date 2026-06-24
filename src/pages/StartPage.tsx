import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import logoImg from '../../assets/images/logo.jpg'

type Panel = 'choice' | 'signin' | 'signup' | 'verify'

export default function StartPage() {
  const { t } = useLang()
  const { signIn, signUp, setIsGuest, user, loading } = useAuth()
  const navigate = useNavigate()

  const [panel, setPanel] = useState<Panel>('choice')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Already logged in → redirect
  if (!loading && user) {
    navigate('/home', { replace: true })
    return null
  }

  const reset = () => { setEmail(''); setPassword(''); setDisplayName(''); setError('') }

  const handleGuest = () => {
    setIsGuest(true)
    navigate('/home')
  }

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(email, password)
      navigate('/home')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'email_not_verified') {
        setError(t('auth.emailNotVerified'))
      } else {
        setError('Invalid email or password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (displayName.trim().length < 2) { setError('Display name must be at least 2 characters.'); return }
    setSubmitting(true)
    try {
      await signUp(email, password, displayName.trim())
      setPanel('verify')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('email-already-in-use')) {
        setError('Email already in use.')
      } else if (msg.includes('weak-password')) {
        setError('Password must be at least 6 characters.')
      } else {
        setError('Sign up failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Language switcher — top right */}
      <div className="absolute top-5 right-5 z-10">
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <img src={logoImg} alt="Step Korean" className="h-14 w-auto rounded-2xl object-contain shadow-lg" />
          <h1 className="text-3xl font-black tracking-tight text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">Step</span>
            {' '}
            <span className="text-white">Korean</span>
          </h1>
          <p className="text-gray-500 text-sm text-center leading-relaxed max-w-[260px]">
            {t('start.tagline')}
          </p>
        </div>

        {/* ── Choice panel ── */}
        {panel === 'choice' && (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={() => { reset(); setPanel('signin') }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/25"
            >
              {t('start.login')}
            </button>
            <button
              onClick={handleGuest}
              className="w-full py-4 rounded-2xl border border-gray-700 bg-gray-900 text-gray-300 font-bold text-base hover:border-gray-500 hover:text-white transition-colors"
            >
              {t('start.guest')}
            </button>
          </div>
        )}

        {/* ── Sign In panel ── */}
        {panel === 'signin' && (
          <form onSubmit={handleSignIn} className="w-full flex flex-col gap-3">
            <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
            <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} />
            {error && <p className="text-red-400 text-xs px-1">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-sm hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {submitting ? '…' : t('auth.signIn')}
            </button>
            <button type="button" onClick={() => { reset(); setPanel('signup') }} className="text-gray-500 text-xs hover:text-gray-300 transition-colors text-center">
              {t('auth.toSignUp')}
            </button>
            <BackBtn onClick={() => { reset(); setPanel('choice') }} label={t('auth.back')} />
          </form>
        )}

        {/* ── Sign Up panel ── */}
        {panel === 'signup' && (
          <form onSubmit={handleSignUp} className="w-full flex flex-col gap-3">
            <Field label={t('auth.displayName')} type="text" value={displayName} onChange={setDisplayName} />
            <Field label={t('auth.email')} type="email" value={email} onChange={setEmail} />
            <Field label={t('auth.password')} type="password" value={password} onChange={setPassword} />
            {error && <p className="text-red-400 text-xs px-1">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-sm hover:opacity-90 disabled:opacity-40 transition-all"
            >
              {submitting ? '…' : t('auth.signUp')}
            </button>
            <button type="button" onClick={() => { reset(); setPanel('signin') }} className="text-gray-500 text-xs hover:text-gray-300 transition-colors text-center">
              {t('auth.toSignIn')}
            </button>
            <BackBtn onClick={() => { reset(); setPanel('choice') }} label={t('auth.back')} />
          </form>
        )}

        {/* ── Verify notice ── */}
        {panel === 'verify' && (
          <div className="w-full flex flex-col items-center gap-5 text-center">
            <div className="text-5xl">📧</div>
            <p className="text-white font-bold">{t('auth.verifyNotice')}</p>
            <button
              onClick={() => { reset(); setPanel('signin') }}
              className="px-6 py-3 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-colors"
            >
              {t('auth.signIn')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange }: {
  label: string; type: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-gray-500 text-xs px-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder:text-gray-600 outline-none focus:border-indigo-500 transition-colors text-sm"
      />
    </div>
  )
}

function BackBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-1 text-gray-600 text-xs hover:text-gray-400 transition-colors mt-1"
    >
      ← {label}
    </button>
  )
}
