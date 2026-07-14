// src/components/kartist/ui.tsx
// K-Artist Live 홈 캐러셀 + Game Hub 공용 UI 조각
//   · Stars(별점) / Chevron(화살표) / FilterDropdown(필터) / ModeBadges(B·I·A 배지)
//   · VideoCard(영상 카드 — 모드 배지 + 마스터리 왕관)

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { MODE_ORDER, type GameMode, type ModeInfo } from '@/data/kArtistLive'

/* 모드별 소프트 컬러 (B: Soft Green · I: Soft Blue · A: Soft Purple) */
const MODE_BADGE_STYLE: Record<GameMode, string> = {
  B: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  I: 'border-blue-200 bg-blue-100 text-blue-700',
  A: 'border-purple-200 bg-purple-100 text-purple-700',
}

/** 단일 모드 칩 — 필터 드롭다운 등에서 사용 */
export function ModeChip({ mode }: { mode: GameMode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[10px] font-black leading-none ${MODE_BADGE_STYLE[mode]}`}
      translate="no"
    >
      {mode}
    </span>
  )
}

/**
 * [B ⭐⭐] [I ⭐⭐⭐] [A ⭐] — 고정 3칸 가로 배지 행.
 * availableModes 에 없는 모드는 회색 저투명 상태로 렌더링.
 */
export function ModeBadges({ modes, className = '' }: { modes: ModeInfo[]; className?: string }) {
  return (
    <span className={`flex items-center gap-1 ${className}`} translate="no">
      {MODE_ORDER.map(m => {
        const info = modes.find(x => x.mode === m)
        return (
          <span
            key={m}
            aria-label={info ? `${m} ${info.stars} stars` : `${m} unavailable`}
            className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-black leading-none ${
              info ? MODE_BADGE_STYLE[m] : 'border-slate-200 bg-slate-100 text-slate-400 opacity-50'
            }`}
          >
            {m}
            {info && <span className="text-[8px] tracking-tighter">{'⭐'.repeat(info.stars)}</span>}
          </span>
        )
      })}
    </span>
  )
}

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
  modes,
  mastered = false,
  videoId,
  emoji,
  imageSrc,
  playable,
  onPlay,
}: {
  title: string
  desc?: string
  artist: string
  /** B/I/A 모드 + 모드별 1~3성 (없는 모드는 회색 배지) */
  modes: ModeInfo[]
  /** 이 영상의 모든 제공 모드를 클리어 → 썸네일 위 빛나는 왕관 */
  mastered?: boolean
  videoId?: string
  emoji?: string
  imageSrc?: string
  playable: boolean
  onPlay?: () => void
}) {
  const { t } = useLang()

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
        ) : imageSrc ? (
          <img
            src={imageSrc}
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
        {/* 모드 배지 [B][I][A] (우측 상단) — 별점 아이콘 대체 */}
        <span className="absolute right-2 top-2 rounded-lg bg-slate-900/60 p-1 backdrop-blur-sm">
          <ModeBadges modes={modes} />
        </span>
        {/* 마스터리 왕관 — 모든 제공 모드 클리어 시 (빛나는 효과) */}
        {mastered && (
          <span
            aria-label={t('kartist.masteryAria')}
            className="absolute left-2 top-2 animate-pulse text-2xl"
            style={{ filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.95))' }}
          >
            👑
          </span>
        )}
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
