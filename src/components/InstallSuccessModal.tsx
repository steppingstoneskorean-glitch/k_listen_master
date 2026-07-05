import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { usePwaInstall } from '@/lib/pwaInstall'
import { hideInstallModalForHours } from '@/lib/installPrompts'
import InstallHintPopup from './InstallHintPopup'

interface Props {
  onClose: () => void
}

export default function InstallSuccessModal({ onClose }: Props) {
  const { t } = useLang()
  const { canInstall, promptInstall } = usePwaInstall()
  const [showHint, setShowHint] = useState(false)

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall()
      onClose()
    } else {
      setShowHint(true)
    }
  }

  const handleNotToday = () => {
    hideInstallModalForHours(24)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="relative w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-7 flex flex-col gap-5 shadow-2xl text-center">
          <div className="text-5xl">🎉</div>
          <div>
            <p className="text-white font-bold text-lg">{t('install.successTitle')}</p>
            <p className="text-gray-400 text-sm mt-2 leading-relaxed">{t('install.successBody')}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-black text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              {t('install.installHomeBtn')}
            </button>
            <div className="flex gap-2.5">
              <button
                onClick={handleNotToday}
                className="flex-1 py-3 rounded-2xl border border-gray-700 text-gray-400 text-xs font-medium hover:border-gray-500 hover:text-gray-300 transition-colors"
              >
                {t('install.notTodayBtn')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-gray-700 text-gray-400 text-xs font-medium hover:border-gray-500 hover:text-gray-300 transition-colors"
              >
                {t('install.closeBtn')}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showHint && <InstallHintPopup onClose={() => setShowHint(false)} />}
    </>
  )
}
