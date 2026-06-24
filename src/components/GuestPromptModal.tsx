import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

interface Props {
  score: number
  level: number
  onClose: () => void
}

export default function GuestPromptModal({ score, level, onClose }: Props) {
  const { t } = useLang()
  const navigate = useNavigate()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-7 flex flex-col gap-5 shadow-2xl">
        {/* Score display */}
        <div className="text-center">
          <div className="text-5xl mb-3">🏅</div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{t('guest.score')}</p>
          <p className="text-4xl font-black text-yellow-400">{score.toLocaleString()}<span className="text-xl text-yellow-600">점</span></p>
          <p className="text-gray-600 text-xs mt-1">Level {level} complete</p>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* CTA text */}
        <div className="text-center">
          <p className="text-white font-bold text-base">{t('guest.title')}</p>
          <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{t('guest.body')}</p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => navigate('/')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            {t('guest.loginBtn')}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-gray-700 text-gray-400 text-sm font-medium hover:border-gray-500 hover:text-gray-300 transition-colors"
          >
            {t('guest.continueBtn')}
          </button>
        </div>
      </div>
    </div>
  )
}
