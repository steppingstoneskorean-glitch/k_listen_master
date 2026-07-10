// src/components/UpgradeModal.tsx
// ─────────────────────────────────────────────────────────────────────────────
// NORMAL_FREE 티어 유저가 오늘의 무료 패스를 다른 영상에 다시 쓰려 할 때 뜨는 안내 모달.
// 현재는 모든 유저가 BETA_FREE(무제한)라 실제로는 절대 뜨지 않는다 — GameHubPage의
// accessControl 게이팅이 나중에 NORMAL_FREE 를 실제로 부여할 때를 위해 미리 연결해 둔 것.
// ─────────────────────────────────────────────────────────────────────────────

import { useLang } from '@/lib/i18n'

interface Props {
  onClose: () => void
}

export default function UpgradeModal({ onClose }: Props) {
  const { t } = useLang()

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-3xl p-6 flex flex-col gap-3 pointer-events-auto shadow-2xl text-center">
          <p className="text-4xl">🔒</p>
          <h2 className="text-xl font-black text-white">{t('upgrade.title')}</h2>
          <p className="text-gray-400 text-sm">{t('upgrade.body')}</p>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-bold text-sm active:scale-[0.98] transition-all shadow-sm"
          >
            {t('upgrade.cta')}
          </button>

          <button
            onClick={onClose}
            className="text-gray-600 text-xs hover:text-gray-400 transition-colors text-center mt-1"
          >
            {t('upgrade.close')}
          </button>
        </div>
      </div>
    </>
  )
}
