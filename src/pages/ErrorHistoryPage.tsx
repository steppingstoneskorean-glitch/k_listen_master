import { useState, useEffect } from 'react'
import { useLang } from '@/lib/i18n'
import {
  getErrors,
  clearErrors,
  getMasteryStatus,
  getSource,
  type ErrorRecord,
  type MasteryStatus,
  type ErrorSource,
} from '@/lib/errorHistory'

// 게임별 배지 — 게임명은 고유명사라 번역하지 않는다
const SOURCE_STYLE: Record<ErrorSource, { label: string; cls: string }> = {
  'catch-the-sound': { label: '🎧 Catch the Sound', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  'k-stars':         { label: '⭐ Listen to K-Stars', cls: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
}

// K-Stars 문제 유형 라벨
const MODE_LABEL: Record<string, string> = {
  A: 'Dictation',
  B: 'Word Order',
  I: 'Meaning',
}

/** 레코드의 고유 키 — 영상이 다르면 같은 단어라도 별개의 오답이다 */
function recordKey(r: ErrorRecord): string {
  return `${getSource(r)}:${r.videoId ?? ''}:${r.quizMode ?? ''}:${r.word}`
}

const STATUS_STYLE: Record<MasteryStatus, { label: string; cls: string }> = {
  needs_review: { label: 'errors.status.needsReview', cls: 'bg-red-50 text-red-600 border-red-200' },
  improving:    { label: 'errors.status.improving',   cls: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  watch:        { label: 'errors.status.watch',        cls: 'bg-amber-50 text-amber-600 border-amber-200' },
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
  const source = getSource(record)
  const sourceStyle = SOURCE_STYLE[source]
  const isKStars = source === 'k-stars'
  const lastMissTs = Math.max(...record.missTimestamps)
  const lastCorrectTs = record.correctTimestamps.length > 0 ? Math.max(...record.correctTimestamps) : null

  // 어순(B) 모드의 정답은 문장 전체라 단어보다 길다 → 글자 크기를 낮춘다
  const answerSizeCls = record.word.length > 14 ? 'text-lg leading-snug' : 'text-2xl'

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col gap-3">
      {/* 게임 출처 + 문제 유형 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceStyle.cls}`}>
          {sourceStyle.label}
        </span>
        {isKStars && record.quizMode && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200">
            {MODE_LABEL[record.quizMode] ?? record.quizMode}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        {/* Word */}
        <div className="flex items-baseline gap-2 flex-wrap min-w-0">
          <span translate="no" className={`notranslate font-black text-slate-900 break-words ${answerSizeCls}`}>
            {record.word}
          </span>
          {!isKStars && <span className="text-slate-400 text-xs">Level {record.level}</span>}
        </div>
        {/* Status badge */}
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border ${style.cls}`}>
          {t(style.label as Parameters<typeof t>[0])}
        </span>
      </div>

      {/* K-Stars: 원문 문장 + 내가 쓴 답 (최소쌍이 없으므로 맥락으로 대체) */}
      {isKStars && (
        <div className="flex flex-col gap-2">
          {record.context && (
            <p translate="no" className="notranslate text-sm text-slate-500 leading-relaxed bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
              {record.context}
            </p>
          )}
          {record.lastUserAnswer && (
            <p className="text-xs text-slate-400">
              {t('kpop.myAnswer')}:{' '}
              <span translate="no" className="notranslate text-red-500 font-semibold line-through">
                {record.lastUserAnswer}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Pair — Catch the Sound 최소쌍 (K-Stars 의미 고르기에서는 보기 목록) */}
      <div className="flex flex-wrap gap-1.5">
        {record.pair.map(w => (
          <span
            key={w}
            className={`px-2.5 py-1 rounded-lg text-sm font-medium ${
              w === record.word
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : w === record.lastUserAnswer
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}
          >
            {w}
            {w === record.word && <span className="ml-1 text-[10px]">✓</span>}
          </span>
        ))}
      </div>

      {/* K-Stars: 해당 영상 퀴즈로 바로 이동 */}
      {isKStars && record.videoId && (
        <a
          href={`/kpop-quiz/${record.videoId}`}
          className="self-start text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          ▶ Practice again
        </a>
      )}

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
        <span>
          <span className="text-red-500 font-bold">{record.missCount}</span>
          {' '}{t('errors.missed')}
        </span>
        <span>{t('errors.lastMissed')}: <span className="text-slate-500">{timeSince(lastMissTs)}</span></span>
        {lastCorrectTs !== null && (
          <span className="text-emerald-600">
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
    <div className="min-h-screen bg-slate-50">
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-slate-900">{t('errors.title')}</h1>
        {records.length > 0 && (
          <button onClick={handleClear} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
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
            const style = f === 'all' ? 'bg-white text-slate-600 border-slate-300' : STATUS_STYLE[f as MasteryStatus].cls
            const label = f === 'all' ? `All (${count})` : `${t(STATUS_STYLE[f as MasteryStatus].label as Parameters<typeof t>[0])} (${count})`
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${style} ${filter === f ? 'ring-2 ring-slate-400' : 'opacity-70 hover:opacity-100'}`}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      {/* Sort controls */}
      {records.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Sort:</span>
          {([['recent', 'Recent'], ['missCount', 'Miss count'], ['status', 'Status']] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-2 py-0.5 rounded transition-colors ${sort === k ? 'text-indigo-600 font-bold' : 'hover:text-slate-700'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {sorted.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="text-4xl mb-4">✅</div>
          <p>{t('errors.empty')}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {sorted.map(r => <ErrorCard key={recordKey(r)} record={r} />)}
        </div>
      )}
    </div>
    </div>
  )
}
