// src/data/listening/blank.ts
// ─────────────────────────────────────────────────────────────────────────────
// 현상 기반 빈칸 생성기 (Phase 1)
//   · 기존 generateBlank(src/data/sentences.ts)의 "무작위 단어 가리기"와 달리,
//     annotation 의 span(연음·경음화·음운변화가 실제로 일어나는 지점)을 가린다.
//   · 학습자 약점(weakness) 가중치로 "오늘 훈련할 현상"을 우선 선택한다.
//   · sound-contrast(음소 변별)는 cloze 대상이 아니므로 제외 — 별도 변별 과제.
//   · 겨냥할 annotation 이 없으면 의미 단위(chunk)를 가리는 일반 받아쓰기로 폴백.
//   · 출시된 DictationSentence/generateBlank 은 건드리지 않는 신규 모듈.
// ─────────────────────────────────────────────────────────────────────────────

import type { DictationItem, Annotation, Phenomenon, ChangeType } from './schema'

/** cloze(빈칸)로 낼 수 있는 현상 — sound-contrast 는 변별 과제라 제외. */
const CLOZE_PHENOMENA: Phenomenon[] = ['pause', 'carry', 'change']

/** ClozeDisplay 의 정규식(/\[_+\]/)과 호환되는 빈칸 표식. */
const PLACEHOLDER = '[___]'

export interface ItemBlank {
  item: DictationItem
  /** transcript 에서 정답 구간을 PLACEHOLDER 로 바꾼 표시용 문자열. */
  displayText: string
  /** 학습자가 입력해야 하는 표기형 = transcript.slice(span). */
  answer: string
  span: [number, number]
  /** 이 빈칸이 겨냥한 현상. null = 폴백(현상 없이 chunk 가리기). */
  phenomenon: Phenomenon | null
  changeType?: ChangeType
  /** 실제 들리는 형태 — "왜 못 들었나" 해설(Decode)용. 폴백이면 null. */
  surface: string | null
  /** 겨냥한 annotation 원본. 폴백이면 null. */
  annotation: Annotation | null
}

export interface BlankOptions {
  /** 현상별 가중치(약점일수록 높게). 생략 시 균등. */
  weakness?: Partial<Record<Phenomenon, number>>
  /** 결정적 재현/테스트용 난수 함수. 기본 Math.random. */
  rng?: () => number
}

// ── 내부 유틸 ────────────────────────────────────────────────────────────────

const isSpace = (ch: string) => /\s/.test(ch)
const stripSpace = (s: string) => s.replace(/\s/g, '')

/** 가중치 기반 무작위 선택. 모든 가중치가 0이면 균등 선택. */
function weightedPick<T>(list: T[], weightOf: (t: T) => number, rng: () => number): T {
  const weights = list.map((t) => Math.max(0, weightOf(t)))
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return list[Math.floor(rng() * list.length)]
  let r = rng() * total
  for (let i = 0; i < list.length; i++) {
    r -= weights[i]
    if (r < 0) return list[i]
  }
  return list[list.length - 1]
}

/** transcript 안에서 idx 번째 chunk 가 차지하는 [start, end) 를 공백 무시로 찾는다. */
function locateChunk(transcript: string, chunks: string[], idx: number): [number, number] | null {
  const before = chunks.slice(0, idx).reduce((n, c) => n + stripSpace(c).length, 0)
  const target = stripSpace(chunks[idx]).length
  if (target === 0) return null
  let nonSpace = 0
  let start = -1
  let end = -1
  for (let i = 0; i < transcript.length; i++) {
    if (isSpace(transcript[i])) continue
    if (nonSpace === before) start = i
    nonSpace++
    if (nonSpace === before + target) { end = i + 1; break }
  }
  return start >= 0 && end >= 0 ? [start, end] : null
}

function spanIsValid(span: unknown, len: number): span is [number, number] {
  return (
    Array.isArray(span) && span.length === 2 &&
    Number.isInteger(span[0]) && Number.isInteger(span[1]) &&
    span[0] >= 0 && span[1] <= len && span[0] < span[1]
  )
}

function blankAt(item: DictationItem, span: [number, number], a: Annotation | null): ItemBlank {
  const [s, e] = span
  return {
    item,
    displayText: item.transcript.slice(0, s) + PLACEHOLDER + item.transcript.slice(e),
    answer: item.transcript.slice(s, e),
    span,
    phenomenon: a ? a.phenomenon : null,
    changeType: a?.changeType,
    surface: a ? a.surface : null,
    annotation: a,
  }
}

// ── 공개 API ─────────────────────────────────────────────────────────────────

/**
 * 한 항목에서 현상 겨냥 빈칸을 하나 생성한다.
 * 겨냥 가능한 annotation 이 있으면 약점 가중으로 하나 선택, 없으면 chunk 폴백.
 */
export function generateItemBlank(item: DictationItem, opts: BlankOptions = {}): ItemBlank {
  const rng = opts.rng ?? Math.random
  const weakness = opts.weakness ?? {}
  const len = item.transcript.length

  const eligible = item.annotations.filter(
    (a) => CLOZE_PHENOMENA.includes(a.phenomenon) && spanIsValid(a.span, len),
  )

  if (eligible.length > 0) {
    const chosen = weightedPick(eligible, (a) => weakness[a.phenomenon] ?? 1, rng)
    return blankAt(item, chosen.span, chosen)
  }

  // 폴백 — 의미 단위(chunk) 하나를 가린다.
  const chunks = item.chunks && item.chunks.length > 0 ? item.chunks : [item.transcript]
  const idx = Math.floor(rng() * chunks.length)
  const span = locateChunk(item.transcript, chunks, idx) ?? [0, len]
  return blankAt(item, span, null)
}

/** 세션용 무작위 추출 (기존 pickRandom 의 item 버전). */
export function pickItems(pool: DictationItem[], count = 5, rng: () => number = Math.random): DictationItem[] {
  return [...pool].sort(() => rng() - 0.5).slice(0, Math.min(count, pool.length))
}
