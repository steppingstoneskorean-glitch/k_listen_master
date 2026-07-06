// src/components/ChallengeShare.tsx
// 결과 페이지 공용 '친구에게 도전장 보내기' — 링크 복사 칸 + X 공유
//   · 메시지에 게임명/점수 포함, 링크는 해당 게임 페이지로 바로 연결
//   · variant='dark'(게임 결과 화면) / 'light'(밝은 배경)

import { useState } from 'react'
import { useLang } from '@/lib/i18n'

export default function ChallengeShare({
  gameName,
  score,
  gamePath,
  variant = 'dark',
}: {
  gameName: string
  score: number
  gamePath: string // 예: '/game', '/dictation?mode=advanced'
  variant?: 'dark' | 'light'
}) {
  const { t } = useLang()
  const [copied, setCopied] = useState(false)

  const url =
    (typeof window !== 'undefined' ? window.location.origin : 'https://k-listen-master.web.app') + gamePath
  const message = t('challenge.message')
    .replace('{game}', gameName)
    .replace('{score}', String(score))
  const shareText = `${message}\n${url}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const shareToX = () => {
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`
    window.open(intent, '_blank', 'noopener,noreferrer')
  }

  const dark = variant === 'dark'

  return (
    <section
      className={`rounded-2xl border p-5 ${
        dark ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t('challenge.title')}</p>
      <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-slate-500'}`}>
        “{message}”
      </p>

      {/* 링크 복사 칸 */}
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={e => e.currentTarget.select()}
          aria-label="share link"
          className={`min-w-0 flex-1 rounded-xl border px-3 py-2 text-xs outline-none ${
            dark
              ? 'border-gray-700 bg-gray-950 text-gray-300'
              : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}
        />
        <button
          type="button"
          onClick={copy}
          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
            dark
              ? 'bg-indigo-500 text-white hover:bg-indigo-400'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {copied ? t('challenge.copied') : t('challenge.copy')}
        </button>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={shareToX}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-transform duration-200 hover:-translate-y-0.5 ${
            dark ? 'bg-black text-white hover:bg-gray-800' : 'bg-black text-white hover:bg-slate-900'
          }`}
        >
          {t('challenge.shareX')}
        </button>
      </div>
    </section>
  )
}
