import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import {
  INTERMEDIATE_SENTENCES,
  ADVANCED_SENTENCES,
  pickRandom,
  generateBlank,
  GeneratedQuestion,
} from '@/data/sentences'
import {
  submitDictationScore,
  getDictationLeaderboard,
  RankedDictationEntry,
} from '@/lib/leaderboard'
import GuestPromptModal from '@/components/GuestPromptModal'
import InstallSuccessModal from '@/components/InstallSuccessModal'
import { usePwaInstall } from '@/lib/pwaInstall'
import { isInstallModalHidden } from '@/lib/installPrompts'

const QUESTIONS_PER_SESSION = 10
const BASE_POINTS = 500
const TIME_DECAY_PER_SEC = 30
const REPLAY_PENALTY = 100

// Strip whitespace + punctuation before comparing
function normalize(s: string) {
  return s.replace(/\s/g, '').replace(/[.,!?。]/g, '').trim()
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

function AudioBars() {
  return (
    <div className="flex gap-1 items-end h-5">
      {[8, 16, 10, 16, 8].map((h, i) => (
        <div key={i} className="w-1 rounded-full animate-bounce bg-white"
          style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }} />
      ))}
    </div>
  )
}

function ClozeDisplay({ text }: { text: string }) {
  const parts = text.split(/(\[_+\])/)
  return (
    <p className="text-gray-100 text-lg leading-loose font-medium">
      {parts.map((part, i) =>
        /^\[_+\]$/.test(part) ? (
          <span key={i}
            className="inline-block mx-1 px-3 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 font-mono tracking-widest text-base align-middle">
            ______
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

const RANK_BADGE: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' }

function DictationLeaderboard({
  entries,
  playerName,
  myScore,
}: {
  entries: RankedDictationEntry[]
  playerName: string
  myScore: number
}) {
  const { t } = useLang()
  const top = entries.slice(0, 10)
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
        {top.length === 0 && (
          <div className="px-5 py-6 text-center text-gray-600 text-sm">{t('game.noRecords')}</div>
        )}
        {top.map(entry => {
          const isMe = entry.name === playerName && entry.score === myScore
          return (
            <div key={entry.id ?? `${entry.name}-${entry.score}`}
              className={`flex items-center px-5 py-3.5 gap-3 ${isMe ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}>
              <span className="text-lg w-5 text-center">{RANK_BADGE[entry.rank] ?? '⭐'}</span>
              <span className="text-gray-500 text-xs w-10">{entry.rank}위</span>
              <span className="flex-1 text-white font-semibold text-sm truncate">{entry.name}</span>
              <span className="text-xs text-gray-600">{entry.correctCount}/10</span>
              <span className="font-bold text-yellow-400 text-sm tabular-nums">{entry.score.toLocaleString()}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Review audio play button (result screen) ──────────────────────────────────

function ReviewPlayButton({ audioUrl }: { audioUrl: string }) {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlay = () => {
    if (playing) return
    if (audioRef.current) audioRef.current.pause()
    const a = new Audio(audioUrl)
    audioRef.current = a
    setPlaying(true)
    const done = () => setPlaying(false)
    a.onended = done
    a.onerror = done
    a.play().catch(done)
  }

  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause()
  }, [])

  return (
    <button
      onClick={handlePlay}
      disabled={playing}
      aria-label="다시 듣기"
      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all
        ${playing
          ? 'bg-blue-500/20 text-blue-400 cursor-default'
          : 'bg-gray-800 text-gray-500 hover:text-gray-200 hover:bg-gray-700'
        }`}
    >
      {playing
        ? <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        : <svg className="w-3.5 h-3.5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
      }
    </button>
  )
}

// ── Level select screen ────────────────────────────────────────────────────────

function LevelSelectScreen({
  mode,
  onSelect,
}: {
  mode: 'intermediate' | 'advanced'
  onSelect: (level: 1 | 2) => void
}) {
  const { t } = useLang()
  const isAdv = mode === 'advanced'
  const accentFrom = isAdv ? 'from-indigo-500' : 'from-blue-500'
  const accentTo   = isAdv ? 'to-purple-500'  : 'to-cyan-500'
  const badge      = isAdv
    ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  const label = isAdv ? '🎙️ ADVANCED' : '🗣️ INTERMEDIATE'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center flex flex-col items-center gap-3">
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badge}`}>
            {label}
          </span>
          <h2 className="text-2xl font-black">{t('dictation.selectLevel')}</h2>
        </div>

        <button
          onClick={() => onSelect(1)}
          className="group relative w-full rounded-2xl bg-gray-900 border border-gray-700 hover:border-gray-500 p-6 text-left transition-all hover:bg-gray-800"
        >
          <div className={`absolute top-4 right-4 text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${accentFrom} ${accentTo} text-white`}>
            EASY
          </div>
          <p className="text-2xl font-black mb-1">{t('dictation.level1Label')}</p>
          <p className="text-gray-300 text-sm font-semibold mb-1">{t('dictation.level1Desc')}</p>
          <p className="text-gray-600 text-xs">{t('dictation.level1Detail')}</p>
        </button>

        <button
          onClick={() => onSelect(2)}
          className="group relative w-full rounded-2xl bg-gray-900 border border-gray-700 hover:border-gray-500 p-6 text-left transition-all hover:bg-gray-800"
        >
          <div className="absolute top-4 right-4 text-xs font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-rose-500 text-white">
            HARD
          </div>
          <p className="text-2xl font-black mb-1">{t('dictation.level2Label')}</p>
          <p className="text-gray-300 text-sm font-semibold mb-1">{t('dictation.level2Desc')}</p>
          <p className="text-gray-600 text-xs">{t('dictation.level2Detail')}</p>
        </button>

        <Link to="/"
          className="text-center text-gray-600 text-sm hover:text-gray-400 transition-colors py-2">
          ← {t('dictation.backHome')}
        </Link>
      </div>
    </div>
  )
}

// ── Game screen ────────────────────────────────────────────────────────────────

type WrongEntry = {
  displayText: string
  userAnswer: string
  correctAnswer: string
  audioUrl: string
  fullSentence: string
}

function GameScreen({
  mode,
  gameLevel,
  questions,
  onComplete,
}: {
  mode: 'intermediate' | 'advanced'
  gameLevel: 1 | 2
  questions: GeneratedQuestion[]
  onComplete: (score: number, correct: number, wrongs: WrongEntry[]) => void
}) {
  const { t } = useLang()
  const total = questions.length
  const isAdv = mode === 'advanced'

  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const [audioPlaying, setAudioPlaying] = useState(false)

  const isPlaying = audioPlaying

  const ceilingRef    = useRef(BASE_POINTS)
  const tickRef       = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerStartRef = useRef<number | null>(null)

  const [idx,          setIdx]          = useState(0)
  const [userInput,    setUserInput]    = useState('')
  const [feedback,     setFeedback]     = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [totalScore,   setTotalScore]   = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongEntries, setWrongEntries] = useState<WrongEntry[]>([])
  const [hasPlayed,    setHasPlayed]    = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [potentialPts, setPotentialPts] = useState(BASE_POINTS)

  const inputRef = useRef<HTMLInputElement>(null)
  const current  = questions[idx]

  const stopTimer = useCallback(() => {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    const start = Date.now()
    timerStartRef.current = start
    setTimerStarted(true)
    tickRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      const raw = Math.max(0, BASE_POINTS - Math.floor(elapsed) * TIME_DECAY_PER_SEC)
      const pts = Math.min(ceilingRef.current, raw)
      setPotentialPts(pts)
      if (raw <= 0) stopTimer()
    }, 200)
  }, [stopTimer])

  const resetQuestion = useCallback(() => {
    setUserInput('')
    setFeedback('idle')
    setHasPlayed(false)
    setTimerStarted(false)
    setPotentialPts(BASE_POINTS)
    ceilingRef.current = BASE_POINTS
    stopTimer()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null }
  }, [stopTimer])

  const playAudio = useCallback((url: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null }
    stopTimer()
    setAudioPlaying(true)
    setTimerStarted(false)
    const audio = new Audio(url)
    audioRef.current = audio
    const onDone = () => {
      setAudioPlaying(false)
      setHasPlayed(true)
      startTimer()
    }
    audio.onended = onDone
    audio.onerror = onDone
    audio.play().catch(onDone)
  }, [startTimer, stopTimer])

  useEffect(() => {
    resetQuestion()
    const delay = setTimeout(() => {
      playAudio(current.sentence.audioUrl)
    }, 400)
    return () => {
      clearTimeout(delay)
      if (audioRef.current) audioRef.current.pause()
      stopTimer()
    }
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (audioRef.current) audioRef.current.pause()
    stopTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplay = useCallback(() => {
    if (isPlaying || feedback !== 'idle') return
    ceilingRef.current = Math.max(0, ceilingRef.current - REPLAY_PENALTY)
    setPotentialPts(prev => Math.min(ceilingRef.current, prev))
    stopTimer()
    setTimerStarted(false)
    playAudio(current.sentence.audioUrl)
  }, [isPlaying, feedback, current, playAudio, stopTimer])

  const handleSubmit = useCallback(() => {
    if (feedback !== 'idle' || !userInput.trim()) return
    stopTimer()
    const userNorm   = normalize(userInput)
    const answerNorm = normalize(current.answer)
    const isCorrect  = userNorm === answerNorm
    if (isCorrect) {
      const elapsed = timerStartRef.current ? (Date.now() - timerStartRef.current) / 1000 : 0
      const raw = Math.max(0, BASE_POINTS - Math.floor(elapsed) * TIME_DECAY_PER_SEC)
      const pts = Math.min(ceilingRef.current, raw)
      setTotalScore(prev => prev + pts)
      setCorrectCount(c => c + 1)
      setFeedback('correct')
    } else {
      setWrongEntries(prev => [...prev, {
        displayText:   current.displayText,
        userAnswer:    userInput.trim(),
        correctAnswer: current.answer,
        audioUrl:      current.sentence.audioUrl,
        fullSentence:  current.sentence.fullSentence,
      }])
      setFeedback('wrong')
    }
  }, [feedback, userInput, current, stopTimer])

  useEffect(() => {
    if (feedback === 'idle') return
    const delay = feedback === 'correct' ? 1200 : 2000
    const timer = setTimeout(() => {
      if (idx + 1 >= total) {
        onComplete(totalScore, correctCount, wrongEntries)
      } else {
        setIdx(i => i + 1)
        inputRef.current?.focus()
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [feedback]) // eslint-disable-line react-hooks/exhaustive-deps

  const ptsColor    = potentialPts > 300 ? 'text-green-400' : potentialPts > 150 ? 'text-yellow-400' : 'text-red-400'
  const progress    = (idx / total) * 100
  const accentGrad  = isAdv ? 'from-indigo-500 to-purple-500' : 'from-blue-500 to-cyan-500'
  const accentFocus = isAdv ? 'focus:border-indigo-500' : 'focus:border-blue-500'
  const levelTag    = isAdv ? '🎙️ ADVANCED' : '🗣️ INTERMEDIATE'
  const tagClass    = isAdv
    ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${tagClass}`}>
              {levelTag}
            </span>
            <span className="text-gray-600 text-xs">
              L{gameLevel} · {idx + 1} / {total}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700/60 text-sm font-bold flex items-center gap-1">
              <span className="text-yellow-400">⚡</span>
              {totalScore.toLocaleString()}
            </div>
            <Link to="/" className="text-gray-500 hover:text-white text-sm transition-colors">✕</Link>
          </div>
        </div>
        <div className="h-1 bg-gray-800">
          <div className={`h-1 bg-gradient-to-r ${accentGrad} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">

        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-500 text-xs tracking-wide">듣고 빈칸에 들어갈 단어를 입력하세요</p>

          <div className="flex items-center justify-center gap-6 w-full" style={{ height: '6.5rem' }}>
            <div className="w-24" />
            <button
              onClick={handleReplay}
              disabled={isPlaying || feedback !== 'idle' || !hasPlayed}
              className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200
                ${isPlaying
                  ? `bg-gradient-to-br ${accentGrad} shadow-xl scale-105`
                  : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
            >
              {isPlaying ? (
                <>
                  <AudioBars />
                  <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" />
                </>
              ) : hasPlayed ? (
                <>
                  <svg className="w-6 h-6 text-gray-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  <span className="text-gray-400 text-[10px] leading-tight text-center">{t('dictation.listenAgain')}</span>
                  <span className="text-red-400 text-[9px]">-{REPLAY_PENALTY}pt</span>
                </>
              ) : (
                <svg className="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            <div className="w-24 flex flex-col justify-center">
              {timerStarted && feedback === 'idle' && (
                <>
                  <span className="text-xs text-gray-500">{t('game.correctNow')}</span>
                  <span className={`text-2xl font-black tabular-nums ${ptsColor}`}>+{potentialPts}{t('game.pts')}</span>
                  {ceilingRef.current < BASE_POINTS && (
                    <span className="text-red-400 text-[10px] mt-0.5">max {ceilingRef.current}pt</span>
                  )}
                </>
              )}
            </div>
          </div>

          {isPlaying && <p className="text-xs text-gray-500 animate-pulse">{t('dictation.autoPlaying')}</p>}
        </div>

        <div className="rounded-2xl bg-gray-900/70 border border-gray-700/60 px-5 py-5">
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-3 ${isAdv ? 'text-indigo-400/70' : 'text-blue-400/70'}`}>
            빈칸 채우기
          </p>
          <ClozeDisplay text={current.displayText} />
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
            disabled={feedback !== 'idle'}
            placeholder="단어 입력…"
            autoComplete="off"
            className={`w-full px-5 py-4 rounded-2xl border-2 bg-gray-900/80 text-white text-xl font-bold
              text-center tracking-wider placeholder:text-gray-700 placeholder:font-normal placeholder:text-base
              placeholder:tracking-normal outline-none transition-all duration-200 disabled:opacity-60
              ${feedback === 'correct'
                ? 'border-green-500 bg-green-500/5'
                : feedback === 'wrong'
                ? 'border-red-500/60 bg-red-500/5'
                : `border-gray-700/80 ${accentFocus} focus:shadow-lg`
              }`}
          />
          <button
            onClick={handleSubmit}
            disabled={feedback !== 'idle' || !userInput.trim()}
            className={`w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity
              disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${accentGrad}`}
          >
            {t('dictation.submit')}
          </button>
        </div>

        <div className="min-h-[4rem] flex flex-col items-center justify-center gap-1">
          {feedback === 'correct' && (
            <p className="text-green-400 font-bold text-lg animate-pulse">{t('dictation.correct')}</p>
          )}
          {feedback === 'wrong' && (
            <>
              <p className="text-red-400 font-bold text-lg">{t('dictation.incorrect')}</p>
              <p className="text-sm text-center">
                <span className="text-gray-500">{t('dictation.correctAnswer')} </span>
                <span className="text-green-400 font-bold">{current.answer}</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Result screen ──────────────────────────────────────────────────────────────

function ResultScreen({
  mode,
  gameLevel,
  totalScore,
  correctCount,
  total,
  wrongEntries,
  leaderboard,
  playerName,
  isGuest,
  onRestart,
  onUpgrade,
}: {
  mode: 'intermediate' | 'advanced'
  gameLevel: 1 | 2
  totalScore: number
  correctCount: number
  total: number
  wrongEntries: WrongEntry[]
  leaderboard: RankedDictationEntry[]
  playerName: string
  isGuest: boolean
  onRestart: () => void
  onUpgrade?: () => void   // Level 1 → Level 2 upgrade (undefined when already at Level 2)
}) {
  const { t } = useLang()
  const { isInstalled } = usePwaInstall()
  const [showGuestModal, setShowGuestModal] = useState(isGuest)
  const [showInstallModal, setShowInstallModal] = useState(() => !isGuest && !isInstalled && !isInstallModalHidden())
  const myEntry = leaderboard.find(e => e.name === playerName && e.score === totalScore)
  const isAdv = mode === 'advanced'

  const handleGuestModalClose = () => {
    setShowGuestModal(false)
    if (!isInstalled && !isInstallModalHidden()) setShowInstallModal(true)
  }

  return (
    <>
      {showGuestModal && (
        <GuestPromptModal score={totalScore} level={gameLevel} onClose={handleGuestModalClose} />
      )}
      {!showGuestModal && showInstallModal && (
        <InstallSuccessModal onClose={() => setShowInstallModal(false)} />
      )}
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">

          {/* Hero */}
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-7xl">{correctCount >= 7 ? '🏆' : correctCount >= 4 ? '💪' : '📚'}</div>
            <h2 className="text-3xl font-black">{t('dictation.result')}</h2>
            <p className="text-sm text-gray-500">
              {isAdv ? '🎙️ ADVANCED' : '🗣️ INTERMEDIATE'} · Level {gameLevel}
            </p>

            <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">{t('dictation.correct10')}</p>
                <p className="text-3xl font-black text-yellow-400">
                  {correctCount}<span className="text-lg text-gray-500 ml-1">/ {total}</span>
                </p>
              </div>
              <div className="w-px h-12 bg-gray-700" />
              <div className="text-center">
                <p className="text-gray-500 text-xs mb-1">{t('dictation.totalScore')}</p>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  {totalScore.toLocaleString()}
                </p>
              </div>
              {myEntry && !isGuest && (
                <>
                  <div className="w-px h-12 bg-gray-700" />
                  <div className="text-center">
                    <p className="text-gray-500 text-xs mb-1">{t('dictation.rank')}</p>
                    <p className="text-3xl font-black text-indigo-300">{myEntry.rank}위</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Leaderboard (logged-in only) */}
          {!isGuest && (
            <DictationLeaderboard entries={leaderboard} playerName={playerName} myScore={totalScore} />
          )}

          {/* Guest login prompt */}
          {isGuest && (
            <button
              onClick={() => setShowGuestModal(true)}
              className="w-full py-3.5 rounded-2xl border border-indigo-500/50 bg-indigo-500/10 text-indigo-300 text-sm font-bold hover:bg-indigo-500/20 transition-colors"
            >
              {t('guest.loginBtn')} →
            </button>
          )}

          {/* Wrong answer review with audio replay */}
          {wrongEntries.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="font-bold text-sm">📝 오답 확인 ({wrongEntries.length})</h3>
                <p className="text-gray-600 text-xs mt-0.5">▶ 버튼으로 해당 문장을 다시 들을 수 있어요</p>
              </div>
              <div className="divide-y divide-gray-800/50 max-h-80 overflow-y-auto">
                {wrongEntries.map((e, i) => (
                  <div key={i} className="px-4 py-4 flex gap-3 items-start">
                    {/* Audio replay button */}
                    <ReviewPlayButton audioUrl={e.audioUrl} />
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-400 text-xs mb-1.5 leading-relaxed">{e.displayText}</p>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-red-400 text-xs">✗ {e.userAnswer || '(미입력)'}</span>
                        <span className="text-green-400 font-bold text-xs">✓ {e.correctAnswer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Level 1 → Level 2 upgrade card */}
          {gameLevel === 1 && onUpgrade && (
            <button
              onClick={onUpgrade}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 p-5 text-left hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-orange-200 mb-1 uppercase tracking-wide">Next Challenge</p>
                  <p className="text-xl font-black text-white">Level 2 도전하기 →</p>
                  <p className="text-sm text-orange-100/80 mt-0.5">2개 어절 연속 빈칸으로 난이도 UP!</p>
                </div>
                <div className="text-4xl">🔥</div>
              </div>
            </button>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black text-base hover:opacity-90 transition-opacity"
            >
              {t('dictation.playAgain')}
            </button>
            <Link to="/"
              className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700/60 text-gray-300 font-medium hover:bg-gray-700 transition-colors text-sm flex items-center">
              {t('dictation.backHome')}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export default function DictationPage() {
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'advanced' ? 'advanced' : 'intermediate'
  const { user, isGuest } = useAuth()
  const playerName = user?.displayName || user?.email?.split('@')[0] || 'Guest'

  const [screen,       setScreen]       = useState<'level-select' | 'game' | 'result'>('level-select')
  const [gameLevel,    setGameLevel]    = useState<1 | 2>(1)
  const [questions,    setQuestions]    = useState<GeneratedQuestion[]>([])
  const [finalScore,   setFinalScore]   = useState(0)
  const [finalCorrect, setFinalCorrect] = useState(0)
  const [wrongEntries, setWrongEntries] = useState<WrongEntry[]>([])
  const [leaderboard,  setLeaderboard]  = useState<RankedDictationEntry[]>([])

  // Start (or restart) a game at the given level
  const startGame = (level: 1 | 2) => {
    const pool = mode === 'advanced' ? ADVANCED_SENTENCES : INTERMEDIATE_SENTENCES
    const picked = pickRandom(pool, QUESTIONS_PER_SESSION)
    setQuestions(picked.map(s => generateBlank(s, level)))
    setGameLevel(level)
    setFinalScore(0)
    setFinalCorrect(0)
    setWrongEntries([])
    setLeaderboard([])
    setScreen('game')
  }

  const handleGameComplete = async (score: number, correct: number, wrongs: WrongEntry[]) => {
    setFinalScore(score)
    setFinalCorrect(correct)
    setWrongEntries(wrongs)

    const collectionName = (mode === 'advanced' ? 'adv' : 'int') + 'L' + gameLevel

    if (!isGuest && user) {
      await submitDictationScore(collectionName, {
        name: playerName,
        score,
        correctCount: correct,
        timestamp: Date.now(),
      })
      const lb = await getDictationLeaderboard(collectionName)
      setLeaderboard(lb)
    }

    setScreen('result')
  }

  if (screen === 'level-select') {
    return <LevelSelectScreen mode={mode} onSelect={startGame} />
  }

  if (screen === 'game' && questions.length > 0) {
    return (
      <GameScreen
        mode={mode}
        gameLevel={gameLevel}
        questions={questions}
        onComplete={handleGameComplete}
      />
    )
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        mode={mode}
        gameLevel={gameLevel}
        totalScore={finalScore}
        correctCount={finalCorrect}
        total={QUESTIONS_PER_SESSION}
        wrongEntries={wrongEntries}
        leaderboard={leaderboard}
        playerName={playerName}
        isGuest={isGuest}
        onRestart={() => setScreen('level-select')}
        onUpgrade={gameLevel === 1 ? () => startGame(2) : undefined}
      />
    )
  }

  return null
}
