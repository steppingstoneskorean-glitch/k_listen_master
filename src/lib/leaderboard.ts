import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore'
import { db as _db } from './firebase'

export interface LeaderboardEntry {
  id?: string
  name: string
  score: number
  highestLevel: number
  result: 'win' | 'lose'
  timestamp: number
}

export interface RankedEntry extends LeaderboardEntry {
  rank: number
}

export async function submitScore(
  entry: Omit<LeaderboardEntry, 'id'>,
): Promise<void> {
  if (!_db) return
  try {
    await addDoc(collection(_db, 'gameLeaderboard'), {
      ...entry,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.warn('Failed to submit score:', err)
  }
}

export async function getLeaderboard(): Promise<RankedEntry[]> {
  if (!_db) return []
  try {
    const q = query(
      collection(_db, 'gameLeaderboard'),
      orderBy('score', 'desc'),
    )
    const snap = await getDocs(q)
    const entries: LeaderboardEntry[] = snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<LeaderboardEntry, 'id'>),
    }))
    entries.sort((a, b) =>
      b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp,
    )
    return assignRanks(entries)
  } catch (err) {
    console.warn('Failed to fetch leaderboard:', err)
    return []
  }
}

function assignRanks(entries: LeaderboardEntry[]): RankedEntry[] {
  let rank = 1
  return entries.map((entry, i) => {
    if (i > 0 && entries[i - 1].score !== entry.score) {
      rank = i + 1
    }
    return { ...entry, rank }
  })
}

// ── Intermediate leaderboard ────────────────────────────────────────────────

export interface IntermediateEntry {
  id?: string
  name: string
  score: number
  correctCount: number
  timestamp: number
}

export interface RankedIntermediateEntry extends IntermediateEntry {
  rank: number
}

export async function submitIntermediateScore(
  entry: Omit<IntermediateEntry, 'id'>,
): Promise<void> {
  if (!_db) return
  try {
    await addDoc(collection(_db, 'intLeaderboard'), {
      ...entry,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.warn('Failed to submit intermediate score:', err)
  }
}

export async function getIntermediateLeaderboard(): Promise<RankedIntermediateEntry[]> {
  if (!_db) return []
  try {
    const q = query(
      collection(_db, 'intLeaderboard'),
      orderBy('score', 'desc'),
    )
    const snap = await getDocs(q)
    const entries: IntermediateEntry[] = snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<IntermediateEntry, 'id'>),
    }))
    entries.sort((a, b) =>
      b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp,
    )
    let rank = 1
    return entries.map((entry, i) => {
      if (i > 0 && entries[i - 1].score !== entry.score) rank = i + 1
      return { ...entry, rank }
    })
  } catch (err) {
    console.warn('Failed to fetch intermediate leaderboard:', err)
    return []
  }
}

// ── Generic dictation leaderboard (intL1 / intL2 / advL1 / advL2) ─────────

export interface DictationEntry {
  id?: string
  name: string
  score: number
  correctCount: number
  timestamp: number
}

export interface RankedDictationEntry extends DictationEntry {
  rank: number
}

export async function submitDictationScore(
  collectionName: string,
  entry: Omit<DictationEntry, 'id'>,
): Promise<void> {
  if (!_db) return
  try {
    await addDoc(collection(_db, collectionName), {
      ...entry,
      timestamp: Date.now(),
    })
  } catch (err) {
    console.warn(`Failed to submit score to ${collectionName}:`, err)
  }
}

export async function getDictationLeaderboard(
  collectionName: string,
): Promise<RankedDictationEntry[]> {
  if (!_db) return []
  try {
    const q = query(
      collection(_db, collectionName),
      orderBy('score', 'desc'),
    )
    const snap = await getDocs(q)
    const entries: DictationEntry[] = snap.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Omit<DictationEntry, 'id'>),
    }))
    entries.sort((a, b) =>
      b.score !== a.score ? b.score - a.score : b.timestamp - a.timestamp,
    )
    let rank = 1
    return entries.map((entry, i) => {
      if (i > 0 && entries[i - 1].score !== entry.score) rank = i + 1
      return { ...entry, rank }
    })
  } catch (err) {
    console.warn(`Failed to fetch leaderboard from ${collectionName}:`, err)
    return []
  }
}
