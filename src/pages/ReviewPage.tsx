import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
import { getDueReviews, gradeReview, reviewKey, type Grade } from '@/lib/review'

// 게임별 배지 — 게임명은 고유명사라 번역하지 않는다
const SOURCE_STYLE: Record<ErrorSource, { label: string; cls: string }> = {
  'catch-the-sound': { label: '🎧 Catch the Sound', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  'k-stars':         { label: '⭐ Listen to K-Stars', cls: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
  'shadowing':       { label: '🎤 Shadowing', cls: 'bg-violet-50 text-violet-600 border-violet-200' },
}

const MODE_LABEL: Record<string, string> = { A: 'Dictation', B: 'Word Order', I: 'Meaning' }

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

// ─────────────────────────────────────────────────────────────────────────────
// 간격 반복 복습 세션 — 카드를 한 장씩 보여주고 스스로 채점(다시/알맞음/쉬움)
// ─────────────────────────────────────────────────────────────────────────────
function ReviewSession({ cards, onDone }: { cards: ErrorRecord[]; onDone: () => void }) {
  const { t } = useLang()
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const card = cards[idx]
  const source = card ? getSource(card) : 'catch-the-sound'
  const isShadowing = source === 'shadowing'
  const isKStars = source === 'k-stars'

  // 섀도잉은 문장을 보고 따라 말하는 과제라 앞면부터 문장을 보여준다
  useEffect(() => { setRevealed(isShadowing) }, [idx, isShadowing])

  if (!card) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-4xl">🎉</div>
        <p className="mt-3 text-lg font-black text-emerald-700">{t('review.sessionDone')}</p>
        <p className="mt-1 text-sm text-emerald-600">
          {t('review.reviewedFmt').replace('{n}', String(cards.length))}
        </p>
        <button
          onClick={onDone}
          className="mt-5 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-opacity hover:opacity-90"
        >
          {t('review.finish')}
        </button>
      </div>
    )
  }

  const prompt = isKStars ? t('review.promptContext')
    : isShadowing ? t('review.promptShadow')
    : t('review.promptWord')

  const grade = (g: Grade) => {
    gradeReview(card, g)
    if (idx + 1 >= cards.length) { setIdx(cards.length); return }
    setIdx(idx + 1)
  }

  // 문맥 문장에서 정답 표현을 빈칸으로 가린 앞면
  const blanked = isKStars && card.context
    ? card.context.replace(card.word, '____')
    : null

  const GRADES: { g: Grade; label: string; cls: string }[] = [
    { g: 'again', label: t('review.gradeAgain'), cls: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100' },
    { g: 'good',  label: t('review.gradeGood'),  cls: 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
    { g: 'easy',  label: t('review.gradeEasy'),  cls: 'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
  ]

  const answerSizeCls = card.word.length > 14 ? 'text-xl leading-snug' : 'text-4xl'

  return (
    <div>
      {/* Progress */}
      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>{t('review.progressFmt').replace('{done}', String(idx + 1)).replace('{total}', String(cards.length))}</span>
        <div className="h-1.5 flex-1 mx-3 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${((idx) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* source badges */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${SOURCE_STYLE[source].cls}`}>
            {SOURCE_STYLE[source].label}
          </span>
          {isKStars && card.quizMode && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {MODE_LABEL[card.quizMode] ?? card.quizMode}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-500">{prompt}</p>

        {/* Front */}
        <div className="mt-3 min-h-[90px] flex flex-col items-center justify-center gap-3 text-center">
          {blanked && (
            <p translate="no" className="notranslate rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
              {blanked}
            </p>
          )}

          {/* catch-the-sound: 최소쌍 보기 (정답은 reveal 전까지 숨김) */}
          {!isKStars && !isShadowing && !revealed && (
            <div className="flex flex-wrap justify-center gap-2">
              {card.pair.map(w => (
                <span key={w} translate="no" className="notranslate rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-lg font-bold text-slate-700">
                  {w}
                </span>
              ))}
            </div>
          )}

          {/* revealed answer */}
          {revealed && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500">{t('review.answer')}</span>
              <span translate="no" className={`notranslate font-black text-slate-900 break-words ${answerSizeCls}`}>
                {card.word}
              </span>
            </div>
          )}
        </div>

        {isShadowing && (
          <Link
            to={`/shadowing?s=${encodeURIComponent(card.word)}`}
            className="mt-1 block text-center text-xs font-bold text-violet-600 hover:text-violet-700"
          >
            🎤 {t('shadowing.practiceThis')}
          </Link>
        )}

        {/* Actions */}
        <div className="mt-5">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              {t('review.reveal')}
            </button>
          ) : (
            <>
              <p className="mb-2 text-center text-xs font-semibold text-slate-400">{t('review.gradePrompt')}</p>
              <div className="grid grid-cols-3 gap-2">
                {GRADES.map(({ g, label, cls }) => (
                  <button
                    key={g}
                    onClick={() => grade(g)}
                    className={`rounded-xl border py-3 text-sm font-bold transition-colors ${cls}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 전체 오답 기록 카드 (기존 오답노트 UI)
// ─────────────────────────────────────────────────────────────────────────────
function ErrorCard({ record }: { record: ErrorRecord }) {
  const { t } = useLang()
  const status = getMasteryStatus(record)
  const style = STATUS_STYLE[status]
  const source = getSource(record)
  const sourceStyle = SOURCE_STYLE[source]
  const isKStars = source === 'k-stars'
  const lastMissTs = Math.max(...record.missTimestamps)
  const answerSizeCls = record.word.length > 14 ? 'text-lg leading-snug' : 'text-2xl'

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sourceStyle.cls}`}>{sourceStyle.label}</span>
        {isKStars && record.quizMode && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {MODE_LABEL[record.quizMode] ?? record.quizMode}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <span translate="no" className={`notranslate font-black text-slate-900 break-words ${answerSizeCls}`}>{record.word}</span>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold ${style.cls}`}>
          {t(style.label as Parameters<typeof t>[0])}
        </span>
      </div>
      {isKStars && record.context && (
        <p translate="no" className="notranslate rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-500">
          {record.context}
        </p>
      )}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span><span className="font-bold text-red-500">{record.missCount}</span> {t('errors.missed')}</span>
        <span>{t('errors.lastMissed')}: <span className="text-slate-500">{timeSince(lastMissTs)}</span></span>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const { t } = useLang()
  const [records, setRecords] = useState<ErrorRecord[]>([])
  const [due, setDue] = useState<ErrorRecord[]>([])
  const [inSession, setInSession] = useState(false)

  const reload = () => {
    setRecords(getErrors())
    setDue(getDueReviews())
  }
  useEffect(reload, [])

  const handleClear = () => {
    if (confirm('Clear all error records?')) { clearErrors(); reload() }
  }

  // 세션 시작 시점의 대기 카드를 고정(세션 도중 재정렬 방지)
  const sessionCards = useMemo(() => due, [inSession]) // eslint-disable-line react-hooks/exhaustive-deps

  const endSession = () => { setInSession(false); reload() }

  const sortedRecords = [...records].sort(
    (a, b) => Math.max(...b.missTimestamps) - Math.max(...a.missTimestamps),
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900">{t('review.title')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('review.subtitle')}</p>
        </div>

        {/* Review session or start hero */}
        {inSession ? (
          <ReviewSession cards={sessionCards} onDone={endSession} />
        ) : due.length > 0 ? (
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-emerald-50 p-6 text-center shadow-sm">
            <div className="text-3xl">🔁</div>
            <p className="mt-2 text-lg font-black text-slate-900">
              {t('review.dueFmt').replace('{n}', String(due.length))}
            </p>
            <button
              onClick={() => setInSession(true)}
              className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t('review.start')}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="text-4xl">✅</div>
            <p className="mt-3 font-semibold text-emerald-700">
              {records.length > 0 ? t('review.allClear') : t('errors.empty')}
            </p>
          </div>
        )}

        {/* Full records */}
        {records.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('review.allRecords')}</h2>
              <button onClick={handleClear} className="text-xs text-slate-400 transition-colors hover:text-red-500">
                {t('errors.clear')}
              </button>
            </div>
            {sortedRecords.map(r => <ErrorCard key={reviewKey(r)} record={r} />)}
          </div>
        )}
      </div>
    </div>
  )
}
