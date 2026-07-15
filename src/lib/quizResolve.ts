// src/lib/quizResolve.ts
// ─────────────────────────────────────────────────────────────────────────────
// 학습자에게 실제로 보여줄 퀴즈/모드를 결정하는 단일 규칙 (썸네일 배지 ↔ 게임 화면 일치)
//
//   모드 단위 우선순위:
//     · 해당 모드의 배포본(published)이 있으면 → 배포본 사용
//     · 없으면 → 코드 내장(hardcoded) 문항으로 폴백
//   덕분에 "B만 새로 배포"해도 기존 A(하드코딩)가 사라지지 않는다.
//
//   썸네일의 [B][I][A] 배지도 이 결과에서 파생되므로,
//   운영자가 스튜디오에서 모드를 추가/배포하면 카드 배지가 자동으로 갱신된다.
// ─────────────────────────────────────────────────────────────────────────────

import { MODE_ORDER, type GameMode, type ModeInfo } from '@/data/kArtistLive'
import { HARDCODED_QUIZZES } from '@/data/hardcodedQuizzes'
import { itemMode, type QuizItem } from '@/lib/quizStore'

/** 영상별 코드 내장 문항 */
export function hardcodedFor(videoId: string): QuizItem[] {
  return HARDCODED_QUIZZES.filter(q => q.videoId === videoId)
}

/**
 * 배포본 + 하드코딩을 모드 단위로 병합.
 * published 가 null/빈 배열이면 하드코딩만 반환한다.
 */
export function mergeQuizzes(videoId: string, published: QuizItem[] | null): QuizItem[] {
  const local = hardcodedFor(videoId)
  const pub = published ?? []
  return MODE_ORDER.flatMap(m => {
    const fromPub = pub.filter(q => itemMode(q) === m)
    if (fromPub.length) return fromPub
    return local.filter(q => itemMode(q) === m)
  })
}

/** 병합 결과에서 실제 문항이 있는 모드만 추출 */
export function modesOf(items: QuizItem[]): GameMode[] {
  return MODE_ORDER.filter(m => items.some(q => itemMode(q) === m))
}

/**
 * 카드 배지용 ModeInfo[] 생성.
 *   · 어떤 모드가 있는지 → 실제 문항(배포본 ∪ 하드코딩) 기준
 *   · 각 모드의 별점    → Firestore modeStars > 코드 availableModes > 기본값 1
 */
export function resolveModeInfos(
  videoId: string,
  published: QuizItem[] | null,
  modeStars: Partial<Record<GameMode, number>> | undefined,
  fallback: ModeInfo[],
): ModeInfo[] {
  const items = mergeQuizzes(videoId, published)
  const modes = modesOf(items)
  if (modes.length === 0) return fallback
  return modes.map(m => {
    const fromDoc = modeStars?.[m]
    const fromCode = fallback.find(f => f.mode === m)?.stars
    const stars = (fromDoc ?? fromCode ?? 1) as 1 | 2 | 3
    return { mode: m, stars }
  })
}
