// src/lib/review.ts
// ─────────────────────────────────────────────────────────────────────────────
// 개인 복습 — 간격 반복(Spaced Repetition) 스케줄러
//   · errorHistory 에 쌓인 오답 레코드를 "복습 카드"로 보고, 각 카드마다
//     다음 복습 시각(dueAt)·간격(interval)·난이도 계수(ease)를 관리한다.
//   · 스케줄 정보는 errorHistory 스키마를 건드리지 않도록 별도 저장소에 둔다.
//   · 사용자가 카드를 복습하고 스스로 채점(다시/알맞음/쉬움)하면 SM-2 를
//     단순화한 규칙으로 다음 간격을 늘리거나 줄인다.
// ─────────────────────────────────────────────────────────────────────────────

import { getErrors, getSource, recordCorrect, type ErrorRecord } from './errorHistory'

const SRS_KEY = 'klisten_srs_v1'
const DAY = 86_400_000
const AGAIN_DELAY = 10 * 60_000 // '다시' 를 누르면 약 10분 뒤 다시 등장

export type Grade = 'again' | 'good' | 'easy'

export interface SrsCard {
  intervalDays: number // 현재 복습 간격(일). '다시' 는 0
  ease: number         // 난이도 계수 (1.3 ~ 2.8)
  reps: number         // 연속 정답 횟수
  dueAt: number        // 다음 복습 예정 시각(ms epoch)
  lastReviewedAt: number
}

type SrsMap = Record<string, SrsCard>

/** 레코드의 고유 키 — 영상/모드가 다르면 같은 단어라도 별개의 카드다. */
export function reviewKey(r: ErrorRecord): string {
  return `${getSource(r)}:${r.videoId ?? ''}:${r.quizMode ?? ''}:${r.word}`
}

function loadMap(): SrsMap {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY) ?? '{}') as SrsMap
  } catch {
    return {}
  }
}

function saveMap(map: SrsMap) {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(map))
  } catch {
    /* quota / private mode — 복습 스케줄은 부가 기능이라 조용히 무시 */
  }
}

/** 아직 한 번도 복습하지 않은 새 카드는 '지금 바로 복습 대상'으로 본다. */
function isDue(card: SrsCard | undefined, now: number): boolean {
  return !card || card.dueAt <= now
}

/**
 * 지금 복습해야 할 카드 목록. 시급한 것(오답 반복 → needs_review)과
 * 예정 시각이 지난 지 오래된 것을 앞으로 정렬한다.
 */
export function getDueReviews(now: number = Date.now()): ErrorRecord[] {
  const map = loadMap()
  return getErrors()
    .filter(r => isDue(map[reviewKey(r)], now))
    .sort((a, b) => {
      const ca = map[reviewKey(a)]
      const cb = map[reviewKey(b)]
      // 예정 시각이 없는(새) 카드는 0 으로 봐서 가장 먼저
      const da = ca ? ca.dueAt : 0
      const db_ = cb ? cb.dueAt : 0
      if (da !== db_) return da - db_
      // 동률이면 더 많이 틀린 카드 우선
      return b.missCount - a.missCount
    })
}

/** 복습 대기 카드 수 — 대시보드/네비 배지에 사용. */
export function getDueCount(now: number = Date.now()): number {
  const map = loadMap()
  return getErrors().reduce((n, r) => (isDue(map[reviewKey(r)], now) ? n + 1 : n), 0)
}

/** 특정 카드의 현재 스케줄 (없으면 '새 카드' 기본값). */
export function getCard(r: ErrorRecord): SrsCard {
  return loadMap()[reviewKey(r)] ?? {
    intervalDays: 0, ease: 2.3, reps: 0, dueAt: 0, lastReviewedAt: 0,
  }
}

/**
 * 카드 채점 → 다음 간격 계산 후 저장.
 *   again : 간격 0, ease 하향, 약 10분 뒤 재등장
 *   good  : reps 에 따라 1일 → 3일 → interval×ease 로 확장
 *   easy  : good 보다 크게(×1.3, 최소 2일), ease 상향
 * 'good'·'easy' 는 errorHistory 에도 정답으로 기록해 '향상 중' 상태에 반영한다.
 */
export function gradeReview(r: ErrorRecord, grade: Grade, now: number = Date.now()): SrsCard {
  const map = loadMap()
  const key = reviewKey(r)
  const prev = map[key] ?? { intervalDays: 0, ease: 2.3, reps: 0, dueAt: 0, lastReviewedAt: 0 }

  let { intervalDays, ease, reps } = prev

  if (grade === 'again') {
    reps = 0
    intervalDays = 0
    ease = Math.max(1.3, ease - 0.2)
  } else {
    reps += 1
    if (reps === 1) intervalDays = grade === 'easy' ? 2 : 1
    else if (reps === 2) intervalDays = grade === 'easy' ? 5 : 3
    else intervalDays = Math.round(Math.max(1, prev.intervalDays) * ease * (grade === 'easy' ? 1.3 : 1))
    ease = grade === 'easy' ? Math.min(2.8, ease + 0.15) : ease
  }

  const dueAt = grade === 'again' ? now + AGAIN_DELAY : now + intervalDays * DAY
  const next: SrsCard = { intervalDays, ease, reps, dueAt, lastReviewedAt: now }
  map[key] = next
  saveMap(map)

  if (grade !== 'again') {
    // 정답으로 기록 (mastery 상태가 'improving' 으로 올라감)
    recordCorrect(r.word, { source: getSource(r), videoId: r.videoId, quizMode: r.quizMode })
  }
  return next
}

/** 간격을 사람이 읽는 문구로 (다음 복습까지). */
export function formatInterval(card: SrsCard): string {
  if (card.intervalDays <= 0) return '10m'
  if (card.intervalDays < 1) return '1d'
  return `${Math.round(card.intervalDays)}d`
}
