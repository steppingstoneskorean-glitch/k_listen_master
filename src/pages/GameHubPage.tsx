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
import { useVideoAccess } from '@/lib/accessControl'
import AuthModal from '@/components/AuthModal'
import UpgradeModal from '@/components/UpgradeModal'
import { pickText, MODE_FILTERS, type LiveVideo, type ModeFilter, type ModeInfo } from '@/data/kArtistLive'
import { isMastered } from '@/lib/mastery'
import { useVideoModes } from '@/lib/useVideoModes'
import { VideoCard, FilterDropdown, ModeChip } from '@/components/kartist/ui'
import wordGuessImg from '../../assets/images/단어 맞히기.png'
import intermediateGameImg from '../../assets/images/Intermediate game.png'
import advancedGameImg from '../../assets/images/Advanced game.png'

// ── 통합 아이템 모델 ────────────────────────────────────────────────────────
interface HubItem {
  key: string
  title: string // 현재 언어로 해석된 문자열
  desc?: string
  artist: string // 'BTS'... 또는 STEP_ARTIST
  modes: ModeInfo[] // B/I/A + 모드별 1~3성 (9-tier)
  url: string // 빈 문자열이면 Coming Soon
  videoId?: string
  emoji?: string // 퀴즈 카드용 (썸네일 대체)
  imageSrc?: string // 퀴즈 카드용 썸네일 이미지
  plays: number // 인기순
  addedAt: number // 최신순 (클수록 최신)
}

const STEP_ARTIST = 'Step & Step'

// 아티스트 필터 옵션 (K-Artist + Step & Step)
const HUB_ARTISTS = ['__all__', 'BTS', 'Blackpink', 'EXO', 'SKZ', 'Ateez', 'K-Drama', STEP_ARTIST] as const
type HubArtist = (typeof HUB_ARTISTS)[number]

const SORT_KEYS = ['popular', 'newest'] as const
type SortKey = (typeof SORT_KEYS)[number]

// Step & Step 퀴즈 카드 정의 (i18n 키 + 라우트)
const STEP_QUIZZES: {
  key: string
  titleKey: 'home.level1.title' | 'home.level2.title' | 'home.level3.title'
  descKey: 'home.level1.desc' | 'home.level2.desc' | 'home.level3.desc'
  emoji: string
  imageSrc?: string
  modes: ModeInfo[]
  url: string
  plays: number
  addedAt: number
}[] = [
  { key: 'q1', titleKey: 'home.level1.title', descKey: 'home.level1.desc', emoji: '🎯', imageSrc: wordGuessImg, modes: [{ mode: 'B', stars: 1 }], url: '/game', plays: 2100, addedAt: 9 },
  { key: 'q2', titleKey: 'home.level2.title', descKey: 'home.level2.desc', emoji: '🗣️', imageSrc: intermediateGameImg, modes: [{ mode: 'I', stars: 2 }], url: '/dictation?mode=intermediate', plays: 1450, addedAt: 8 },
  { key: 'q3', titleKey: 'home.level3.title', descKey: 'home.level3.desc', emoji: '🎙️', imageSrc: advancedGameImg, modes: [{ mode: 'A', stars: 3 }], url: '/dictation?mode=advanced', plays: 980, addedAt: 7 },
]

function buildItems(t: ReturnType<typeof useLang>['t'], lang: Lang, liveVideos: LiveVideo[]): HubItem[] {
  const artistItems: HubItem[] = liveVideos.map(v => ({
    key: `live-${v.id}`,
    title: pickText(v.title, lang),
    desc: v.desc ? pickText(v.desc, lang) : undefined,
    artist: v.artist,
    modes: v.availableModes,
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
    modes: q.modes,
    url: q.url,
    emoji: q.emoji,
    imageSrc: q.imageSrc,
    plays: q.plays,
    addedAt: q.addedAt,
  }))

  return [...quizItems, ...artistItems]
}

export default function GameHubPage() {
  const { t, lang } = useLang()
  const { user, isGuest } = useAuth()
  const { checkAccess, unlock } = useVideoAccess()
  const navigate = useNavigate()
  // 배포본 기준 실제 모드/카드 목록 (운영자가 배포하면 배지·카드가 자동 갱신)
  const { videoModes, liveVideos } = useVideoModes()

  const [modalTarget, setModalTarget] = useState<string | null>(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [artistFilter, setArtistFilter] = useState<HubArtist>('__all__')
  const [modeFilter, setModeFilter] = useState<ModeFilter>('__all__')
  const [sortKey, setSortKey] = useState<SortKey>('popular')
  const [desc, setDesc] = useState(true) // 기본: 내림차순(많이 도전한 순)

  const handlePlay = async (to: string, videoId?: string) => {
    if (!to) return
    if (!user && !isGuest) {
      setModalTarget(to)
      return
    }
    // K-Artist Live 영상(videoId 있음)만 등급별 일일 잠금 대상 — Step&Step 퀴즈는 게이팅 없음
    if (videoId && user) {
      const { allowed } = checkAccess(videoId)
      if (!allowed) {
        setShowUpgrade(true)
        return
      }
      await unlock(videoId)
    }
    navigate(to)
  }

  const items = useMemo(() => buildItems(t, lang, liveVideos), [t, lang, liveVideos])

  const visible = useMemo(() => {
    const filtered = items.filter(
      it =>
        (artistFilter === '__all__' || it.artist === artistFilter) &&
        (modeFilter === '__all__' ||
          videoModes(it.videoId, it.modes).some(m => m.mode === modeFilter)),
    )
    const sorted = [...filtered].sort((a, b) => {
      const va = sortKey === 'popular' ? a.plays : a.addedAt
      const vb = sortKey === 'popular' ? b.plays : b.addedAt
      return desc ? vb - va : va - vb
    })
    return sorted
  }, [items, artistFilter, modeFilter, sortKey, desc, videoModes])

  const modeName = (m: ModeFilter) =>
    m === 'B' ? t('mode.beginner') : m === 'I' ? t('mode.intermediate') : t('mode.advanced')

  return (
    <>
      {modalTarget && <AuthModal targetPath={modalTarget} onClose={() => setModalTarget(null)} />}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

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
              label={t('hub.filterMode')}
              value={modeFilter}
              options={MODE_FILTERS}
              renderOption={v =>
                v === '__all__' ? (
                  <span>{t('kartist.all')}</span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ModeChip mode={v} />
                    {modeName(v)}
                  </span>
                )
              }
              onSelect={setModeFilter}
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
                    modes={videoModes(it.videoId, it.modes)}
                    mastered={isMastered(it.videoId)}
                    videoId={it.videoId}
                    emoji={it.emoji}
                    imageSrc={it.imageSrc}
                    playable={Boolean(it.url)}
                    onPlay={() => handlePlay(it.url, it.videoId)}
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
