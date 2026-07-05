import { useLang } from '@/lib/i18n'

export default function InstallHintPopup({ onClose }: { onClose: () => void }) {
  const { t } = useLang()

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl bg-gray-900 border border-gray-700 p-6 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-4xl mb-3">📲</div>
        <p className="text-sm text-gray-200 leading-relaxed">{t('install.iosHint')}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {t('common.ok')}
        </button>
      </div>
    </div>
  )
}
