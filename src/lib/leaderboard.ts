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
