// src/lib/mastery.ts
// ─────────────────────────────────────────────────────────────────────────────
// 영상별 모드 클리어/마스터리 진행도 (localStorage)
//   · 사용자가 한 영상의 B/I/A 모드를 각각 클리어하면 clearedModes 에 기록
//   · 영상이 제공하는 모든 모드를 클리어하면 masteryAchieved = true
//     → 카드 썸네일 위에 빛나는 왕관(👑) 표시
// ─────────────────────────────────────────────────────────────────────────────

import type { GameMode } from '@/data/kArtistLive'

const STORAGE_KEY = 'klm_mode_progress_v1'

export interface VideoProgress {
  clearedModes: GameMode[]
  masteryAchieved: boolean
}

type ProgressMap = Record<string, VideoProgress>

function readAll(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as ProgressMap
  } catch {
    /* ignore corrupt storage */
  }
  return {}
}

function writeAll(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode — ignore */
  }
}

/** 특정 영상의 진행도. 기록이 없으면 빈 진행도 반환 */
export function getVideoProgress(videoId: string): VideoProgress {
  const entry = readAll()[videoId]
  return entry ?? { clearedModes: [], masteryAchieved: false }
}

/** 카드 왕관 표시용 단축 헬퍼 */
export function isMastered(videoId: string | undefined): boolean {
  if (!videoId) return false
  return getVideoProgress(videoId).masteryAchieved
}

/**
 * 모드 클리어 기록. availableModes(영상이 제공하는 전체 모드)를 기준으로
 * 전부 클리어되면 masteryAchieved 를 true 로 승격한다.
 * 반환값으로 갱신된 진행도를 돌려주므로 호출부에서 축하 UI 를 띄울 수 있다.
 */
export function recordModeClear(
  videoId: string,
  mode: GameMode,
  availableModes: GameMode[],
): VideoProgress {
  const map = readAll()
  const prev = map[videoId] ?? { clearedModes: [], masteryAchieved: false }
  const cleared = prev.clearedModes.includes(mode)
    ? prev.clearedModes
    : [...prev.clearedModes, mode]
  const required = availableModes.length > 0 ? availableModes : [mode]
  const masteryAchieved = required.every(m => cleared.includes(m))
  const next: VideoProgress = { clearedModes: cleared, masteryAchieved }
  map[videoId] = next
  writeAll(map)
  return next
}
