// src/components/ChallengeShare.tsx
// 결과 페이지 공용 '도전장 보내기' — 단일 버튼: 모바일은 navigator.share, 데스크톱은
// clipboard.writeText + 토스트로 폴백한다. (예전의 복사창+X공유 2버튼 구성을 대체)
//   · variant='dark'(게임 결과 화면) / 'light'(밝은 배경)

import { useState, type ReactNode } from 'react'
import { useLang } from '@/lib/i18n'
import { buildShareUrl } from '@/lib/shareUrl'

export default function ChallengeShare({
  label,
  score,
  stars,
  gamePath,
  correctCount,
  total,
  thumbnailUrl,
  variant = 'dark',
  extraButton,
}: {
  /** 아티스트명(K-Artist Live) 또는 레벨 타이틀(Dictation/Game) */
  label: string
  score: number
  stars: number
  gamePath: string // 예: '/game', '/dictation?mode=advanced'
  correctCount?: number
  total?: number
  thumbnailUrl?: string
  variant?: 'dark' | 'light'
  /** 공유 버튼 옆에 함께 노출할 부가 액션(예: 결과 포토카드 저장) */
  extraButton?: ReactNode
}) {
  const { t } = useLang()
  const [toast, setToast] = useState(false)

  const url = buildShareUrl({ path: gamePath, score, stars, label, correctCount, total, thumbnailUrl })
  const message = t('challenge.message')
    .replace('{score}', String(score))
    .replace('{name}', label)
    .replace('{stars}', String(stars))
  const shareText = `${message}\n${url}`

  const share = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: message, url })
      } catch {
        /* 사용자가 공유 시트를 닫은 경우 등 — 무시 */
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareText)
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    } catch {
      /* ignore */
    }
  }

  const dark = variant === 'dark'

  return (
    <section
      className={`rounded-2xl border p-5 ${
        dark ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <style>{`
        @keyframes cs-toast-pop {
          0% { opacity: 0; transform: translateY(10px); }
          12% { opacity: 1; transform: translateY(0); }
          88% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(6px); }
        }
        .cs-toast-pop { animation: cs-toast-pop 2.5s ease forwards; }
      `}</style>

      <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t('challenge.title')}</p>
      <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-slate-500'}`}>“{message}”</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={share}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
            dark
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {t('challenge.shareBtn')}
        </button>
        {extraButton}
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4 pointer-events-none">
          <div className="cs-toast-pop pointer-events-auto rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-2xl">
            {t('challenge.toastMsg')}
          </div>
        </div>
      )}
    </section>
  )
}
