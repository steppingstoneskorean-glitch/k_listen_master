// src/components/kartist/ui.tsx
// K-Artist Live 홈 캐러셀 + Game Hub 공용 UI 조각
//   · Stars(별점) / Chevron(화살표) / FilterDropdown(필터) / VideoCard(영상 카드)

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'

export function Chevron({ open, className = 'h-3.5 w-3.5' }: { open?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Stars({ count, ariaLabel, className = 'h-4 w-4' }: { count: number; ariaLabel: string; className?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={ariaLabel}>
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={`${className} text-yellow-400 drop-shadow-sm`}>
          <path
            d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.4 7.2 16.9l.9-5.4L4.2 7.7l5.4-.8L12 2Z"
            fill="currentColor"
          />
        </svg>
      ))}
    </span>
  )
}

/* 드롭다운 필터 버튼: 라벨 + 선택값 + Chevron */
export function FilterDropdown<T extends string | number>({
  label,
  value,
  options,
  renderOption,
  onSelect,
}: {
  label: string
  value: T
  options: readonly T[]
  renderOption: (v: T) => React.ReactNode
  onSelect: (v: T) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md cursor-pointer"
      >
        <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="flex items-center whitespace-nowrap">{renderOption(value)}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul className="ka-pop absolute left-0 z-30 mt-2 min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-xl shadow-slate-200/70">
          {options.map(opt => (
            <li key={String(opt)}>
              <button
                type="button"
                onClick={() => {
                  onSelect(opt)
                  setOpen(false)
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap px-4 py-2 text-left text-sm font-semibold transition-colors cursor-pointer ${
                  opt === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {renderOption(opt)}
                {opt === value && (
                  <svg viewBox="0 0 24 24" fill="none" className="ml-auto h-3.5 w-3.5 text-indigo-500">
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* 영상/퀴즈 카드 — 제목/설명은 이미 현재 언어로 해석된 문자열을 받는다 */
export function VideoCard({
  title,
  desc,
  artist,
  stars,
  videoId,
  emoji,
  playable,
  onPlay,
}: {
  title: string
  desc?: string
  artist: string
  stars: number
  videoId?: string
  emoji?: string
  playable: boolean
  onPlay?: () => void
}) {
  const { t } = useLang()
  const starsAria = t('kartist.starsAria').replace('{n}', String(stars))

  return (
    <button
      type="button"
      disabled={!playable}
      onClick={() => playable && onPlay?.()}
      className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md shadow-slate-200/60 transition-all duration-300 ${
        playable
          ? 'cursor-pointer hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]'
          : 'cursor-default opacity-80'
      }`}
    >
      {/* 썸네일 + 우상단 별점 */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {videoId ? (
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-50 to-emerald-100">
            <span className="text-3xl">{emoji ?? '🎬'}</span>
            {!emoji && (
              <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {t('kartist.comingSoon')}
              </span>
            )}
          </div>
        )}
        {/* 난이도 별점 배지 (우측 상단) */}
        <span className="absolute right-2 top-2 flex items-center rounded-full bg-slate-900/70 px-2 py-1 backdrop-blur-sm">
          <Stars count={stars} ariaLabel={starsAria} className="h-3.5 w-3.5" />
        </span>
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col p-4">
        <span className="w-fit whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600" translate="no">
          {artist}
        </span>
        <h3 className="mt-2.5 break-keep text-sm font-black leading-snug text-slate-900">{title}</h3>
        {desc && <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>}
        <div className="mt-auto flex items-center justify-between pt-3 text-xs">
          {playable ? (
            <>
              <span className="text-slate-400">{t('kartist.tryQuiz')}</span>
              <span className="font-bold text-indigo-500 opacity-0 transition-all duration-300 -translate-x-1.5 group-hover:translate-x-0 group-hover:opacity-100">
                {t('kartist.play')}
              </span>
            </>
          ) : (
            <span className="text-slate-400">{t('kartist.comingSoonSub')}</span>
          )}
        </div>
      </div>
    </button>
  )
}
