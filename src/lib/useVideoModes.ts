// src/lib/useVideoModes.ts
// 카드 배지용 — 전체 영상의 "실제 제공 모드"를 Firestore 배포본 기준으로 계산한다.
//   운영자가 스튜디오에서 모드를 추가/배포하면 썸네일 배지가 자동으로 갱신된다.
//   로딩 중이거나 문서가 없는 영상은 코드의 availableModes 를 그대로 쓴다(폴백).

import { useCallback, useEffect, useState } from 'react'
import { loadAllVideoQuizMeta, type VideoQuizMeta } from '@/lib/quizStore'
import { resolveModeInfos } from '@/lib/quizResolve'
import type { ModeInfo } from '@/data/kArtistLive'

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
  return useCallback(
    (videoId: string | undefined, fallback: ModeInfo[]): ModeInfo[] => {
      if (!videoId) return fallback
      const entry = meta?.[videoId]
      return resolveModeInfos(videoId, entry?.published ?? null, entry?.modeStars, fallback)
    },
    [meta],
  )
}
