// src/components/KArtistLive.tsx
// ─────────────────────────────────────────────────────────────────────────────
// K-Artist Live — 실제 K-pop 아티스트 영상 기반 학습 섹션 (메인 화면용)
//   · Artist별 / 레벨별(별점) 드롭다운 필터 (useState)
//   · 난이도는 텍스트 대신 노란 별(★ 1~3개) 아이콘으로 표시
//   · 필터 변경 시 카드가 부드럽게 나타나는 CSS 애니메이션
//   · 모바일: 필터 flex-wrap, 카드 1→2→3열 반응형 그리드
//
// i18n:
//   · UI 텍스트는 중앙 번역 시스템(lib/i18n.tsx TRANSLATIONS 의 kartist.* 키) 사용.
//   · 영상 제목/설명은 다국어 객체(Localized)로 관리 → pickText() 로 해석.
//   · 딕테이션 정답(answer)은 학습 원문이므로 "한국어 문자열로만" 고정하며,
//     렌더링 시 반드시 translate="no" + notranslate 로 보호한다.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useLang, type Lang } from '@/lib/i18n'

/* 다국어 텍스트 객체: en 은 필수(폴백), 나머지 언어는 선택 */
type Localized = { en: string } & Partial<Record<Lang, string>>

function pickText(localized: Localized, lang: Lang): string {
  return localized[lang] ?? localized.en
}

interface LiveVideo {
  id: number
  /** 제목/설명: 다국어 객체로 관리 (브라우저 자동 번역과 무관하게 언어 전환) */
  title: Localized
  desc?: Localized
  artist: string
  stars: number // 1~3 (난이도)
  url: string // 학습 페이지 경로. 빈 문자열이면 Coming Soon
  videoId?: string // 유튜브 썸네일용
  /**
   * 딕테이션 정답 스크립트 — ⚠️ 오직 한국어 문자열만 허용.
   * 다국어 객체로 만들지 말 것. 화면에 표시할 때는 반드시
   * translate="no" + className="notranslate" 로 감싸 자동 번역을 차단한다.
   */
  answer?: string
}

// 카테고리 분류를 위한 artist / stars 필수 포함 (요구 데이터 구조)
const LIVE_VIDEOS: LiveVideo[] = [
  {
    id: 1,
    title: {
      en: 'BTS Everyday Talk · Healing(?) Trip',
      ko: 'BTS 일상 대화 · 방탄이가 방에 들어가신다',
      es: 'BTS Charla cotidiana · Viaje sanador(?)',
      ja: 'BTS 日常会話 · 癒やし(?)旅行',
    },
    desc: {
      en: 'Catch real casual endings like “-자 (let’s)” from a live chat.',
      ko: '실제 대화 속 “-자(같이 하자)” 반말 어미를 잡아내 보세요.',
      es: 'Capta terminaciones informales reales como “-자 (hagamos)”.',
      ja: '実際の会話から「-자（〜しよう）」のタメ口語尾を聞き取ろう。',
    },
    artist: 'BTS',
    stars: 2,
    url: '/kpop-quiz',
    videoId: 'wu6bA3zK_us',
    answer: '야! 야! 피자 같이 먹자.', // 한국어 고정 — 번역/치환 금지
  },
  {
    id: 2,
    title: { en: 'Blackpink Live Talk', ko: 'Blackpink 라이브 토크', es: 'Blackpink Charla en vivo', ja: 'Blackpink ライブトーク' },
    artist: 'Blackpink',
    stars: 1,
    url: '',
  },
  {
    id: 3,
    title: { en: 'EXO Reality Show Talk', ko: 'EXO 리얼 예능 대화', es: 'EXO Charla de reality', ja: 'EXO リアルバラエティ会話' },
    artist: 'EXO',
    stars: 2,
    url: '',
  },
  {
    id: 4,
    title: { en: 'SKZ Group Vlog', ko: 'SKZ 단체 브이로그', es: 'SKZ Vlog grupal', ja: 'SKZ グループVlog' },
    artist: 'SKZ',
    stars: 3,
    url: '',
  },
  {
    id: 5,
    title: { en: 'Ateez Fan Meeting', ko: 'Ateez 팬미팅 현장', es: 'Ateez Fan meeting', ja: 'Ateez ファンミーティング' },
    artist: 'Ateez',
    stars: 1,
    url: '',
  },
  {
    id: 6,
    title: { en: 'BTS Late-Night Live Chat', ko: 'BTS 심야 라이브 수다', es: 'BTS Charla nocturna en vivo', ja: 'BTS 深夜ライブおしゃべり' },
    artist: 'BTS',
    stars: 3,
    url: '',
  },
]

const ARTISTS = ['__all__', 'BTS', 'Blackpink', 'EXO', 'SKZ', 'Ateez'] as const
const STAR_LEVELS = [0, 1, 2, 3] as const // 0 = 전체

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Stars({ count, ariaLabel, className = 'h-4 w-4' }: { count: number; ariaLabel: string; className?: string }) {
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
function FilterDropdown<T extends string | number>({
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

  // 바깥 클릭 시 닫기
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
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md cursor-pointer"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className="flex items-center">{renderOption(value)}</span>
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

export default function KArtistLive({
  onPlay,
  className = 'px-6 pb-20',
}: {
  onPlay?: (to: string) => void
  /** 섹션 배치 컨텍스트에 맞춰 여백을 조절할 때 사용 */
  className?: string
}) {
  // UI 텍스트는 중앙 번역 시스템(lib/i18n.tsx TRANSLATIONS 의 kartist.* 키) 사용
  const { lang, t } = useLang()

  const [artistFilter, setArtistFilter] = useState<(typeof ARTISTS)[number]>('__all__')
  const [starFilter, setStarFilter] = useState<(typeof STAR_LEVELS)[number]>(0)

  const filtered = LIVE_VIDEOS.filter(
    v =>
      (artistFilter === '__all__' || v.artist === artistFilter) &&
      (starFilter === 0 || v.stars === starFilter),
  )

  // 필터가 바뀔 때마다 key 를 갈아 카드 등장 애니메이션 재생
  const filterKey = `${artistFilter}-${starFilter}`

  const starsAria = (n: number) => t('kartist.starsAria').replace('{n}', String(n))

  return (
    <section className={className}>
      {/* 섹션 스코프 애니메이션 (index.css 수정 없이 주입) */}
      <style>{`
        @keyframes ka-card-in {
          from { opacity: 0; transform: translateY(14px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ka-card-in { animation: ka-card-in .38s cubic-bezier(.22,1,.36,1) both; }
        @keyframes ka-pop {
          from { opacity: 0; transform: translateY(-4px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ka-pop { animation: ka-pop .16s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .ka-card-in, .ka-pop { animation: none; }
        }
      `}</style>

      <div className="mx-auto max-w-4xl">
        {/* ── 타이틀 (브랜드명은 번역하지 않음) ── */}
        <div className="text-center">
          <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl" translate="no">
            🎤 K-Artist <span className="text-indigo-600">Live</span>
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">{t('kartist.subtitle')}</p>
        </div>

        {/* ── 필터 바 (모바일: flex-wrap 으로 줄바꿈) ── */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <FilterDropdown
            label={t('kartist.filterArtist')}
            value={artistFilter}
            options={ARTISTS}
            renderOption={v => <span>{v === '__all__' ? t('kartist.all') : v}</span>}
            onSelect={setArtistFilter}
          />
          <FilterDropdown
            label={t('kartist.filterLevel')}
            value={starFilter}
            options={STAR_LEVELS}
            renderOption={v =>
              v === 0 ? <span>{t('kartist.all')}</span> : <Stars count={v} ariaLabel={starsAria(v)} className="h-3.5 w-3.5" />
            }
            onSelect={setStarFilter}
          />
        </div>

        {/* ── 영상 카드 그리드 ── */}
        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm font-semibold text-slate-400">{t('kartist.empty')}</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((video, i) => {
              const playable = Boolean(video.url)
              return (
                <div
                  key={`${filterKey}-${video.id}`}
                  className="ka-card-in"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <button
                    type="button"
                    disabled={!playable}
                    onClick={() => playable && onPlay?.(video.url)}
                    className={`group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-md shadow-slate-200/60 transition-all duration-300 ${
                      playable
                        ? 'cursor-pointer hover:-translate-y-2 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 active:scale-[0.98]'
                        : 'cursor-default opacity-80'
                    }`}
                  >
                    {/* 썸네일 + 우상단 별점 */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      {video.videoId ? (
                        <img
                          src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
                          alt={pickText(video.title, lang)}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-slate-50 to-emerald-100">
                          <span className="text-3xl">🎬</span>
                          <span className="mt-1 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                            {t('kartist.comingSoon')}
                          </span>
                        </div>
                      )}
                      {/* 난이도 별점 배지 (우측 상단) */}
                      <span className="absolute right-2 top-2 flex items-center rounded-full bg-slate-900/70 px-2 py-1 backdrop-blur-sm">
                        <Stars count={video.stars} ariaLabel={starsAria(video.stars)} className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    {/* 본문 */}
                    <div className="flex flex-1 flex-col p-4">
                      <span className="w-fit rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600" translate="no">
                        {video.artist}
                      </span>
                      <h3 className="mt-2.5 text-sm font-black leading-snug text-slate-900">
                        {pickText(video.title, lang)}
                      </h3>
                      {video.desc && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{pickText(video.desc, lang)}</p>
                      )}
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
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
