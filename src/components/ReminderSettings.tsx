import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useGamification } from '@/lib/gamification'
import { enablePush, removeThisDeviceToken, type EnableResult } from '@/lib/fcm'

/**
 * 저녁 리마인더(FCM 웹 푸시) 설정 모달.
 *   · 켜기: 알림 권한 요청 → FCM 토큰 발급/저장 → reminderEnabled=true 저장
 *   · 시각 선택: 로컬 기준 발송 시각(서버가 타임존으로 환산)
 *   · 끄기: reminderEnabled=false + 이 기기 토큰 제거
 */
export default function ReminderSettings({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang()
  const { user } = useAuth()
  const { progress, setReminderPrefs } = useGamification()
  const [hour, setHour] = useState(progress.reminderHour)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<EnableResult | null>(null)

  const enabled = progress.reminderEnabled

  const errorText = (r: EnableResult): string => {
    switch (r) {
      case 'denied': return t('reminder.denied')
      case 'unsupported': return t('reminder.unsupported')
      case 'no-vapid': return t('reminder.noVapid')
      default: return t('reminder.error')
    }
  }

  const turnOn = async () => {
    if (!user) return
    setBusy(true)
    setError(null)
    const res = await enablePush(user.uid)
    if (res === 'ok') {
      await setReminderPrefs({ enabled: true, hour, lang })
      setBusy(false)
      onClose()
    } else {
      setError(res)
      setBusy(false)
    }
  }

  const turnOff = async () => {
    if (!user) return
    setBusy(true)
    await setReminderPrefs({ enabled: false })
    await removeThisDeviceToken(user.uid)
    setBusy(false)
    onClose()
  }

  const saveTime = async (h: number) => {
    setHour(h)
    if (enabled) await setReminderPrefs({ hour: h })
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
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔔</span>
          <h2 className="text-lg font-black text-slate-900">{t('reminder.title')}</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('reminder.desc')}</p>

        {/* Time picker */}
        <label className="mt-5 block">
          <span className="text-xs font-semibold text-slate-500">{t('reminder.time')}</span>
          <select
            value={hour}
            onChange={e => saveTime(Number(e.target.value))}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-emerald-400 focus:outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, '0')}:00
              </option>
            ))}
          </select>
        </label>

        {enabled && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            ✓ {t('mission.reminderOn').replace('{h}', String(hour))}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-100 px-3 py-2 text-xs leading-relaxed text-red-600">
            {errorText(error)}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-400">{t('reminder.note')}</p>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            {t('common.cancel')}
          </button>
          {enabled ? (
            <button
              type="button"
              onClick={turnOff}
              disabled={busy}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
            >
              {t('reminder.disable')}
            </button>
          ) : (
            <button
              type="button"
              onClick={turnOn}
              disabled={busy}
              className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? t('reminder.enabling') : t('reminder.enable')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
