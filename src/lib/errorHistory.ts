const STORAGE_KEY = 'klisten_errors'

export type MasteryStatus = 'needs_review' | 'improving' | 'watch'

/** 오답이 발생한 게임. 기존(v1) 레코드에는 이 필드가 없으므로 없으면 'catch-the-sound' 로 본다. */
export type ErrorSource = 'catch-the-sound' | 'k-stars'

/** Listen to K-Stars 의 문제 유형 — B: 블록 배열, I: 의미 고르기, A: 받아쓰기 */
export type QuizMode = 'A' | 'B' | 'I'

export interface ErrorRecord {
  word: string          // the correct word that was played
  lastUserAnswer: string
  pair: string[]
  level: number
  missCount: number
  missTimestamps: number[]
  correctTimestamps: number[]

  // ── Listen to K-Stars 전용 (Catch the Sound 레코드에는 없음) ──
  source?: ErrorSource
  videoId?: string
  quizMode?: QuizMode
  /** 빈칸이 포함된 원문 문장 — 오답 카드에 맥락을 보여주기 위해 저장 */
  context?: string
}

export interface ErrorMeta {
  source?: ErrorSource
  videoId?: string
  quizMode?: QuizMode
  context?: string
}

/**
 * 저장소 키.
 * Catch the Sound 는 기존과 동일하게 단어 자체를 키로 쓴다(기존 데이터 호환).
 * K-Stars 는 영상이 달라도 같은 표현을 또 틀리면 한 장의 카드로 합친다
 * (missCount 누적 → 반복해서 틀리는 표현이 'Urgent Review' 로 올라온다).
 */
function keyOf(word: string, meta?: ErrorMeta): string {
  if (meta?.source === 'k-stars') return `kstars:${word}`
  return word
}

export function getSource(r: ErrorRecord): ErrorSource {
  return r.source ?? 'catch-the-sound'
}

function load(): Record<string, ErrorRecord> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function save(data: Record<string, ErrorRecord>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function recordError(
  word: string,
  userAnswer: string,
  pair: string[],
  level: number,
  meta?: ErrorMeta,
) {
  if (!word) return
  const data = load()
  const key = keyOf(word, meta)
  const existing = data[key]
  const now = Date.now()
  if (existing) {
    existing.missCount += 1
    existing.missTimestamps.push(now)
    existing.lastUserAnswer = userAnswer
    existing.level = level
    // 여러 영상에서 같은 표현을 틀리면 한 카드에 합쳐지므로,
    // 맥락·영상 링크는 항상 '가장 최근에 틀린' 문항 기준으로 갱신한다
    if (meta?.context) existing.context = meta.context
    if (meta?.videoId) existing.videoId = meta.videoId
    if (meta?.quizMode) existing.quizMode = meta.quizMode
    if (pair.length > 0) existing.pair = pair
  } else {
    data[key] = {
      word,
      lastUserAnswer: userAnswer,
      pair,
      level,
      missCount: 1,
      missTimestamps: [now],
      correctTimestamps: [],
      ...(meta?.source ? { source: meta.source } : {}),
      ...(meta?.videoId ? { videoId: meta.videoId } : {}),
      ...(meta?.quizMode ? { quizMode: meta.quizMode } : {}),
      ...(meta?.context ? { context: meta.context } : {}),
    }
  }
  save(data)
}

export function recordCorrect(word: string, meta?: ErrorMeta) {
  if (!word) return
  const data = load()
  const key = keyOf(word, meta)
  if (data[key]) {
    data[key].correctTimestamps.push(Date.now())
    save(data)
  }
}

export function getErrors(): ErrorRecord[] {
  const data = load()
  return Object.values(data).sort((a, b) => {
    const aLast = Math.max(...a.missTimestamps)
    const bLast = Math.max(...b.missTimestamps)
    return bLast - aLast
  })
}

export function clearErrors() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getMasteryStatus(r: ErrorRecord): MasteryStatus {
  const lastMiss = Math.max(...r.missTimestamps)
  const lastCorrect = r.correctTimestamps.length > 0 ? Math.max(...r.correctTimestamps) : null

  if (lastCorrect !== null && lastCorrect > lastMiss) return 'improving'
  if (r.missCount >= 2) return 'needs_review'
  return 'watch'
}

// ── Mock data for development ─────────────────────────────────────────────────
export function seedMockErrors() {
  if (getErrors().length > 0) return
  const now = Date.now()
  const DAY = 86_400_000
  const mock: Record<string, ErrorRecord> = {
    '아이': {
      word: '아이', lastUserAnswer: '오이', pair: ['아이', '오이'], level: 1,
      missCount: 3, missTimestamps: [now - 5 * DAY, now - 3 * DAY, now - DAY],
      correctTimestamps: [],
    },
    '구두': {
      word: '구두', lastUserAnswer: '구도', pair: ['구두', '구도'], level: 1,
      missCount: 2, missTimestamps: [now - 4 * DAY, now - 2 * DAY],
      correctTimestamps: [now - DAY / 2],
    },
    '별': {
      word: '별', lastUserAnswer: '벌', pair: ['별', '벌'], level: 1,
      missCount: 1, missTimestamps: [now - 6 * DAY],
      correctTimestamps: [],
    },
    '거울': {
      word: '거울', lastUserAnswer: '겨울', pair: ['거울', '겨울'], level: 4,
      missCount: 4, missTimestamps: [now - 7 * DAY, now - 5 * DAY, now - 3 * DAY, now - DAY],
      correctTimestamps: [],
    },
    '사람': {
      word: '사람', lastUserAnswer: '사랑', pair: ['사람', '사랑'], level: 2,
      missCount: 1, missTimestamps: [now - DAY * 2],
      correctTimestamps: [now - DAY],
    },
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mock))
}
