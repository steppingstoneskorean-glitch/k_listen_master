import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { useGamification } from '@/lib/gamification'

/**
 * 하루 목표 학습량(완료 세트 수)을 사용자가 직접 정하는 모달.
 * 스테퍼 + 빠른 프리셋(1/3/5/10)을 제공한다.
 */
export default function GoalEditModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const { progress, setDailyGoal } = useGamification()
  const [value, setValue] = useState(progress.dailyGoal)
  const [saving, setSaving] = useState(false)

  const clamp = (n: number) => Math.max(1, Math.min(20, n))

  const save = async () => {
    setSaving(true)
    await setDailyGoal(value)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-slate-900">{t('goal.title')}</h2>
        <p className="mt-1 text-sm text-slate-500">{t('goal.desc')}</p>

        {/* Stepper */}
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => setValue(v => clamp(v - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-2xl font-bold text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
            aria-label="decrease"
          >
            −
          </button>
          <div className="flex min-w-[5rem] flex-col items-center">
            <span className="text-5xl font-black tabular-nums text-emerald-600">{value}</span>
            <span className="mt-1 text-xs font-medium text-slate-400">{t('goal.unit')}</span>
          </div>
          <button
            type="button"
            onClick={() => setValue(v => clamp(v + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-2xl font-bold text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
            aria-label="increase"
          >
            +
          </button>
        </div>

        {/* Presets */}
        <div className="mt-5 flex justify-center gap-2">
          {[1, 3, 5, 10].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setValue(p)}
              className={`h-9 w-12 rounded-lg border text-sm font-bold transition-all ${
                value === p
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">{t('goal.tip')}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {t('goal.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
