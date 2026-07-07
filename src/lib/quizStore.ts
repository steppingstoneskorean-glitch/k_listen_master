// src/lib/quizStore.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Artist Live 퀴즈 데이터 Firestore 저장소
//   · 컬렉션: kartistQuizzes / 문서 ID: videoId
//   · draft(초안) 와 published(배포본) 를 한 문서에 함께 보관
//   · 학습자 페이지(KpopQuiz)는 published 만 읽는다
//   · 운영자 스튜디오(QuizStudioPage)는 draft 를 편집하고 "배포" 시 published 로 복사
// ─────────────────────────────────────────────────────────────────────────────

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface QuizItem {
  id: string
  videoId: string
  startTime: number
  endTime: number
  fullSentence: string
  blankWord: string
  explanation: string
  hasHardcodedSubs: boolean
}

const COLLECTION = 'kartistQuizzes'

function quizDoc(videoId: string) {
  if (!db) throw new Error('Firestore is not initialized')
  return doc(db, COLLECTION, videoId)
}

/** 학습자용: 배포된 퀴즈 목록. 문서가 없거나 미배포면 null */
export async function loadPublishedQuizzes(videoId: string): Promise<QuizItem[] | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const published = snap.data().published
  return Array.isArray(published) && published.length > 0 ? (published as QuizItem[]) : null
}

/** 운영자용: 저장된 초안 불러오기 */
export async function loadDraft(videoId: string): Promise<QuizItem[] | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const draft = snap.data().draft
  return Array.isArray(draft) ? (draft as QuizItem[]) : null
}

/** 운영자용: 초안 저장 (배포본은 건드리지 않음) */
export async function saveDraft(videoId: string, items: QuizItem[]): Promise<void> {
  await setDoc(
    quizDoc(videoId),
    { videoId, draft: items, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/** 운영자용: 현재 초안을 배포본으로 복사 — 이 순간부터 학습자에게 공개 */
export async function publishQuizzes(videoId: string, items: QuizItem[]): Promise<void> {
  await setDoc(
    quizDoc(videoId),
    { videoId, draft: items, published: items, publishedAt: serverTimestamp(), updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/** 운영자용: 배포 취소 (학습자 페이지는 하드코딩 fallback 으로 돌아감) */
export async function unpublishQuizzes(videoId: string): Promise<void> {
  await setDoc(
    quizDoc(videoId),
    { published: [], updatedAt: serverTimestamp() },
    { merge: true },
  )
}
