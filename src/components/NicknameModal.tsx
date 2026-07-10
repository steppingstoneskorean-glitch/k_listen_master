// src/components/NicknameModal.tsx
// 최초 점수 제출 전 1회 노출되는 리더보드 닉네임 설정 모달

import { useState } from 'react'
import { useLang } from '@/lib/i18n'

export default function NicknameModal({
  defaultName,
  onSubmit,
}: {
  defaultName?: string
  onSubmit: (name: string) => Promise<void> | void
}) {
  const { t } = useLang()
  const [value, setValue] = useState(defaultName || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const trimmed = value.trim()
    if (!trimmed) {
      setError(t('nickname.required'))
      return
    }
    if (trimmed.length > 20) {
      setError(t('nickname.tooLong'))
      return
    }
    setBusy(true)
    try {
      await onSubmit(trimmed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-800 p-6 text-center">
        <p className="text-3xl">🏆</p>
        <h3 className="mt-2 text-lg font-black text-white">{t('nickname.title')}</h3>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">{t('nickname.body')}</p>
        <input
          autoFocus
          value={value}
          onChange={e => {
            setValue(e.target.value)
            setError('')
          }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          maxLength={20}
          placeholder={t('nickname.placeholder')}
          className="mt-4 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-center text-white outline-none focus:border-indigo-500"
        />
        {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="mt-4 w-full rounded-xl bg-indigo-500 py-3 font-bold text-white hover:bg-indigo-400 disabled:opacity-50"
        >
          {busy ? '…' : t('nickname.confirm')}
        </button>
      </div>
    </div>
  )
}
