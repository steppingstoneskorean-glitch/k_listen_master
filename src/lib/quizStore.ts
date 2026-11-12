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
//   · I(Intermediate) : 2026-11 부터 A 와 같은 딕테이션 스키마(fullSentence + blankWord, 더 쉬운 문장)
//                       기존 배포분은 options[4] + correctIndex(상황 이해 4지선다) 그대로 유지 — isChoiceItem 참고
//   · A(Advanced)     : 기존 딕테이션 스키마 (fullSentence + blankWord)
//   · 저장/배포는 모드 단위 병합(saveModeItems) — 다른 모드의 기존 문항을 보존한다
// ─────────────────────────────────────────────────────────────────────────────

import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { GameMode } from '@/data/kArtistLive'

/** 카드 배지 계산에 필요한 영상별 배포 요약
 *  (문서의 modeStars 필드는 2026-11 난이도 별 제거 이후 읽지도 쓰지도 않는다) */
export interface VideoQuizMeta {
  published: QuizItem[]
  /** 카드 제목 재료 — quizCardTitle() 참고 */
  card: QuizCardInfo
}

/** 카드 제목 재료: 스튜디오에서 입력한 제목 + 팟캐스트 여부·레벨 */
export interface QuizCardInfo {
  /** 스튜디오에서 입력한 퀴즈 제목 (예: '한국 카페, 왜 오래 있어요?') */
  title: string
  /** 팟캐스트 영상인가 — 라디오 음원이 있거나 유튜브 원제에 'Podcast' 가 있으면 */
  isPodcast: boolean
  /** 팟캐스트 레벨 — 퀴즈 담당이 영상 제목에서 읽은 값, 없으면 배포 모드로 추정 */
  level: GameMode | null
  /** 퀴즈 담당이 저장한 유튜브 원제 (제목 미입력 시 대체용) */
  sourceTitle: string
}

const LEVEL_KO: Record<GameMode, string> = { B: '초급', I: '중급', A: '고급' }
const AI_LEVEL: Record<string, GameMode> = { beginner: 'B', intermediate: 'I', advanced: 'A' }

function cardInfoOf(d: Record<string, unknown>, items: QuizItem[]): QuizCardInfo {
  const ai = (d.aiDraft ?? {}) as { level?: string; title?: string }
  const modes = [...new Set(items.map(itemMode))]
  return {
    title: typeof d.title === 'string' ? d.title.trim() : '',
    isPodcast: (typeof d.audioUrl === 'string' && Boolean(d.audioUrl)) || /podcast/i.test(ai.title ?? ''),
    level: AI_LEVEL[ai.level ?? ''] ?? (modes.length === 1 ? modes[0] : null),
    sourceTitle: typeof ai.title === 'string' ? ai.title : '',
  }
}

/**
 * 카드에 보일 퀴즈 제목
 *   팟캐스트: 'Podcast_초급_한국 카페, 왜 오래 있어요?' (제목 미입력이면 유튜브 원제에서 '_ Korean Podcast for …' 를 뗀 것)
 *   그 외:    입력한 제목, 없으면 'New K-Content Quiz'
 */
export function quizCardTitle(c: QuizCardInfo): string {
  if (!c.isPodcast) return c.title || 'New K-Content Quiz'
  const name =
    c.title ||
    c.sourceTitle.replace(/_?\s*Korean Podcast for.*$/i, '').replace(/[_\s]+$/, '').trim() ||
    'K-Content'
  return ['Podcast', c.level ? LEVEL_KO[c.level] : null, name].filter(Boolean).join('_')
}

/** 운영자용: 카드 제목 재료 (스튜디오의 제목 입력란·미리보기) */
export async function loadQuizCardInfo(videoId: string): Promise<QuizCardInfo | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const d = snap.data()
  const published = Array.isArray(d.published) ? (d.published as QuizItem[]) : []
  const draft = Array.isArray(d.draft) ? (d.draft as QuizItem[]) : []
  return cardInfoOf(d, published.length ? published : draft)
}

/** 운영자용: 퀴즈 제목 저장 — 문항(초안·배포본)은 건드리지 않는다 */
export async function saveQuizTitle(videoId: string, title: string): Promise<void> {
  await setDoc(quizDoc(videoId), { videoId, title: title.trim() }, { merge: true })
}

export interface QuizItem {
  id: string
  videoId: string
  startTime: number
  endTime: number
  /** 'B' | 'I' | 'A' — 없으면 레거시 데이터(딕테이션)로 보고 'A' 취급 */
  mode?: GameMode
  /** 전체 문장 (B 는 blocks.join(' '), I 는 듣기 대상 문장) */
  fullSentence: string
  /** A·I(딕테이션): 빈칸으로 뚫을 절/어절 */
  blankWord?: string
  explanation?: string | Record<string, string>
  /** A·I(딕테이션): 정답을 직접 노출하지 않는 발음/문맥 힌트. 비어 있으면 힌트 버튼 숨김 */
  hint?: string
  hasHardcodedSubs?: boolean
  /** 영상 자동 재생 속도. 미지정 시 1.0(기본 배속) */
  initialSpeed?: number
  /** B 전용: 절 단위 블록의 정답 순서 (게임에서 셔플되어 출제) */
  blocks?: string[]
  /** I(레거시 4지선다) 전용: 의미 보기 4개 */
  options?: string[]
  /** I(레거시 4지선다) 전용: options 중 정답 인덱스 (0~3) */
  correctIndex?: number
  /** I(레거시 4지선다) 전용: 상황 이해 질문 — 없으면 기본 안내문 사용 */
  question?: string
}

/** 레거시(mode 없음) 문항을 'A' 로 정규화 */
export function itemMode(q: QuizItem): GameMode {
  return q.mode ?? 'A'
}

/**
 * 4지선다(상황 이해) 문항인가 — 2026-11 이전에 만든 I 문항만 해당.
 * 새 I 문항은 options 없이 blankWord 를 가진 딕테이션이다.
 */
export function isChoiceItem(q: Pick<QuizItem, 'mode' | 'options'>): boolean {
  return (q.mode ?? 'A') === 'I' && Array.isArray(q.options) && q.options.length > 0
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

/**
 * 라디오 모드 음원 — 화면 자막이 박힌 팟캐스트 영상은 AI 퀴즈 담당이 오너의 영상 파일에서
 * 음성만 뽑아 audioUrl 로 올린다. 있으면 학습자 화면은 영상 대신 이 음원만 재생한다.
 */
export async function loadQuizAudioUrl(videoId: string): Promise<string | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  const url = snap.exists() ? snap.data().audioUrl : null
  return typeof url === 'string' && url ? url : null
}

/** 운영자용: 저장된 초안 불러오기 (전 모드) */
export async function loadDraft(videoId: string): Promise<QuizItem[] | null> {
  if (!db) return null
  const snap = await getDoc(quizDoc(videoId))
  if (!snap.exists()) return null
  const draft = snap.data().draft
  return Array.isArray(draft) ? (draft as QuizItem[]) : null
}

/**
 * 카드 배지용: 전체 영상의 배포본을 한 번에 로드.
 * 운영자가 스튜디오에서 모드를 추가/배포하면 카드 배지가 자동 갱신되도록 하는 소스.
 */
export async function loadAllVideoQuizMeta(): Promise<Record<string, VideoQuizMeta>> {
  if (!db) return {}
  const snaps = await getDocs(collection(db, COLLECTION))
  const out: Record<string, VideoQuizMeta> = {}
  snaps.forEach(s => {
    const d = s.data()
    const published = Array.isArray(d.published) ? (d.published as QuizItem[]) : []
    out[s.id] = { published, card: cardInfoOf(d, published) }
  })
  return out
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
