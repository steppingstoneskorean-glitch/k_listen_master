// src/components/AccountDeleteModal.tsx
// 인앱 회원 탈퇴 확인 모달 — GDPR 삭제권 + Google Play/Apple 심사 요구사항.
//   체크박스로 되돌릴 수 없음을 확인시킨 뒤 useAuth().deleteAccount() 호출.
//   삭제 성공 시 setUser(null) → RequireAuth 가 /login 으로 리다이렉트하지만,
//   확실히 하기 위해 여기서도 navigate 한다.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/i18n'

export default function AccountDeleteModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await deleteAccount()
      navigate('/login', { replace: true })
    } catch {
      setError(t('account.deleteError'))
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-black text-slate-900">{t('account.deleteTitle')}</h2>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">{t('account.deleteBody')}</p>

        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={ack}
            onChange={e => setAck(e.target.checked)}
            className="mt-0.5 accent-rose-600"
          />
          <span>{t('account.deleteAck')}</span>
        </label>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={!ack || busy}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy ? t('account.deleting') : t('account.deleteConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
