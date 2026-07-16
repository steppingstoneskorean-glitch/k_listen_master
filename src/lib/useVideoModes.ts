// src/lib/useVideoModes.ts
// 카드 배지용 — 전체 영상의 "실제 제공 모드"를 Firestore 배포본 기준으로 계산한다.
//   운영자가 스튜디오에서 모드를 추가/배포하면 썸네일 배지가 자동으로 갱신된다.
//   로딩 중이거나 문서가 없는 영상은 코드의 availableModes 를 그대로 쓴다(폴백).
//
//   liveVideos: LIVE_VIDEOS(코드 하드코딩) ∪ Firestore 에만 존재하는 배포 영상.
//   스튜디오는 title/artist 같은 카드 메타데이터를 입력받지 않으므로, 코드에
//   등록되지 않은 새 videoId 를 배포하면 videoId 기반 placeholder 카드로 자동 노출한다.
//   → 이게 없으면 "배포=홈에 자동 노출"이 코드에 미리 등록된 영상에만 해당되고,
//     완전히 새 영상은 배포해도 홈/허브 어디에도 나타나지 않는 파이프라인 단절이 생긴다.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadAllVideoQuizMeta, type VideoQuizMeta } from '@/lib/quizStore'
import { resolveModeInfos } from '@/lib/quizResolve'
import { LIVE_VIDEOS, type LiveVideo, type ModeInfo } from '@/data/kArtistLive'

export function useVideoModes() {
  const [meta, setMeta] = useState<Record<string, VideoQuizMeta> | null>(null)

  useEffect(() => {
    let cancelled = false
    loadAllVideoQuizMeta()
      .then(m => { if (!cancelled) setMeta(m) })
      .catch(() => { /* 오프라인/규칙 오류 → 코드 폴백 유지 */ })
    return () => { cancelled = true }
  }, [])

  /** videoId 의 배지용 모드 목록. 없으면 fallback(코드 availableModes) 반환 */
  const videoModes = useCallback(
    (videoId: string | undefined, fallback: ModeInfo[]): ModeInfo[] => {
      if (!videoId) return fallback
      const entry = meta?.[videoId]
      return resolveModeInfos(videoId, entry?.published ?? null, entry?.modeStars, fallback)
    },
    [meta],
  )

  /** LIVE_VIDEOS + 스튜디오에서 배포됐지만 코드에 아직 없는 영상(placeholder 카드) */
  const liveVideos = useMemo<LiveVideo[]>(() => {
    if (!meta) return LIVE_VIDEOS
    const known = new Set(LIVE_VIDEOS.map(v => v.videoId))
    const extra: LiveVideo[] = Object.entries(meta)
      .filter(([videoId, m]) => videoId && !known.has(videoId) && m.published.length > 0)
      .map(([videoId], i) => ({
        id: 100000 + i,
        title: { en: `New K-Content Quiz` },
        artist: 'K-Content',
        availableModes: [],
        url: `/kpop-quiz/${videoId}`,
        videoId,
        plays: 0,
        addedAt: Number.MAX_SAFE_INTEGER - i, // 최신순 정렬에서 맨 앞
      }))
    return extra.length ? [...LIVE_VIDEOS, ...extra] : LIVE_VIDEOS
  }, [meta])

  return { videoModes, liveVideos }
}
