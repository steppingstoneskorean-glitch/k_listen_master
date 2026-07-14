// src/lib/quizStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Artist Live 퀴즈 데이터 Firestore 저장소
//   · 컬렉션: kartistQuizzes / 문서 ID: videoId
//   · draft(초안) 와 published(배포본) 를 한 문서에 함께 보관
//   · 학습자 페이지(KpopQuiz)는 published 만 읽는다
//   · 운영자 스튜디오(QuizStudioPage)는 draft 를 편집하고 "배포" 시 published 로 복사
//
// 멀티 모드(B/I/A) 스키마:
//   · 각 QuizItem 은 mode 필드를 가진다 (없으면 레거시 → 'A' 로 간주)
//   · B(Beginner)     : blocks[] — 관용구/절 단위 블록의 "정답 순서". 게임에서 섞어 출제
//   · I(Intermediate) : options[4] + correctIndex — 들은 문장의 의미 고르기
//   · A(Advanced)     : 기존 딕테이션 스키마 (fullSentence + blankWord)
//   · 저장/배포는 모드 단위 병합(saveModeItems) — 다른 모드의 기존 문항을 보존한다
// ─────────────────────────────────────────────────────────────────────────────

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GameMode } from '@/data/kArtistLive'

export interface QuizItem {
  id: string
  videoId: string
  startTime: number
  endTime: number
  /** 'B' | 'I' | 'A' — 없으면 레거시 데이터(딕테이션)로 보고 'A' 취급 */
  mode?: GameMode
  /** 전체 문장 (B 는 blocks.join(' '), I 는 듣기 대상 문장) */
  fullSentence: string
  /** A 전용: 빈칸으로 뚫을 절/어절 */
  blankWord?: string
  explanation?: string | Record<string, string>
  /** A 전용: 정답을 직접 노출하지 않는 발음/문맥 힌트. 비어 있으면 힌트 버튼 숨김 */
  hint?: string
  hasHardcodedSubs?: boolean
  /** 영상 자동 재생 속도. 미지정 시 1.0(기본 배속) */
  initialSpeed?: number
  /** B 전용: 절 단위 블록의 정답 순서 (게임에서 셔플되어 출제) */
  blocks?: string[]
  /** I 전용: 의미 보기 4개 */
  options?: string[]
  /** I 전용: options 중 정답 인덱스 (0~3) */
  correctIndex?: number
}

/** 레거시(mode 없음) 문항을 'A' 로 정규화 */
export function itemMode(q: QuizItem): GameMode {
  return q.mode ?? 'A'
}

const COLLECTION = 'kartistQuizzes'

function quizDoc(videoId: string) {
  if (!db) throw new Error('Firestore is not initialized')
  return doc(db, COLLECTION, videoId)
}

/** 학습자용: 배포된 퀴즈 목록(전 모드). 문서가 없거나 미배포면 null */
export async function loadPublishedQuizzes(videoId: string): Promise<QuizItem[] | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const published = snap.data().published
  return Array.isArray(published) && published.length > 0 ? (published as QuizItem[]) : null
}

/** 운영자용: 저장된 초안 불러오기 (전 모드) */
export async function loadDraft(videoId: string): Promise<QuizItem[] | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const draft = snap.data().draft
  return Array.isArray(draft) ? (draft as QuizItem[]) : null
}

/** 지정한 모드들의 기존 문항만 제거 (다른 모드 문항 보존) */
function stripModes(arr: unknown, modes: GameMode[]): QuizItem[] {
  if (!Array.isArray(arr)) return []
  return (arr as QuizItem[]).filter(q => !modes.includes(itemMode(q)))
}

/**
 * 모드 단위 저장/배포 (핵심 API)
 *   · items 는 전부 modes 에 속한 문항이어야 한다
 *   · 문서의 다른 모드 문항은 그대로 보존된다
 *   · publish=true 면 published 에도 반영
 */
export async function saveModeItems(
  videoId: string,
  modes: GameMode[],
  items: QuizItem[],
  publish: boolean,
): Promise<void> {
  const ref = quizDoc(videoId)
  const snap = await getDoc(ref)
  const data = snap.exists() ? snap.data() : {}

  const draft = [...stripModes(data.draft, modes), ...items]
  const payload: Record<string, unknown> = { videoId, draft, updatedAt: serverTimestamp() }
  if (publish) {
    payload.published = [...stripModes(data.published, modes), ...items]
    payload.publishedAt = serverTimestamp()
  }
  await setDoc(ref, payload, { merge: true })
}

/** 모드 단위 배포 취소 — 해당 모드 배포본만 제거, 다른 모드는 유지 */
export async function unpublishModeItems(videoId: string, modes: GameMode[]): Promise<void> {
  const ref = quizDoc(videoId)
  const snap = await getDoc(ref)
  const data = snap.exists() ? snap.data() : {}
  await setDoc(
    ref,
    { published: stripModes(data.published, modes), updatedAt: serverTimestamp() },
    { merge: true },
  )
}

// ── 레거시 API (A 모드 = 딕테이션 전용 화면들이 사용) ─────────────────────────
// 모드 병합 방식으로 재구현되어 B/I 문항을 실수로 지우지 않는다.

/** 운영자용: 초안 저장 (A 모드 병합, 배포본은 건드리지 않음) */
export async function saveDraft(videoId: string, items: QuizItem[]): Promise<void> {
  await saveModeItems(videoId, ['A'], items.map(q => ({ ...q, mode: itemMode(q) })), false)
}

/** 운영자용: 현재 초안을 배포본으로 복사 — 이 순간부터 학습자에게 공개 */
export async function publishQuizzes(videoId: string, items: QuizItem[]): Promise<void> {
  await saveModeItems(videoId, ['A'], items.map(q => ({ ...q, mode: itemMode(q) })), true)
}

/** 운영자용: 배포 취소 (A 모드만 — 학습자 페이지는 하드코딩 fallback 으로 돌아감) */
export async function unpublishQuizzes(videoId: string): Promise<void> {
  await unpublishModeItems(videoId, ['A'])
}
