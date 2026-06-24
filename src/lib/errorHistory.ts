const STORAGE_KEY = 'klisten_errors'

export type MasteryStatus = 'needs_review' | 'improving' | 'watch'

export interface ErrorRecord {
  word: string          // the correct word that was played
  lastUserAnswer: string
  pair: string[]
  level: number
  missCount: number
  missTimestamps: number[]
  correctTimestamps: number[]
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

export function recordError(word: string, userAnswer: string, pair: string[], level: number) {
  const data = load()
  const existing = data[word]
  const now = Date.now()
  if (existing) {
    existing.missCount += 1
    existing.missTimestamps.push(now)
    existing.lastUserAnswer = userAnswer
    existing.level = level
  } else {
    data[word] = { word, lastUserAnswer: userAnswer, pair, level, missCount: 1, missTimestamps: [now], correctTimestamps: [] }
  }
  save(data)
}

export function recordCorrect(word: string) {
  const data = load()
  if (data[word]) {
    data[word].correctTimestamps.push(Date.now())
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
