import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { recordMarketingConsent } from '@/lib/marketingConsent'

interface Props {
  targetPath: string
  onClose: () => void
}

export default function AuthModal({ targetPath, onClose }: Props) {
  const { t } = useLang()
  const { signInWithGoogle, signInWithApple, setIsGuest } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false) // 기본 해제 — 사전 체크된 박스는 유효한 동의가 아님

  const handleSocial = async (provider: 'google' | 'apple') => {
    setError('')
    setSubmitting(true)
    try {
      const { uid } = provider === 'google' ? await signInWithGoogle() : await signInWithApple()
      if (marketingOptIn) void recordMarketingConsent(uid)
      onClose()
      navigate(targetPath)
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg === 'auth_unavailable'
          ? 'Authentication service unavailable.'
          : provider === 'google'
          ? 'Google sign-in failed. Please try again.'
          : 'Apple sign-in failed. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleGuest = () => {
    setIsGuest(true)
    onClose()
    navigate(targetPath)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 flex flex-col gap-3 pointer-events-auto shadow-2xl">
          <div className="text-center mb-1">
            <h2 className="text-xl font-black text-white">{t('start.login')}</h2>
            <p className="text-gray-500 text-sm mt-1">{t('start.tagline')}</p>
          </div>

          {/* Marketing email opt-in (선택) */}
          <label className="flex items-start gap-2 px-1 py-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={e => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-600 bg-gray-800 accent-indigo-500"
            />
            <span className="text-[11px] leading-snug text-gray-500">
              {t('auth.marketingConsent')}
            </span>
          </label>

          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocial('google')}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-400 bg-white text-gray-800 font-bold text-sm hover:bg-gray-50 active:scale-[0.98] disabled:opacity-40 transition-all shadow-sm"
          >
            <GoogleIcon />
            {t('auth.continueWithGoogle')}
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocial('apple')}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-gray-600 bg-black text-white font-bold text-sm hover:bg-gray-900 active:scale-[0.98] disabled:opacity-40 transition-all shadow-sm"
          >
            <AppleIcon />
            {t('auth.continueWithApple')}
          </button>

          {/* Guest */}
          <button
            onClick={handleGuest}
            disabled={submitting}
            className="w-full py-3 rounded-2xl border border-gray-700 bg-gray-800 text-gray-300 font-bold text-sm hover:border-gray-500 hover:text-white disabled:opacity-40 transition-colors flex flex-col items-center gap-0.5 px-4"
          >
            <span>{t('start.guest')}</span>
            <span className="text-[11px] text-gray-500 font-normal leading-snug text-center">
              {t('auth.guestNotice')}
            </span>
          </button>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            onClick={onClose}
            className="text-gray-600 text-xs hover:text-gray-400 transition-colors text-center mt-1"
          >
            ✕ {t('auth.back')}
          </button>
        </div>
      </div>
    </>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zm-3.1-17.6c.06 2.3-1.67 4.2-3.9 4.3-1.05-2.6 1.43-4.35 3.9-4.3z" />
    </svg>
  )
}
