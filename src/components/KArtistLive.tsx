// src/components/KArtistLive.tsx
// ─────────────────────────────────────────────────────────────────────────────
// K-Artist Live — 홈 화면 가로 캐러셀 (CSS scroll-snap)
//   · 좌우 화살표 버튼으로 부드럽게 슬라이드
//   · 'View All' 버튼 → 홈에서 확장하지 않고 전용 Game Hub(/games) 로 이동
//   · 카드/데이터/라벨은 shared 모듈(data/kArtistLive, components/kartist/ui) 재사용
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { LIVE_VIDEOS, pickText } from '@/data/kArtistLive'
import { isMastered } from '@/lib/mastery'
import { useVideoModes } from '@/lib/useVideoModes'
import { VideoCard, Chevron } from '@/components/kartist/ui'

export default function KArtistLive({
  onPlay,
  className = 'px-6 pb-20',
}: {
  onPlay?: (to: string) => void
  className?: string
}) {
  const { lang, t } = useLang()
  const navigate = useNavigate()
  // 배포본 기준 실제 모드 (운영자가 배포하면 배지가 자동 갱신)
  const videoModes = useVideoModes()
  const trackRef = useRef<HTMLDivElement>(null)

  // 한 번에 카드 한 장(+gap) 만큼 스크롤 — scroll-snap 이 위치를 정렬
  const scrollByCard = (dir: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    const first = track.querySelector<HTMLElement>('[data-card]')
    const step = first ? first.offsetWidth + 20 /* gap-5 */ : track.clientWidth * 0.8
    track.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section className={className}>
      {/* 캐러셀 스코프 스타일 (index.css 수정 없이 주입) */}
      <style>{`
        .ka-track { scrollbar-width: none; -ms-overflow-style: none; }
        .ka-track::-webkit-scrollbar { display: none; }
        @keyframes ka-pop {
          from { opacity: 0; transform: translateY(-4px) scale(.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ka-pop { animation: ka-pop .16s ease-out both; }
      `}</style>

      <div className="mx-auto max-w-4xl">
        {/* ── 타이틀 (Catch the Sound 와 동일하게 중앙 정렬) ── */}
        <div className="text-center">
          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-3xl" translate="no">
            🎧 Listen to <span className="text-indigo-600">K-Stars</span>
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-balance break-keep text-sm font-semibold text-slate-500">{t('kartist.subtitle')}</p>
          {/* B/I/A 배지 · 별점 의미 안내 */}
          <p className="mx-auto mt-1.5 max-w-xl text-balance break-keep text-xs text-slate-400">{t('kartist.legend')}</p>
        </div>

        {/* ── 캐러셀 ── */}
        <div className="relative mt-8">
          {/* 좌/우 화살표 (데스크톱) */}
          <button
            type="button"
            aria-label="previous"
            onClick={() => scrollByCard(-1)}
            className="absolute -left-3 top-[calc(50%-2rem)] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition-all hover:-translate-y-[calc(50%+2px)] hover:border-indigo-300 hover:text-indigo-600 sm:flex cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => scrollByCard(1)}
            className="absolute -right-3 top-[calc(50%-2rem)] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-600 shadow-md backdrop-blur transition-all hover:-translate-y-[calc(50%+2px)] hover:border-indigo-300 hover:text-indigo-600 sm:flex cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 스크롤 트랙 (scroll-snap) */}
          <div
            ref={trackRef}
            className="ka-track flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2"
          >
            {[...LIVE_VIDEOS].sort((a, b) => b.addedAt - a.addedAt).map(video => (
              <div
                key={video.id}
                data-card
                className="w-[78%] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)]"
              >
                <VideoCard
                  title={pickText(video.title, lang)}
                  desc={video.desc ? pickText(video.desc, lang) : undefined}
                  artist={video.artist}
                  modes={videoModes(video.videoId, video.availableModes)}
                  mastered={isMastered(video.videoId)}
                  videoId={video.videoId}
                  playable={Boolean(video.url)}
                  onPlay={() => onPlay?.(video.url)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── View All (캐러셀 하단 중앙 — 전 해상도 공통) ── */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => navigate('/games')}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md cursor-pointer"
          >
            {t('kartist.viewAll')}
            <Chevron open className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </div>
    </section>
  )
}
