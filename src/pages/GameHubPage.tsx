// src/pages/GameHubPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Unified Game Hub (/games) — K-Artist Live 영상 + Step & Step 퀴즈(초/중/고급) 통합
//   · 아티스트별 / 레벨별 필터
//   · 정렬: 많이 도전한 순(Popularity) / 최신순(Newest) + 오름/내림차순 토글
//   · 필터 상태는 페이지 로컬(useState) — 진입 시 기본값으로 초기화
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang, type Lang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import AuthModal from '@/components/AuthModal'
import { LIVE_VIDEOS, pickText, STAR_LEVELS, type StarFilter } from '@/data/kArtistLive'
import { LEVEL_STARS } from '@/data/gameLevels'
import { VideoCard, FilterDropdown, Stars } from '@/components/kartist/ui'

// ── 통합 아이템 모델 ────────────────────────────────────────────────────────
interface HubItem {
  key: string
  title: string // 현재 언어로 해석된 문자열
  desc?: string
  artist: string // 'BTS'... 또는 STEP_ARTIST
  stars: number // 1~3
  url: string // 빈 문자열이면 Coming Soon
  videoId?: string
  emoji?: string // 퀴즈 카드용 (썸네일 대체)
  plays: number // 인기순
  addedAt: number // 최신순 (클수록 최신)
}

const STEP_ARTIST = 'Step & Step'

// 아티스트 필터 옵션 (K-Artist + Step & Step)
const HUB_ARTISTS = ['__all__', 'BTS', 'Blackpink', 'EXO', 'SKZ', 'Ateez', STEP_ARTIST] as const
type HubArtist = (typeof HUB_ARTISTS)[number]

const SORT_KEYS = ['popular', 'newest'] as const
type SortKey = (typeof SORT_KEYS)[number]

// Step & Step 퀴즈 카드 정의 (i18n 키 + 라우트)
const STEP_QUIZZES: {
  key: string
  titleKey: 'home.level1.title' | 'home.level2.title' | 'home.level3.title'
  descKey: 'home.level1.desc' | 'home.level2.desc' | 'home.level3.desc'
  emoji: string
  stars: number
  url: string
  plays: number
  addedAt: number
}[] = [
  { key: 'q1', titleKey: 'home.level1.title', descKey: 'home.level1.desc', emoji: '🎯', stars: LEVEL_STARS.beginner, url: '/game', plays: 2100, addedAt: 9 },
  { key: 'q2', titleKey: 'home.level2.title', descKey: 'home.level2.desc', emoji: '🗣️', stars: LEVEL_STARS.intermediate, url: '/dictation?mode=intermediate', plays: 1450, addedAt: 8 },
  { key: 'q3', titleKey: 'home.level3.title', descKey: 'home.level3.desc', emoji: '🎙️', stars: LEVEL_STARS.advanced, url: '/dictation?mode=advanced', plays: 980, addedAt: 7 },
]

function buildItems(t: ReturnType<typeof useLang>['t'], lang: Lang): HubItem[] {
  const artistItems: HubItem[] = LIVE_VIDEOS.map(v => ({
    key: `live-${v.id}`,
    title: pickText(v.title, lang),
    desc: v.desc ? pickText(v.desc, lang) : undefined,
    artist: v.artist,
    stars: v.stars,
    url: v.url,
    videoId: v.videoId,
    plays: v.plays,
    addedAt: v.addedAt,
  }))

  const quizItems: HubItem[] = STEP_QUIZZES.map(q => ({
    key: `quiz-${q.key}`,
    title: t(q.titleKey),
    desc: t(q.descKey),
    artist: STEP_ARTIST,
    stars: q.stars,
    url: q.url,
    emoji: q.emoji,
    plays: q.plays,
    addedAt: q.addedAt,
  }))

  return [...quizItems, ...artistItems]
}

export default function GameHubPage() {
  const { t, lang } = useLang()
  const { user, isGuest } = useAuth()
  const navigate = useNavigate()

  const [modalTarget, setModalTarget] = useState<string | null>(null)
  const [artistFilter, setArtistFilter] = useState<HubArtist>('__all__')
  const [starFilter, setStarFilter] = useState<StarFilter>(0)
  const [sortKey, setSortKey] = useState<SortKey>('popular')
  const [desc, setDesc] = useState(true) // 기본: 내림차순(많이 도전한 순)

  const handlePlay = (to: string) => {
    if (!to) return
    if (user || isGuest) navigate(to)
    else setModalTarget(to)
  }

  const items = useMemo(() => buildItems(t, lang), [t, lang])

  const visible = useMemo(() => {
    const filtered = items.filter(
      it =>
        (artistFilter === '__all__' || it.artist === artistFilter) &&
        (starFilter === 0 || it.stars === starFilter),
    )
    const sorted = [...filtered].sort((a, b) => {
      const va = sortKey === 'popular' ? a.plays : a.addedAt
      const vb = sortKey === 'popular' ? b.plays : b.addedAt
      return desc ? vb - va : va - vb
    })
    return sorted
  }, [items, artistFilter, starFilter, sortKey, desc])

  const starsAria = (n: number) => t('kartist.starsAria').replace('{n}', String(n))

  return (
    <>
      {modalTarget && <AuthModal targetPath={modalTarget} onClose={() => setModalTarget(null)} />}

      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
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
          @media (prefers-reduced-motion: reduce) { .ka-card-in, .ka-pop { animation: none; } }
        `}</style>

        <section className="mx-auto max-w-5xl px-6 py-12">
          {/* ── 타이틀 ── */}
          <div className="text-center">
            <h1 className="text-balance break-keep text-2xl font-black tracking-tight text-slate-900 sm:text-4xl">
              🎮 {t('hub.title')}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-balance break-keep text-sm font-semibold text-slate-500">{t('hub.subtitle')}</p>
          </div>

          {/* ── 필터 + 정렬 바 ── */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <FilterDropdown
              label={t('kartist.filterArtist')}
              value={artistFilter}
              options={HUB_ARTISTS}
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
            <FilterDropdown
              label={t('hub.sortLabel')}
              value={sortKey}
              options={SORT_KEYS}
              renderOption={v => <span>{v === 'popular' ? t('hub.sortPopular') : t('hub.sortNewest')}</span>}
              onSelect={setSortKey}
            />
            {/* 오름/내림차순 토글 */}
            <button
              type="button"
              onClick={() => setDesc(d => !d)}
              aria-label={desc ? t('hub.dirDesc') : t('hub.dirAsc')}
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" className={`h-4 w-4 transition-transform duration-200 ${desc ? '' : 'rotate-180'}`}>
                <path d="M12 5v14M12 19l6-6M12 19l-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {desc ? t('hub.dirDesc') : t('hub.dirAsc')}
            </button>
          </div>

          {/* ── 통합 카드 그리드 ── */}
          {visible.length === 0 ? (
            <p className="mt-16 text-center text-sm font-semibold text-slate-400">{t('hub.empty')}</p>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((it, i) => (
                <div key={it.key} className="ka-card-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <VideoCard
                    title={it.title}
                    desc={it.desc}
                    artist={it.artist}
                    stars={it.stars}
                    videoId={it.videoId}
                    emoji={it.emoji}
                    playable={Boolean(it.url)}
                    onPlay={() => handlePlay(it.url)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
