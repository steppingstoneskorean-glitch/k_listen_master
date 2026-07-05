import { useState } from 'react'
import { useLang } from '@/lib/i18n'
import { usePwaInstall } from '@/lib/pwaInstall'
import { isInstallBannerHidden, hideInstallBannerForDays } from '@/lib/installPrompts'
import InstallHintPopup from './InstallHintPopup'

export default function InstallBanner() {
  const { t } = useLang()
  const { canInstall, isInstalled, promptInstall } = usePwaInstall()
  const [dismissed, setDismissed] = useState(() => isInstallBannerHidden())
  const [showHint, setShowHint] = useState(false)

  if (dismissed || isInstalled) return null

  const handleInstallClick = async () => {
    if (canInstall) {
      await promptInstall()
    } else {
      setShowHint(true)
    }
  }

  const handleDismiss = () => {
    hideInstallBannerForDays(7)
    setDismissed(true)
  }

  return (
    <>
      <div className="relative flex items-center justify-center gap-3 bg-emerald-500 px-10 py-2.5 text-center text-sm font-semibold text-white">
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{t('install.bannerMessage')}</span>
          <button
            type="button"
            onClick={handleInstallClick}
            className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition-colors"
          >
            {t('install.installBtn')}
          </button>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
      {showHint && <InstallHintPopup onClose={() => setShowHint(false)} />}
    </>
  )
}
