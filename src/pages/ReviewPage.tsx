import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import {
  getErrors,
  clearErrors,
  removeErrors,
  getSource,
  type ErrorRecord,
  type ErrorSource,
} from '@/lib/errorHistory'
import { getDueReviews, gradeReview, reviewKey } from '@/lib/review'
import { speakKorean, cancelSpeech } from '@/lib/speak'
import { LIVE_VIDEOS, pickText } from '@/data/kArtistLive'
import { HARDCODED_QUIZZES } from '@/data/hardcodedQuizzes'
import { mergeQuizzes } from '@/lib/quizResolve'
import { loadPublishedQuizzes, itemMode, type QuizItem } from '@/lib/quizStore'

// 오답 레코드(word)를 퀴즈 문항과 매칭해 '영상 내 시작시간(startTime)'을 얻기 위한 헬퍼.
//   errorHistory.word 저장 규칙과 동일: A=blankWord, I=정답 보기, B=블록 이어붙인 문장.
type QuizQ = { videoId?: string; mode?: string; startTime?: number; blocks?: string[]; options?: string[]; correctIndex?: number; blankWord?: string }
const qMode = (q: QuizQ) => q?.mode || 'A'
const qCorrectText = (q: QuizQ): string => {
  const m = qMode(q)
  if (m === 'B') return (q.blocks || []).join(' ')
  if (m === 'I') return Array.isArray(q.options) ? (q.options[q.correctIndex ?? -1] || '') : ''
  return (q.blankWord || '').trim()
}
const QUIZZES = HARDCODED_QUIZZES as unknown as QuizQ[]

// 오답 레코드 → 매칭 문항의 startTime (영상 타임라인 순서용). 매칭 실패는 맨 뒤로.
function startTimeOfRecord(r: ErrorRecord): number {
  const q = QUIZZES.find(
    q => q.videoId === r.videoId && qMode(q) === (r.quizMode || 'A') && qCorrectText(q) === r.word,
  )
  return q ? (q.startTime ?? 0) : Number.MAX_SAFE_INTEGER
}

// ─────────────────────────────────────────────────────────────────────────────
// 오답 문장 다시 듣기 버튼
//   · Catch the Sound: 녹음된 /audio/{word}.wav 우선, 실패 시 TTS 폴백
//   · K-Stars / Shadowing: 저장된 오디오가 없으므로 ko-KR TTS 로 문장을 읽어준다
//     (K-Stars 는 빈칸 없는 원문 context, 나머지는 word)
// ─────────────────────────────────────────────────────────────────────────────
function listenText(r: ErrorRecord): string {
  return getSource(r) === 'k-stars' ? r.context || r.word : r.word
}

// ─────────────────────────────────────────────────────────────────────────────
// 한 단어(또는 문장)를 소리로 재생하는 훅.
//   · preferWav=true (Catch the Sound): 녹음된 /audio/{text}.wav 우선, 실패 시 TTS
//   · preferWav=false (K-Stars/Shadowing): ko-KR TTS 로 문장을 읽어준다
// ListenButton 과 단어 비교 칩(CompareChip)이 이 재생 로직을 공유한다.
// ─────────────────────────────────────────────────────────────────────────────
function useKoreanAudio(text: string, preferWav: boolean) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = () => {
    cancelSpeech()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setPlaying(false)
  }

  useEffect(() => () => stop(), []) // 언마운트 시 재생 정리

  const speak = () => {
    const ok = speakKorean(text, {
      onend: () => setPlaying(false),
      onerror: () => setPlaying(false),
    })
    if (!ok) setPlaying(false)
  }

  const play = () => {
    if (playing) {
      stop()
      return
    }
    setPlaying(true)
    if (preferWav) {
      const a = new Audio(`/audio/${encodeURIComponent(text)}.wav`)
      audioRef.current = a
      a.onended = () => setPlaying(false)
      a.onerror = () => {
        audioRef.current = null
        speak() // 파일이 없으면 TTS 로 폴백
      }
      a.play().catch(() => {
        audioRef.current = null
        speak()
      })
    } else {
      speak()
    }
  }

  return { playing, play }
}

function ListenButton({
  record,
  variant = 'icon',
}: {
  record: ErrorRecord
  variant?: 'icon' | 'inline'
}) {
  const { t } = useLang()
  const source = getSource(record)
  // 녹음 wav 가 있는 Catch the Sound 만 재생 버튼을 노출한다.
  // K-Stars/Shadowing 은 저장된 오디오가 없어 예전엔 TTS 로 읽어줬지만,
  // 이제 TTS 대신 '원래 퀴즈에서 틀린 문제 다시 풀기'로 유도한다(호출부에서 링크 제공).
  const canPlay = source === 'catch-the-sound'
  const { playing, play } = useKoreanAudio(listenText(record), source === 'catch-the-sound')

  if (!canPlay) return null

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={play}
        aria-label={t('review.listen')}
        className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 transition-colors hover:bg-indigo-100"
      >
        <span aria-hidden>{playing ? '⏸' : '🔊'}</span>
        {t('review.listen')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={play}
      aria-label={t('review.listen')}
      title={t('review.listen')}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors ${
        playing
          ? 'border-indigo-300 bg-indigo-100 text-indigo-600'
          : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-indigo-600'
      }`}
    >
      <span className="text-base" aria-hidden>
        {playing ? '⏸' : '🔊'}
      </span>
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 최소쌍 비교 칩 — 두 단어를 나란히 놓고 각각 눌러 소리를 들려준다.
// 정답이 공개되면(revealed) 정답 단어를 초록색으로 강조한다.
// ─────────────────────────────────────────────────────────────────────────────
function CompareChip({
  word,
  isAnswer,
  revealed,
  preferWav,
}: {
  word: string
  isAnswer: boolean
  revealed: boolean
  preferWav: boolean
}) {
  const { t } = useLang()
  const { playing, play } = useKoreanAudio(word, preferWav)
  const highlight = revealed && isAnswer

  const cls = playing
    ? 'border-indigo-300 bg-indigo-100 text-indigo-700'
    : highlight
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'

  return (
    <button
      type="button"
      onClick={play}
      aria-label={`${t('review.listen')}: ${word}`}
      className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-lg font-bold transition-colors ${cls}`}
    >
      <span className="text-base" aria-hidden>{playing ? '⏸' : '🔊'}</span>
      <span translate="no" className="notranslate">{word}</span>
      {highlight && <span aria-hidden className="text-sm text-emerald-500">✓</span>}
    </button>
  )
}

// 게임별 배지 — 게임명은 고유명사라 번역하지 않는다
const SOURCE_STYLE: Record<ErrorSource, { label: string; cls: string }> = {
  'catch-the-sound': { label: '🎧 Catch the Sound', cls: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  'k-stars':         { label: '⭐ Listen to K-Stars', cls: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' },
  'shadowing':       { label: '🎤 Shadowing', cls: 'bg-violet-50 text-violet-600 border-violet-200' },
}

const MODE_LABEL: Record<string, string> = { A: 'Dictation', B: 'Word Order', I: 'Meaning' }

function timeSince(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─────────────────────────────────────────────────────────────────────────────
// 긴 대본을 2줄만 보여주고 '더 보기'로 펼치는 텍스트. (K-Stars 중급 대본이 김)
// ─────────────────────────────────────────────────────────────────────────────
function ExpandableText({ text }: { text: string }) {
  const { t } = useLang()
  const [expanded, setExpanded] = useState(false)
  const [overflowing, setOverflowing] = useState(false)
  const ref = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = ref.current
    if (el) setOverflowing(el.scrollHeight > el.clientHeight + 1)
  }, [text])

  return (
    <div className="w-full">
      <p
        ref={ref}
        translate="no"
        className={`notranslate rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600 ${expanded ? '' : 'line-clamp-2'}`}
      >
        {text}
      </p>
      {(overflowing || expanded) && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-1 text-xs font-bold text-indigo-500 transition-colors hover:text-indigo-600"
        >
          {expanded ? t('review.showLess') : t('review.showMore')}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 간격 반복 복습 세션 — 카드를 한 장씩 보여주고 스스로 채점(다시/알맞음/쉬움)
// ─────────────────────────────────────────────────────────────────────────────
function ReviewSession({ cards, onDone }: { cards: ErrorRecord[]; onDone: () => void }) {
  const { t } = useLang()
  const navigate = useNavigate()
  const [idx, setIdx] = useState(0)

  const card = cards[idx]
  const source = card ? getSource(card) : 'catch-the-sound'
  const isShadowing = source === 'shadowing'
  const isKStars = source === 'k-stars'

  // 틀린 문제(K-Stars) 복습은 카드를 보여주지 않고 곧바로 원본 퀴즈의 '그 문항'으로 자동 진입한다.
  //   · 완료 처리(대기열 제거)는 퀴즈에서 '정답을 맞혔을 때만' 이뤄진다.
  useEffect(() => {
    if (card && isKStars && card.videoId) {
      navigate(`/kpop-quiz/${encodeURIComponent(card.videoId)}?review=1&q=${encodeURIComponent(`${card.quizMode || 'A'}::${card.word}`)}`)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx])

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

  // 채점 UI는 없앤다. '다음'을 누르면 내부적으로는 복습 완료('good')로 기록해
  // 간격 반복 스케줄만 갱신하고(같은 카드가 무한 반복되지 않게) 다음 카드로 넘어간다.
  const next = () => {
    gradeReview(card, 'good')
    if (idx + 1 >= cards.length) { setIdx(cards.length); return }
    setIdx(idx + 1)
  }
  const isLast = idx + 1 >= cards.length

  // 문맥 문장에서 정답 표현을 빈칸으로 가린 앞면
  const blanked = isKStars && card.context
    ? card.context.replace(card.word, '____')
    : null

  // K-Stars: 원본 퀴즈의 '그 문항'으로 이동하는 URL (videoId 가 있을 때만)
  const kstarsRetryUrl = isKStars && card.videoId
    ? `/kpop-quiz/${encodeURIComponent(card.videoId)}?review=1&q=${encodeURIComponent(`${card.quizMode || 'A'}::${card.word}`)}`
    : null

  // K-Stars 카드는 대본(정답 문장)을 보여주지 않고 곧바로 퀴즈로 자동 진입한다(위 effect).
  // 렌더는 짧은 이동 안내만 — 혹시 자동 이동이 막히면 수동 버튼/건너뛰기를 제공한다.
  if (isKStars) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm flex flex-col items-center gap-3">
        <div className="text-3xl">🎧</div>
        <p className="text-sm font-semibold text-slate-500">{t('review.openingQuiz')}</p>
        {kstarsRetryUrl ? (
          <button onClick={() => navigate(kstarsRetryUrl)} className="rounded-xl bg-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            🎧 {t('review.retryInQuiz')}
          </button>
        ) : (
          <button onClick={next} className="rounded-xl bg-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300">
            {isLast ? t('review.finish') : t('review.next')}
          </button>
        )}
      </div>
    )
  }

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
            {source === 'catch-the-sound' ? `🎧 ${t('game.catchTheSound')}` : SOURCE_STYLE[source].label}
          </span>
          {isKStars && card.quizMode && (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {MODE_LABEL[card.quizMode] ?? card.quizMode}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-slate-500">{prompt}</p>

        {/* Front — 정답은 노출하지 않는다(듣고 스스로 채점) */}
        <div className="mt-3 min-h-[90px] flex flex-col items-center justify-center gap-3 text-center">
          {/* K-Stars 대본은 길어서 2줄만 보이고 '더 보기'로 펼친다 */}
          {blanked && <ExpandableText text={blanked} />}

          {/* catch-the-sound: 최소쌍을 나란히 놓고 각 단어 소리를 비교(정답 강조 없음) */}
          {!isKStars && !isShadowing && card.pair.length > 0 && (
            <div className="flex w-full flex-col items-center gap-2">
              <p className="text-xs font-medium text-slate-400">{t('review.compareHint')}</p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {card.pair.map(w => (
                  <CompareChip
                    key={w}
                    word={w}
                    isAnswer={w === card.word}
                    revealed={false}
                    preferWav={source === 'catch-the-sound'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* (K-Stars 카드는 위에서 자동으로 퀴즈로 진입하므로 여기서 렌더링하지 않는다) */}

        {isShadowing && (
          <Link
            to={`/shadowing?s=${encodeURIComponent(card.word)}`}
            className="mt-2 block text-center text-xs font-bold text-violet-600 hover:text-violet-700"
          >
            🎤 {t('shadowing.practiceThis')}
          </Link>
        )}

        {/* Actions — 채점 없이 '다음'으로만 넘어간다 */}
        <div className="mt-5">
          <button
            onClick={next}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            {isLast ? t('review.finish') : t('review.next')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 전체 오답 기록 카드 (기존 오답노트 UI)
// ─────────────────────────────────────────────────────────────────────────────
function ErrorCard({
  record,
  selectMode = false,
  selected = false,
  onToggle,
  kstarsLabel,
}: {
  record: ErrorRecord
  selectMode?: boolean
  selected?: boolean
  onToggle?: () => void
  kstarsLabel?: string // K-Stars: 정답 문장 대신 '영상제목 · 문제 N'
}) {
  const { t } = useLang()
  const source = getSource(record)
  const sourceStyle = SOURCE_STYLE[source]
  const isKStars = source === 'k-stars'
  const lastMissTs = Math.max(...record.missTimestamps)
  const answerSizeCls = record.word.length > 14 ? 'text-lg leading-snug' : 'text-2xl'

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-colors ${
        selectMode ? 'cursor-pointer' : ''
      } ${selected ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-slate-200'}`}
      onClick={selectMode ? onToggle : undefined}
      role={selectMode ? 'checkbox' : undefined}
      aria-checked={selectMode ? selected : undefined}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {selectMode && (
          <span
            aria-hidden
            className={`mr-1 flex h-5 w-5 items-center justify-center rounded-md border text-xs font-black ${
              selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-white text-transparent'
            }`}
          >
            ✓
          </span>
        )}
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${sourceStyle.cls}`}>{source === 'catch-the-sound' ? `🎧 ${t('game.catchTheSound')}` : sourceStyle.label}</span>
        {isKStars && record.quizMode && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500">
            {MODE_LABEL[record.quizMode] ?? record.quizMode}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        {kstarsLabel ? (
          // K-Stars: 정답 문장을 숨기고 '영상제목 · 문제 N' 만 표시
          <span className="text-base font-black text-slate-900 break-words">{kstarsLabel}</span>
        ) : (
          <span translate="no" className={`notranslate font-black text-slate-900 break-words ${answerSizeCls}`}>{record.word}</span>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <ListenButton record={record} variant="icon" />
        </div>
      </div>
      {!kstarsLabel && isKStars && record.context && <ExpandableText text={record.context} />}
      {isKStars && record.videoId && (
        <Link
          to={`/kpop-quiz/${encodeURIComponent(record.videoId)}?review=1`}
          className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700"
        >
          🎧 {t('review.retryInQuiz')}
        </Link>
      )}
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>{t('errors.lastMissed')}: <span className="text-slate-500">{timeSince(lastMissTs)}</span></span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 같은 영상의 K-Stars 오답을 하나로 합친 카드 — '영상제목 + 문제 1,2,4' 형태
// ─────────────────────────────────────────────────────────────────────────────
function GroupedKStarsCard({
  title,
  records,
  numberOf,
  retryUrl,
  selectMode,
  selected,
  onToggle,
}: {
  title: string
  records: ErrorRecord[]
  numberOf: (r: ErrorRecord) => number | null
  retryUrl: string
  selectMode: boolean
  selected: boolean
  onToggle: () => void
}) {
  const { t } = useLang()
  const lastMissTs = Math.max(...records.flatMap(r => r.missTimestamps))
  const badge = SOURCE_STYLE['k-stars']

  // 모드별로 문제 번호를 모은다(번호 매김 실패한 것은 제외).
  const byMode = new Map<string, number[]>()
  for (const r of records) {
    const n = numberOf(r)
    if (n == null) continue
    const mode = r.quizMode || 'A'
    byMode.set(mode, [...(byMode.get(mode) ?? []), n])
  }
  const lines = (['B', 'I', 'A'] as const)
    .filter(m => byMode.has(m))
    .map(m => ({ mode: m as string, nums: [...new Set(byMode.get(m)!)].sort((a, b) => a - b) }))
  const resolved = lines.length > 0
  const multiMode = lines.length > 1

  return (
    <div
      className={`flex flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm transition-colors ${
        selectMode ? 'cursor-pointer' : ''
      } ${selected ? 'border-indigo-400 ring-2 ring-indigo-300' : 'border-slate-200'}`}
      onClick={selectMode ? onToggle : undefined}
      role={selectMode ? 'checkbox' : undefined}
      aria-checked={selectMode ? selected : undefined}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {selectMode && (
          <span
            aria-hidden
            className={`mr-1 flex h-5 w-5 items-center justify-center rounded-md border text-xs font-black ${
              selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-white text-transparent'
            }`}
          >
            ✓
          </span>
        )}
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badge.cls}`}>{badge.label}</span>
      </div>
      <span className="text-base font-black text-slate-900 break-words">{title}</span>
      {resolved ? (
        <div className="flex flex-col gap-0.5 text-sm">
          {lines.map(l => (
            <div key={l.mode} className="flex flex-wrap items-baseline gap-1.5">
              {multiMode && <span className="text-[11px] font-bold text-slate-400">{MODE_LABEL[l.mode] ?? l.mode}</span>}
              <span className="font-bold text-slate-700">{t('review.question')} {l.nums.join(', ')}</span>
            </div>
          ))}
        </div>
      ) : (
        <span className="text-sm text-slate-500">{t('review.wrongCount').replace('{n}', String(records.length))}</span>
      )}
      <Link
        to={retryUrl}
        onClick={e => { e.stopPropagation(); if (selectMode) e.preventDefault() }}
        className="text-xs font-bold text-fuchsia-600 hover:text-fuchsia-700"
      >
        🎧 {t('review.retryInQuiz')}
      </Link>
      <div className="text-xs text-slate-400">
        {t('errors.lastMissed')}: <span className="text-slate-500">{timeSince(lastMissTs)}</span>
      </div>
    </div>
  )
}

export default function ReviewPage() {
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const [records, setRecords] = useState<ErrorRecord[]>([])
  const [due, setDue] = useState<ErrorRecord[]>([])
  const [inSession, setInSession] = useState(false)
  const [sessionCards, setSessionCards] = useState<ErrorRecord[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // 영상별 전체 문항(배포본+하드코딩) — '문제 N' 번호 계산용
  const [videoQ, setVideoQ] = useState<Record<string, QuizItem[]>>({})

  const reload = () => {
    // 섀도잉 기록은 개인 복습에 남기지 않는다(전체 오답 기록 목록에서도 제외).
    setRecords(getErrors().filter(r => getSource(r) !== 'shadowing'))
    setDue(getDueReviews())
  }

  // 세션 시작: 지금 시점의 대기 카드를 고정한다(세션 도중 재정렬 방지).
  const startSession = () => {
    setSessionCards(getDueReviews())
    setInSession(true)
  }

  // 최초 진입 + 퀴즈에서 복귀(?resume=1) 처리.
  //   resume=1 이면 곧바로 다음 카드부터 세션을 이어 시작한다.
  useEffect(() => {
    reload()
    if (searchParams.get('resume') === '1') {
      // 방금 푼 카드(skip)는 이번 세션에서 제외해 바로 다시 뜨지 않게 한다.
      // (정답이면 이미 대기열에서 빠졌고, 오답이면 대기 상태로 남아 다음 방문 때 다시 나온다)
      const skip = searchParams.get('skip')
      const rest = getDueReviews().filter(r => !skip || reviewKey(r) !== skip)
      if (rest.length > 0) { setSessionCards(rest); setInSession(true) }
      setSearchParams({}, { replace: true }) // resume/skip 플래그 제거
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClear = () => {
    if (confirm(t('errors.confirmClear'))) { clearErrors(); reload() }
  }

  const exitSelect = () => { setSelectMode(false); setSelected(new Set()) }

  const toggleSelect = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleDeleteSelected = () => {
    if (selected.size === 0) return
    const toDelete = records.filter(r => selected.has(reviewKey(r)))
    removeErrors(toDelete)
    exitSelect()
    reload()
  }

  // 그룹(영상) 카드 선택: 그 영상의 모든 오답 레코드를 한 번에 토글한다.
  const toggleKeys = (keys: string[]) => {
    setSelected(prev => {
      const next = new Set(prev)
      const allSel = keys.every(k => next.has(k))
      keys.forEach(k => (allSel ? next.delete(k) : next.add(k)))
      return next
    })
  }

  // K-Stars 오답이 있는 영상들의 전체 문항을 불러온다(번호 매김용).
  useEffect(() => {
    const vids = [...new Set(
      records.filter(r => getSource(r) === 'k-stars' && r.videoId).map(r => r.videoId as string),
    )]
    const missing = vids.filter(v => !(v in videoQ))
    if (missing.length === 0) return
    let cancelled = false
    Promise.all(
      missing.map(v => loadPublishedQuizzes(v).catch(() => null).then(pub => [v, mergeQuizzes(v, pub)] as const)),
    ).then(entries => {
      if (cancelled) return
      setVideoQ(prev => {
        const next = { ...prev }
        for (const [v, qs] of entries) next[v] = qs
        return next
      })
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records])

  // 오답 레코드 → 그 영상·같은 모드 안에서의 '문제 번호'(startTime 순, 1-base). 미매칭/미로딩은 null.
  const numberOf = (r: ErrorRecord): number | null => {
    const qs = videoQ[r.videoId || '']
    if (!qs) return null
    const mode = r.quizMode || 'A'
    const sameMode = qs.filter(q => itemMode(q) === mode).slice().sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
    const idx = sameMode.findIndex(q => qCorrectText(q) === r.word)
    return idx >= 0 ? idx + 1 : null
  }

  const endSession = () => { setInSession(false); reload() }

  // 영상별 최근 오답 시각(그룹 정렬 기준). 같은 영상 카드는 한데 모아 보여준다.
  const videoRecency: Record<string, number> = {}
  for (const r of records) {
    if (getSource(r) !== 'k-stars') continue
    const vid = r.videoId || ''
    videoRecency[vid] = Math.max(videoRecency[vid] ?? 0, Math.max(...r.missTimestamps))
  }
  const groupRecency = (r: ErrorRecord) =>
    getSource(r) === 'k-stars' ? (videoRecency[r.videoId || ''] ?? 0) : Math.max(...r.missTimestamps)

  // 정렬: 그룹(영상)은 최근 오답 순, 같은 영상 안에서는 '영상 내 문장 순서(startTime)'로 → 1,2,3,4.
  const sortedRecords = [...records].sort((a, b) => {
    const g = groupRecency(b) - groupRecency(a)
    if (g !== 0) return g
    const sameVideoKStars =
      getSource(a) === 'k-stars' && getSource(b) === 'k-stars' && (a.videoId || '') === (b.videoId || '')
    if (sameVideoKStars) return startTimeOfRecord(a) - startTimeOfRecord(b)
    return Math.max(...b.missTimestamps) - Math.max(...a.missTimestamps)
  })

  // 표시 그룹: 같은 영상의 K-Stars 오답은 하나의 카드로 합친다. 그 외(Catch the Sound)는 개별.
  //   sortedRecords 가 이미 같은 영상끼리 붙여 정렬하므로, 최초 등장 순서로 그룹을 만든다.
  type DisplayGroup =
    | { kind: 'kstars'; videoId: string; title: string; records: ErrorRecord[]; keys: string[] }
    | { kind: 'single'; record: ErrorRecord }
  const groups: DisplayGroup[] = []
  const seenVideo = new Set<string>()
  for (const r of sortedRecords) {
    if (getSource(r) === 'k-stars' && r.videoId) {
      if (seenVideo.has(r.videoId)) continue
      seenVideo.add(r.videoId)
      const recs = sortedRecords.filter(x => getSource(x) === 'k-stars' && x.videoId === r.videoId)
      const lv = LIVE_VIDEOS.find(v => v.videoId === r.videoId)
      groups.push({
        kind: 'kstars',
        videoId: r.videoId,
        title: lv ? pickText(lv.title, lang) : 'K-Stars',
        records: recs,
        keys: recs.map(reviewKey),
      })
    } else {
      groups.push({ kind: 'single', record: r })
    }
  }

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
              onClick={startSession}
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
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('review.allRecords')}</h2>
              {selectMode ? (
                <div className="flex items-center gap-3">
                  <button onClick={exitSelect} className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-600">
                    {t('errors.cancelSelect')}
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selected.size === 0}
                    className={`text-xs font-bold transition-colors ${
                      selected.size === 0 ? 'text-slate-300' : 'text-red-500 hover:text-red-600'
                    }`}
                  >
                    {t('errors.deleteSelected').replace('{n}', String(selected.size))}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectMode(true)} className="text-xs font-bold text-slate-400 transition-colors hover:text-indigo-500">
                    {t('errors.select')}
                  </button>
                  <button onClick={handleClear} className="text-xs text-slate-400 transition-colors hover:text-red-500">
                    {t('errors.clear')}
                  </button>
                </div>
              )}
            </div>
            {groups.map(g => {
              if (g.kind === 'single') {
                const key = reviewKey(g.record)
                return (
                  <ErrorCard
                    key={key}
                    record={g.record}
                    selectMode={selectMode}
                    selected={selected.has(key)}
                    onToggle={() => toggleSelect(key)}
                  />
                )
              }
              const allSel = g.keys.length > 0 && g.keys.every(k => selected.has(k))
              return (
                <GroupedKStarsCard
                  key={`v:${g.videoId}`}
                  title={g.title}
                  records={g.records}
                  numberOf={numberOf}
                  retryUrl={`/kpop-quiz/${encodeURIComponent(g.videoId)}?review=1`}
                  selectMode={selectMode}
                  selected={allSel}
                  onToggle={() => toggleKeys(g.keys)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
