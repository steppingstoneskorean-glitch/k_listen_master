import { useState, useEffect } from 'react'
import { useLang } from '@/lib/i18n'
import {
  getErrors,
  clearErrors,
  getMasteryStatus,
  type ErrorRecord,
  type MasteryStatus,
} from '@/lib/errorHistory'

const STATUS_STYLE: Record<MasteryStatus, { label: string; cls: string }> = {
  needs_review: { label: 'errors.status.needsReview', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  improving:    { label: 'errors.status.improving',   cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  watch:        { label: 'errors.status.watch',        cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
}

function timeSince(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ErrorCard({ record }: { record: ErrorRecord }) {
  const { t } = useLang()
  const status = getMasteryStatus(record)
  const style = STATUS_STYLE[status]
  const lastMissTs = Math.max(...record.missTimestamps)
  const lastCorrectTs = record.correctTimestamps.length > 0 ? Math.max(...record.correctTimestamps) : null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        {/* Word */}
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl font-black text-white">{record.word}</span>
          <span className="text-gray-600 text-xs">Level {record.level}</span>
        </div>
        {/* Status badge */}
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.cls}`}>
          {t(style.label as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* Pair */}
      <div className="flex flex-wrap gap-1.5">
        {record.pair.map(w => (
          <span
            key={w}
            className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
              w === record.word
                ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                : w === record.lastUserAnswer
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {w}
            {w === record.word && <span className="ml-1 text-[10px]">✓</span>}
          </span>
        ))}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
        <span>
          <span className="text-red-400 font-bold">{record.missCount}</span>
          {' '}{t('errors.missed')}
        </span>
        <span>{t('errors.lastMissed')}: <span className="text-gray-500">{timeSince(lastMissTs)}</span></span>
        {lastCorrectTs !== null && (
          <span className="text-green-500">
            ✓ {timeSince(lastCorrectTs)}
          </span>
        )}
      </div>
    </div>
  )
}

type SortKey = 'recent' | 'missCount' | 'status'

export default function ErrorHistoryPage() {
  const { t } = useLang()
  const [records, setRecords] = useState<ErrorRecord[]>([])
  const [sort, setSort] = useState<SortKey>('recent')
  const [filter, setFilter] = useState<MasteryStatus | 'all'>('all')

  const reload = () => {
    setRecords(getErrors())
  }

  useEffect(reload, [])

  const handleClear = () => {
    if (confirm('Clear all error records?')) { clearErrors(); setRecords([]) }
  }

  const sorted = [...records]
    .filter(r => filter === 'all' || getMasteryStatus(r) === filter)
    .sort((a, b) => {
      if (sort === 'missCount') return b.missCount - a.missCount
      if (sort === 'status') {
        const order: MasteryStatus[] = ['needs_review', 'watch', 'improving']
        return order.indexOf(getMasteryStatus(a)) - order.indexOf(getMasteryStatus(b))
      }
      return Math.max(...b.missTimestamps) - Math.max(...a.missTimestamps)
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black">{t('errors.title')}</h1>
        {records.length > 0 && (
          <button onClick={handleClear} className="text-xs text-gray-600 hover:text-red-400 transition-colors">
            {t('errors.clear')}
          </button>
        )}
      </div>

      {/* Stat pills */}
      {records.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {(['all', 'needs_review', 'improving', 'watch'] as const).map(f => {
            const count = f === 'all' ? records.length : records.filter(r => getMasteryStatus(r) === f).length
            if (f !== 'all' && count === 0) return null
            const style = f === 'all' ? 'bg-gray-800 text-gray-300 border-gray-700' : STATUS_STYLE[f as MasteryStatus].cls
            const label = f === 'all' ? `All (${count})` : `${t(STATUS_STYLE[f as MasteryStatus].label as Parameters<typeof t>[0])} (${count})`
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${style} ${filter === f ? 'ring-2 ring-white/20' : 'opacity-70 hover:opacity-100'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Sort controls */}
      {records.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Sort:</span>
          {([['recent', 'Recent'], ['missCount', 'Miss count'], ['status', 'Status']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-2 py-0.5 rounded transition-colors ${sort === k ? 'text-indigo-400 font-bold' : 'hover:text-gray-300'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <div className="text-4xl mb-4">✅</div>
          <p>{t('errors.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(r => <ErrorCard key={r.word} record={r} />)}
        </div>
      )}
    </div>
  )
}
