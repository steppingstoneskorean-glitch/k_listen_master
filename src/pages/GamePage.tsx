import { useState, useEffect, useRef, useCallback } from 'react'
import { submitScore, getLeaderboard, RankedEntry } from '@/lib/leaderboard'
import { useAuth } from '@/lib/auth'
import { useLang } from '@/lib/i18n'
import { recordError, recordCorrect } from '@/lib/errorHistory'
import GuestPromptModal from '@/components/GuestPromptModal'

// ── Types ───────────────────────────────────────────────────────────────────

interface WrongAnswerData {
  pair: string[]
  correct: string
  userAnswer: string
}

// ── Game Data ───────────────────────────────────────────────────────────────

const GAME_LEVELS: Record<number, { name: string; pairs: string[][] }> = {
  1: {
    name: '레벨 1',
    pairs: [
      ['아이', '오이'], ['구두', '구도'], ['나무', '너무'], ['물고기', '불고기'],
      ['커피', '코피'], ['모래', '머리'], ['별', '벌'], ['노래', '모래'],
      ['배', '비'], ['밤', '뱀'], ['말', '발'], ['소금', '조금'], ['운전', '안전'],
      ['볼', '발'], ['파', '피'], ['소', '새'], ['고기', '거기'],
      ['여유', '우유'], ['무리', '머리'], ['부모', '보모'], ['하늘', '마늘'],
    ],
  },
  2: {
    name: '레벨 2',
    pairs: [
      ['산', '상', '삼'], ['곰', '공'], ['방', '반'],
      ['감', '강'], ['별', '병'], ['병', '명'], ['돈', '돌'], ['밤', '밥'],
      ['문', '물'], ['짐', '집'], ['글', '금'],
      ['잔', '장'], ['귤', '균'], ['솜', '솥'], ['사람', '사랑'],
    ],
  },
  3: {
    name: '레벨 3',
    pairs: [
      ['도끼', '토끼'], ['딸', '탈', '달'], ['불', '뿔', '풀'], ['장', '창'],
      ['방', '빵'], ['굴', '꿀'], ['고리', '꼬리'], ['그림', '크림'],
      ['종', '총'], ['공', '콩'], ['부리', '뿌리'], ['가다', '까다'],
      ['살', '쌀'], ['짐', '찜'], ['대', '때'], ['소다', '쏘다'], ['마음', '마을'],
    ],
  },
  4: {
    name: '레벨 4 (최종 보스전)',
    pairs: [
      ['얼음', '어른'], ['단어', '다녀'], ['사다', '싸다'],
      ['책상', '색상'], ['담', '땀'],
      ['팔', '발'], ['굴', '글'], ['자다', '짜다', '차다'],
      ['거울', '겨울'], ['시력', '실력'], ['고장', '공장'],
    ],
  },
}

const MAX_LIVES = 3
const BASE_POINTS = 500
const TIME_DECAY_PER_SEC = 30
const REPLAY_PENALTY = 100

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Level Clear Screen ──────────────────────────────────────────────────────

function LevelClearScreen({
  level,
  score,
  wrongAnswers,
  onReview,
  onNext,
}: {
  level: number
  score: number
  wrongAnswers: WrongAnswerData[]
  onReview: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const audio = new Audio('/audio/fanfare.wav')
    audio.play().catch(() => {})
    return () => { audio.pause() }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-7xl animate-bounce">🎉</div>
      <div className="text-center">
        <h2 className="text-4xl font-black">레벨 {level} 클리어!</h2>
        <p className="text-gray-400 mt-2">다음 행동을 선택하세요</p>
      </div>
      <div className="px-8 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-center">
        <p className="text-gray-500 text-sm">현재 점수</p>
        <p className="text-3xl font-black text-yellow-400">{score.toLocaleString()}점</p>
      </div>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {wrongAnswers.length > 0 && (
          <button
            onClick={onReview}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-base hover:opacity-90 transition-opacity"
          >
            📝 틀린 문제 복습하기 ({wrongAnswers.length}개)
          </button>
        )}
        <button
          onClick={onNext}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-base hover:opacity-90 transition-opacity"
        >
          {level < 4 ? `레벨 ${level + 1} 진행하기 →` : '최종 결과 보기 →'}
        </button>
      </div>
    </div>
  )
}

// ── Review Mode Screen ──────────────────────────────────────────────────────

function ReviewModeScreen({
  wrongAnswers,
  onComplete,
}: {
  wrongAnswers: WrongAnswerData[]
  onComplete: () => void
}) {
  const [idx, setIdx] = useState(0)
  const [heardWords, setHeardWords] = useState<Set<string>>(new Set())
  const [playingWord, setPlayingWord] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const current = wrongAnswers[idx]
  const isLast = idx === wrongAnswers.length - 1

  const playWord = useCallback((word: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null }
    setPlayingWord(word)
    const audio = new Audio(`/audio/${encodeURIComponent(word)}.wav`)
    audioRef.current = audio
    audio.onended = () => {
      setPlayingWord(null)
      setHeardWords(prev => new Set([...prev, word]))
    }
    audio.onerror = () => setPlayingWord(null)
    audio.play().catch(() => setPlayingWord(null))
  }, [])

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [idx])

  const handleNext = () => {
    if (isLast) {
      onComplete()
    } else {
      setIdx(i => i + 1)
      setHeardWords(new Set())
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">복습 모드</p>
        <h2 className="text-2xl font-black">발음 비교 연습</h2>
        <p className="text-gray-600 text-sm mt-1">{idx + 1} / {wrongAnswers.length}</p>
      </div>

      <div className="mb-5 text-center text-sm">
        <span className="text-red-400 font-bold">{current.userAnswer}</span>
        <span className="text-gray-600 mx-2">→ 정답:</span>
        <span className="text-green-400 font-bold">{current.correct}</span>
      </div>

      <p className="text-gray-600 text-xs mb-4">각 단어를 탭해서 발음을 들어보세요</p>

      <div
        className={`grid gap-4 w-full max-w-xs mb-8 ${
          current.pair.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'
        }`}
      >
        {current.pair.map(word => {
          const heard = heardWords.has(word)
          const playing = playingWord === word
          const isCorrect = word === current.correct
          const wasWrong = word === current.userAnswer
          return (
            <button
              key={word}
              onClick={() => !playingWord && playWord(word)}
              disabled={!!playingWord && !playing}
              className={`relative py-8 rounded-2xl border-2 text-center transition-all duration-200 active:scale-95
                ${playing
                  ? 'border-indigo-500 bg-indigo-500/20 scale-105'
                  : heard
                  ? 'border-gray-600 bg-gray-800/50'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
            >
              <div className="text-4xl font-black text-white">{word}</div>
              {isCorrect && <div className="mt-1 text-xs text-green-400 font-bold">✓ 정답</div>}
              {wasWrong && !isCorrect && <div className="mt-1 text-xs text-red-400 font-bold">× 오답</div>}
              {playing ? (
                <div className="absolute top-2 right-2 flex gap-0.5 items-end h-3">
                  {[4, 6, 4].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-indigo-400 animate-bounce"
                      style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : heard ? (
                <div className="absolute top-2 right-2 text-gray-500 text-xs">🔊</div>
              ) : (
                <div className="mt-1 text-xs text-gray-600">탭</div>
              )}
            </button>
          )
        })}
      </div>

      <button
        onClick={handleNext}
        className="w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-base hover:opacity-90 transition-opacity"
      >
        {isLast ? '✅ 복습 완료 → 다음 레벨 진행하기' : '다음 →'}
      </button>
    </div>
  )
}

// ── Game Play Screen ────────────────────────────────────────────────────────

const LEVEL_COLORS: Record<number, string> = {
  1: 'from-green-500 to-emerald-500',
  2: 'from-blue-500 to-cyan-500',
  3: 'from-orange-500 to-amber-500',
  4: 'from-red-500 to-rose-500',
}

function GamePlayScreen({
  level,
  lives,
  totalScore,
  onCorrect,
  onWrong,
  onScorePenalty,
}: {
  level: number
  lives: number
  totalScore: number
  onCorrect: (pts: number) => void
  onWrong: (data: WrongAnswerData) => void
  onScorePenalty: (pts: number) => void
}) {
  const levelData = GAME_LEVELS[level]
  const [pairs, setPairs] = useState<string[][]>([])
  const [pairIdx, setPairIdx] = useState(0)
  const [chosenWord, setChosenWord] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [replayCount, setReplayCount] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [timerStart, setTimerStart] = useState<number | null>(null)
  const [potentialPts, setPotentialPts] = useState(BASE_POINTS)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const advancingRef = useRef(false)

  useEffect(() => {
    const shuffled = shuffle(levelData.pairs)
    setPairs(shuffled)
    setPairIdx(0)
    advancingRef.current = false
  }, [level, levelData.pairs])

  const playAudio = useCallback((word: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.onended = null }
    setIsPlaying(true)
    setTimerStart(null)
    if (tickRef.current) clearInterval(tickRef.current)

    const audio = new Audio(`/audio/${encodeURIComponent(word)}.wav`)
    audioRef.current = audio
    audio.onended = () => {
      setIsPlaying(false)
      setHasPlayed(true)
      const start = Date.now()
      setTimerStart(start)
      setPotentialPts(BASE_POINTS)
      tickRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000)
        const pts = Math.max(0, BASE_POINTS - elapsed * TIME_DECAY_PER_SEC)
        setPotentialPts(pts)
        if (pts <= 0 && tickRef.current) clearInterval(tickRef.current)
      }, 200)
    }
    audio.onerror = () => setIsPlaying(false)
    audio.play().catch(() => setIsPlaying(false))
  }, [])

  useEffect(() => {
    if (pairs.length === 0 || pairIdx >= pairs.length) return
    advancingRef.current = false
    const pair = pairs[pairIdx]
    const word = pair[Math.floor(Math.random() * pair.length)]
    setChosenWord(word)
    setFeedback('idle')
    setReplayCount(0)
    setHasPlayed(false)
    setPotentialPts(BASE_POINTS)
    playAudio(word)
  }, [pairs, pairIdx, playAudio])

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [])

  const advance = useCallback(() => {
    if (advancingRef.current) return
    advancingRef.current = true
    if (tickRef.current) clearInterval(tickRef.current)
    setPairIdx(prev => prev + 1)
  }, [])

  const handleWordClick = useCallback(
    (word: string) => {
      if (feedback !== 'idle' || isPlaying) return
      if (tickRef.current) clearInterval(tickRef.current)
      if (word === chosenWord) {
        const elapsed = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0
        const pts = Math.max(0, BASE_POINTS - elapsed * TIME_DECAY_PER_SEC)
        setFeedback('correct')
        onCorrect(pts)
        setTimeout(advance, 700)
      } else {
        setFeedback('wrong')
        const currentPair = pairs[pairIdx] ?? []
        onWrong({ pair: currentPair, correct: chosenWord, userAnswer: word })
        setTimeout(advance, 900)
      }
    },
    [feedback, isPlaying, chosenWord, timerStart, onCorrect, onWrong, advance, pairs, pairIdx],
  )

  const handlePlayButtonClick = useCallback(() => {
    if (feedback !== 'idle' || isPlaying) return
    if (hasPlayed) {
      setReplayCount(prev => prev + 1)
      onScorePenalty(REPLAY_PENALTY)
    }
    playAudio(chosenWord)
  }, [feedback, isPlaying, hasPlayed, chosenWord, playAudio, onScorePenalty])

  if (pairs.length === 0) return null

  const currentPair = pairIdx < pairs.length ? pairs[pairIdx] : []
  const progress = (pairIdx / pairs.length) * 100
  const gradient = LEVEL_COLORS[level]

  const ptsColor =
    potentialPts > 300 ? 'text-green-400' : potentialPts > 150 ? 'text-yellow-400' : 'text-red-400'

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500 font-semibold">{levelData.name}</span>
            <span className="text-gray-700">·</span>
            <span className="text-xs text-gray-600">{pairIdx + 1}/{pairs.length}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span key={i} className={`text-lg transition-all duration-300 ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>
                  ❤️
                </span>
              ))}
            </div>
            <div className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700/60 text-sm font-bold flex items-center gap-1">
              <span className="text-yellow-400">⚡</span>
              {totalScore.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="h-1 bg-gray-800">
          <div className={`h-1 bg-gradient-to-r ${gradient} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 max-w-lg mx-auto w-full gap-5">
        <p className="text-gray-500 text-sm">들리는 단어를 선택하세요</p>

        {/* Fixed-height row: [left pad] [play button] [score indicator] — prevents CLS */}
        <div className="flex items-center justify-center gap-5 w-full" style={{ height: '7rem' }}>
          {/* Left pad — mirrors score width for centering */}
          <div className="w-28" />

          {/* Integrated Play / 다시듣기 button */}
          <button
            onClick={handlePlayButtonClick}
            disabled={isPlaying || feedback !== 'idle'}
            className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-0.5 transition-all duration-200 disabled:cursor-not-allowed shrink-0
              ${isPlaying
                ? 'bg-indigo-500 shadow-xl shadow-indigo-500/40 scale-105'
                : hasPlayed
                ? 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-600'
                : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700'
              }`}
          >
            {isPlaying ? (
              <>
                <div className="flex gap-1 items-end h-7">
                  {[10, 20, 14, 20, 10].map((h, i) => (
                    <div key={i} className="w-1.5 rounded-full animate-bounce bg-white"
                      style={{ height: `${h}px`, animationDelay: `${i * 100}ms` }} />
                  ))}
                </div>
                <div className="absolute inset-0 rounded-full bg-indigo-400/20 animate-ping" />
              </>
            ) : hasPlayed ? (
              <>
                <svg className="w-6 h-6 text-gray-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span className="text-gray-400 text-[11px] leading-tight text-center">다시<br/>듣기</span>
                <span className="text-red-400 text-[9px]">-{REPLAY_PENALTY}pt</span>
              </>
            ) : (
              <svg className="w-9 h-9 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Score indicator — fixed width, right of button */}
          <div className="w-28 flex flex-col justify-center">
            {timerStart !== null && feedback === 'idle' ? (
              <>
                <span className="text-xs text-gray-500">지금 맞추면</span>
                <span className={`text-2xl font-black tabular-nums ${ptsColor}`}>
                  +{potentialPts}점
                </span>
                {replayCount > 0 && (
                  <span className="text-red-400 text-[10px] mt-0.5">
                    재생 -{replayCount * REPLAY_PENALTY}pts
                  </span>
                )}
              </>
            ) : null}
          </div>
        </div>

        {/* Word Buttons — always same vertical position */}
        <div className={`grid gap-4 w-full ${currentPair.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {currentPair.map(word => {
            let cls = 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800'
            if (feedback !== 'idle') {
              if (word === chosenWord)
                cls = 'border-green-500 bg-green-500/15 shadow-lg shadow-green-500/20'
              else
                cls = 'border-red-500/40 bg-red-500/5'
            }
            return (
              <button
                key={word}
                onClick={() => handleWordClick(word)}
                disabled={feedback !== 'idle' || isPlaying}
                className={`relative py-8 rounded-2xl border-2 text-center transition-all duration-200 active:scale-95 disabled:cursor-default ${cls}
                  ${feedback === 'idle' && !isPlaying ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="text-4xl font-black text-white">{word}</span>
                {feedback !== 'idle' && word === chosenWord && (
                  <span className="absolute bottom-2 left-0 right-0 text-center text-xs text-green-400 font-bold">
                    정답 ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Fixed-height feedback — prevents word buttons from shifting */}
        <div className="h-8 flex items-center justify-center">
          {feedback === 'correct' && (
            <p className="text-green-400 font-bold text-lg animate-pulse">정확해요! 🎯</p>
          )}
          {feedback === 'wrong' && (
            <p className="text-red-400 font-bold text-lg animate-pulse">틀렸어요 💔</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Result Screen ───────────────────────────────────────────────────────────

function TiedGroup({ entries }: { entries: RankedEntry[] }) {
  const [expanded, setExpanded] = useState(false)
  if (entries.length === 0) return null
  const first = entries[0]
  if (entries.length === 1) {
    return <span className="text-white font-semibold truncate max-w-[120px]">{first.name}</span>
  }
  return (
    <span className="inline-flex items-center gap-1.5 flex-wrap">
      <span className="text-white font-semibold truncate max-w-[100px]">{first.name}</span>
      <button onClick={() => setExpanded(e => !e)} className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2">
        그 외 {entries.length - 1}명
      </button>
      {expanded && (
        <span className="w-full text-xs text-gray-400 pl-2">
          {entries.slice(1).map(e => e.name).join(', ')}
        </span>
      )}
    </span>
  )
}

const RANK_BADGE: Record<number, string> = { 1: '👑', 2: '🥈', 3: '🥉' }

function ResultScreen({
  playerName,
  totalScore,
  highestLevel,
  result,
  leaderboard,
  myEntry,
  isGuest,
  onRestart,
}: {
  playerName: string
  totalScore: number
  highestLevel: number
  result: 'win' | 'lose'
  leaderboard: RankedEntry[]
  myEntry: RankedEntry | undefined
  isGuest: boolean
  onRestart: () => void
}) {
  const { t } = useLang()
  const [showGuestModal, setShowGuestModal] = useState(isGuest)

  const rankGroups = leaderboard.reduce<Record<number, RankedEntry[]>>((acc, e) => {
    ;(acc[e.rank] = acc[e.rank] || []).push(e)
    return acc
  }, {})
  const uniqueRanks = Object.keys(rankGroups).map(Number).sort((a, b) => a - b).slice(0, 10)
  const myRank = myEntry?.rank
  const isTied = myRank !== undefined && (rankGroups[myRank]?.length ?? 0) > 1

  return (
    <>
      {showGuestModal && (
        <GuestPromptModal
          score={totalScore}
          level={highestLevel}
          onClose={() => setShowGuestModal(false)}
        />
      )}

      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-7xl">{result === 'win' ? '🏆' : '💔'}</div>
            <div>
              <h2 className="text-3xl font-black">{result === 'win' ? '레벨 4 클리어!' : '게임 오버'}</h2>
              <p className="text-gray-500 text-sm mt-1">
                {result === 'win' ? '모든 레벨을 통과했습니다!' : `레벨 ${highestLevel}에서 탈락했습니다`}
              </p>
            </div>
            <div className="px-8 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-center min-w-[200px]">
              <p className="text-gray-500 text-xs">{playerName}</p>
              <p className="text-3xl font-black text-yellow-400">{totalScore.toLocaleString()}점</p>
              {myRank && !isGuest && (
                <p className="text-sm font-bold text-indigo-300 mt-0.5">
                  {isTied ? `공동 ${myRank}등` : `${myRank}등`}
                </p>
              )}
            </div>
          </div>

          {!isGuest && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-sm">{t('game.leaderboard')}</h3>
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                  {t('game.live')}
                </span>
              </div>
              <div className="divide-y divide-gray-800/50">
                {uniqueRanks.map(rank => {
                  const group = rankGroups[rank]
                  const isMe = group.some(e => e.name === playerName && e.score === totalScore)
                  const isTiedGroup = group.length > 1
                  return (
                    <div key={rank} className={`flex items-start px-5 py-3.5 gap-3 ${isMe ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}>
                      <span className="text-lg w-5 text-center mt-0.5">{RANK_BADGE[rank] ?? '⭐'}</span>
                      <span className="text-gray-500 text-xs w-16 mt-1">{isTiedGroup ? `공동 ${rank}등` : `${rank}등`}</span>
                      <div className="flex-1 min-w-0"><TiedGroup entries={group} /></div>
                      <span className="font-bold text-yellow-400 text-sm tabular-nums mt-1">{group[0].score.toLocaleString()}</span>
                    </div>
                  )
                })}
                {leaderboard.length === 0 && (
                  <div className="px-5 py-6 text-center text-gray-600 text-sm">아직 기록이 없습니다</div>
                )}
              </div>
            </div>
          )}

          {isGuest && (
            <button
              onClick={() => setShowGuestModal(true)}
              className="w-full py-3.5 rounded-2xl border border-indigo-500/50 bg-indigo-500/10 text-indigo-300 text-sm font-bold hover:bg-indigo-500/20 transition-colors"
            >
              {t('guest.loginBtn')} →
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={onRestart}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white font-black text-base hover:opacity-90 transition-opacity"
            >
              {t('game.restart')}
            </button>
            <a
              href="/home"
              className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700/60 text-gray-300 font-medium hover:bg-gray-700 transition-colors text-sm flex items-center"
            >
              {t('game.home')}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main GamePage ───────────────────────────────────────────────────────────

type Screen = 'playing' | 'level-clear' | 'review' | 'result'

export default function GamePage() {
  const { user, isGuest } = useAuth()
  const playerName = user?.displayName || user?.email?.split('@')[0] || 'Guest'

  const [screen, setScreen] = useState<Screen>('playing')
  const [level, setLevel] = useState<1 | 2 | 3 | 4>(1)
  const [lives, setLives] = useState(MAX_LIVES)
  const [totalScore, setTotalScore] = useState(0)
  const [gameResult, setGameResult] = useState<'win' | 'lose'>('win')
  const [leaderboard, setLeaderboard] = useState<RankedEntry[]>([])
  const [myEntry, setMyEntry] = useState<RankedEntry | undefined>()
  const [levelWrongAnswers, setLevelWrongAnswers] = useState<WrongAnswerData[]>([])

  const handleCorrect = useCallback((pts: number) => {
    setTotalScore(prev => prev + pts)
  }, [])

  const handleWrong = useCallback((data: WrongAnswerData) => {
    setLives(prev => prev - 1)
    setLevelWrongAnswers(prev => [...prev, data])
    recordError(data.correct, data.userAnswer, data.pair, level)
  }, [level])

  const handleScorePenalty = useCallback((pts: number) => {
    setTotalScore(prev => Math.max(0, prev - pts))
  }, [])

  useEffect(() => {
    if (screen === 'playing' && lives <= 0) {
      endGame('lose')
    }
  }, [lives, screen]) // eslint-disable-line react-hooks/exhaustive-deps

  const endGame = useCallback(
    async (result: 'win' | 'lose') => {
      setGameResult(result)
      const highestLevel = level
      if (!isGuest && user) {
        const entry = { name: playerName, score: totalScore, highestLevel, result, timestamp: Date.now() }
        await submitScore(entry)
        const lb = await getLeaderboard()
        setLeaderboard(lb)
        const me = lb.find(e => e.name === playerName && e.score === totalScore)
        setMyEntry(me)
      }
      setScreen('result')
    },
    [level, playerName, totalScore, isGuest, user],
  )

  const handlePairsExhausted = useCallback(() => {
    if (level === 4) {
      endGame('win')
    } else {
      setScreen('level-clear')
    }
  }, [level, endGame])

  const handleNextLevel = useCallback(() => {
    setLevel(prev => (prev < 4 ? ((prev + 1) as 1 | 2 | 3 | 4) : prev))
    setLevelWrongAnswers([])
    setScreen('playing')
  }, [])

  const restartGame = useCallback(() => {
    setLevel(1)
    setLives(MAX_LIVES)
    setTotalScore(0)
    setGameResult('win')
    setLevelWrongAnswers([])
    setLeaderboard([])
    setMyEntry(undefined)
    setScreen('playing')
  }, [])

  return (
    <>
      {screen === 'playing' && (
        <GamePlayWithExhaust
          level={level}
          lives={lives}
          totalScore={totalScore}
          onCorrect={handleCorrect}
          onWrong={handleWrong}
          onScorePenalty={handleScorePenalty}
          onPairsExhausted={handlePairsExhausted}
        />
      )}
      {screen === 'level-clear' && (
        <LevelClearScreen
          level={level}
          score={totalScore}
          wrongAnswers={levelWrongAnswers}
          onReview={() => setScreen('review')}
          onNext={handleNextLevel}
        />
      )}
      {screen === 'review' && (
        <ReviewModeScreen
          wrongAnswers={levelWrongAnswers}
          onComplete={() => {
            levelWrongAnswers.forEach(w => recordCorrect(w.correct))
            handleNextLevel()
          }}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          playerName={playerName}
          totalScore={totalScore}
          highestLevel={level}
          result={gameResult}
          leaderboard={leaderboard}
          myEntry={myEntry}
          isGuest={isGuest}
          onRestart={restartGame}
        />
      )}
    </>
  )
}

// ── GamePlayWithExhaust ─────────────────────────────────────────────────────

function GamePlayWithExhaust({
  level,
  lives,
  totalScore,
  onCorrect,
  onWrong,
  onScorePenalty,
  onPairsExhausted,
}: {
  level: number
  lives: number
  totalScore: number
  onCorrect: (pts: number) => void
  onWrong: (data: WrongAnswerData) => void
  onScorePenalty: (pts: number) => void
  onPairsExhausted: () => void
}) {
  const levelData = GAME_LEVELS[level]
  const totalPairs = levelData.pairs.length
  const [pairsKey, setPairsKey] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const exhaustedRef = useRef(false)

  useEffect(() => {
    exhaustedRef.current = false
    setCompletedCount(0)
    setPairsKey(k => k + 1)
  }, [level])

  const handleCorrect = useCallback(
    (pts: number) => {
      onCorrect(pts)
      setCompletedCount(prev => {
        const next = prev + 1
        if (next >= totalPairs && !exhaustedRef.current) {
          exhaustedRef.current = true
          setTimeout(onPairsExhausted, 800)
        }
        return next
      })
    },
    [onCorrect, totalPairs, onPairsExhausted],
  )

  const handleWrong = useCallback(
    (data: WrongAnswerData) => {
      onWrong(data)
      setCompletedCount(prev => {
        const next = prev + 1
        if (next >= totalPairs && !exhaustedRef.current && lives > 1) {
          exhaustedRef.current = true
          setTimeout(onPairsExhausted, 800)
        }
        return next
      })
    },
    [onWrong, totalPairs, onPairsExhausted, lives],
  )

  return (
    <GamePlayScreen
      key={pairsKey}
      level={level}
      lives={lives}
      totalScore={totalScore}
      onCorrect={handleCorrect}
      onWrong={handleWrong}
      onScorePenalty={onScorePenalty}
    />
  )
}
