// src/components/Leaderboard.tsx
// 통합 리더보드 UI — Top 5(동점 그룹핑) + 내 순위가 Top 5 밖이면 강조된 "내 순위" 행 추가
//   · DictationPage 의 DictationLeaderboard 와 GamePage 의 인라인 리더보드 블록을 대체한다.

import { useState } from 'react'
import { useLang } from '@/lib/i18n'

export interface LeaderboardRow {
  id?: string
  name: string
  score: number
  rank: number
}

const RANK_BADGE: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' }
const TOP_N = 5

function TiedGroup({ names }: { names: string[] }) {
  const { t } = useLang()
  const [expanded, setExpanded] = useState(false)
  if (names.length === 1) {
    return <span className="flex-1 min-w-0 truncate text-sm font-semibold text-white">{names[0]}</span>
  }
  return (
    <span className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
      <span className="truncate max-w-[100px] text-sm font-semibold text-white">{names[0]}</span>
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2"
      >
        {t('game.othersFmt').replace('{n}', String(names.length - 1))}
      </button>
      {expanded && <span className="w-full text-xs text-gray-400 pl-1">{names.slice(1).join(', ')}</span>}
    </span>
  )
}

export default function Leaderboard({
  entries,
  myName,
  myScore,
}: {
  entries: LeaderboardRow[]
  /** 현재 유저의 제출 name/score — 지정하면 내 행을 강조하고, Top 5 밖이면 별도 "내 순위" 행을 추가한다 */
  myName?: string
  myScore?: number
}) {
  const { t } = useLang()

  const rankGroups = entries.reduce<Record<number, LeaderboardRow[]>>((acc, e) => {
    ;(acc[e.rank] = acc[e.rank] || []).push(e)
    return acc
  }, {})
  const topRanks = Object.keys(rankGroups)
    .map(Number)
    .sort((a, b) => a - b)
    .slice(0, TOP_N)

  const myEntry =
    myName !== undefined && myScore !== undefined
      ? entries.find(e => e.name === myName && e.score === myScore)
      : undefined
  const myRank = myEntry?.rank
  const iAmInTop = myRank !== undefined && topRanks.includes(myRank)

  return (
    <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
        <h3 className="font-bold text-sm">{t('game.leaderboard')}</h3>
        <span className="flex items-center gap-1.5 text-xs text-green-400">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
          {t('game.live')}
        </span>
      </div>
      <div className="divide-y divide-gray-800/50">
        {topRanks.length === 0 && (
          <div className="px-5 py-6 text-center text-gray-600 text-sm">{t('game.noRecords')}</div>
        )}
        {topRanks.map(rank => {
          const group = rankGroups[rank]
          const isTiedGroup = group.length > 1
          const isMe = myRank === rank
          return (
            <div
              key={rank}
              className={`flex items-start px-5 py-3.5 gap-3 ${
                isMe ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''
              }`}
            >
              <span className="text-lg w-5 text-center mt-0.5">{RANK_BADGE[rank] ?? '⭐'}</span>
              <span className="text-gray-500 text-xs w-14 mt-1">
                {isTiedGroup
                  ? t('game.tiedRankFmt').replace('{n}', String(rank))
                  : t('game.rankFmt').replace('{n}', String(rank))}
              </span>
              <TiedGroup names={group.map(e => e.name)} />
              <span className="font-bold text-yellow-400 text-sm tabular-nums mt-1">
                {group[0].score.toLocaleString()}
              </span>
            </div>
          )
        })}

        {myRank !== undefined && !iAmInTop && (
          <div className="flex items-center px-5 py-3.5 gap-3 bg-indigo-500/10 border-l-2 border-indigo-500">
            <span className="text-lg w-5 text-center">🔎</span>
            <span className="flex-1 text-sm font-bold text-indigo-300">
              {t('game.yourRankFmt')
                .replace('{n}', String(myRank))
                .replace('{score}', (myScore ?? 0).toLocaleString())}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
