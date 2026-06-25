import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Screen = 'dashboard' | 'game' | 'result'
type GameMode = 'beginner' | 'intermediate' | 'advanced'
type FeedbackState = 'idle' | 'correct' | 'wrong'

interface BeginnerOption {
  word: string
  meaning: string
  correct: boolean
}

interface BeginnerQuestion {
  id: number
  spoken: string
  options: BeginnerOption[]
  phoneTip: string
}

interface DictationQuestion {
  id: number
  context: string
  hint: string
  answer: string
}

interface WrongAnswer {
  mode: GameMode
  prompt: string
  userAnswer: string
  correct: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PAYHIP_URL = import.meta.env.VITE_PAYHIP_URL ?? 'https://payhip.com/StepKorean'
const MAX_LIVES = 3
const BASE_POINTS = 100
const STREAK_BONUS = 50

const CLASS_LINEUP = [
  {
    label: 'SPEAKING',
    emoji: '🗣️',
    style: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
  },
  {
    label: 'GRAMMAR',
    emoji: '📘',
    style: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300',
  },
  {
    label: 'PRONUNCIATION',
    emoji: '🎯',
    style: 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border-purple-500/30 text-purple-300',
  },
  {
    label: 'TOPIK',
    emoji: '📝',
    style: 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500/30 text-orange-300',
  },
]

// ── Mock Data ──────────────────────────────────────────────────────────────────

const BEGINNER_QUESTIONS: BeginnerQuestion[] = [
  {
    id: 1,
    spoken: '불',
    options: [
      { word: '불', meaning: 'Fire 🔥', correct: true },
      { word: '뿔', meaning: 'Horn 🦄', correct: false },
    ],
    phoneTip:
      '불[bul] vs 뿔[ppul] — ㅂ는 유성음, ㅃ는 경음(된소리)으로 성대 긴장도가 다릅니다.',
  },
  {
    id: 2,
    spoken: '쌀',
    options: [
      { word: '살', meaning: 'Skin 🦵', correct: false },
      { word: '쌀', meaning: 'Rice 🌾', correct: true },
    ],
    phoneTip:
      '살[sal] vs 쌀[ssal] — ㅅ(평음)과 ㅆ(경음)의 기식량 차이를 느껴보세요.',
  },
  {
    id: 3,
    spoken: '달',
    options: [
      { word: '달', meaning: 'Moon 🌙', correct: true },
      { word: '탈', meaning: 'Mask 🎭', correct: false },
    ],
    phoneTip:
      '달[dal] vs 탈[tal] — ㄷ(무기음)과 ㅌ(유기음)의 차이. ㅌ 발음 시 입 앞에 손을 대면 바람이 느껴져요!',
  },
  {
    id: 4,
    spoken: '구름',
    options: [
      { word: '구름', meaning: 'Cloud ☁️', correct: true },
      { word: '그림', meaning: 'Picture 🖼️', correct: false },
    ],
    phoneTip:
      '구름[gureum] vs 그림[geurim] — 모음 ㅜ와 ㅡ의 입 모양 차이가 핵심입니다.',
  },
  {
    id: 5,
    spoken: '밥',
    options: [
      { word: '밤', meaning: 'Night 🌃', correct: false },
      { word: '밥', meaning: 'Cooked Rice 🍚', correct: true },
    ],
    phoneTip:
      '밤[bam] vs 밥[bap] — 받침 ㅁ(nasal)과 ㅂ(stop)은 입술 여는 방식이 완전히 달라요.',
  },
]

const INTERMEDIATE_QUESTIONS: DictationQuestion[] = [
  {
    id: 1,
    context: '🍽️ Restaurant',
    hint: '이거 __ __ __ __ 주세요.',
    answer: '이거 하나 더 가져다 주세요.',
  },
  {
    id: 2,
    context: '🛒 Supermarket',
    hint: '이 상품 __ __ __ 있나요?',
    answer: '이 상품 할인 행사 하고 있나요?',
  },
  {
    id: 3,
    context: '🚇 Subway',
    hint: '__ 역에서 __ 으로 갈아타야 해요.',
    answer: '강남역에서 2호선으로 갈아타야 해요.',
  },
  {
    id: 4,
    context: '☎️ Phone Call',
    hint: '지금 __ __ 괜찮으세요?',
    answer: '지금 통화 잠깐 괜찮으세요?',
  },
  {
    id: 5,
    context: '🏥 Clinic',
    hint: '__ 부터 __ __ 이 좀 아파요.',
    answer: '어제부터 목하고 머리가 좀 아파요.',
  },
]

const ADVANCED_QUESTIONS: DictationQuestion[] = [
  {
    id: 1,
    context: '📺 News Briefing',
    hint: '정부는 __ 물가 안정 __ 을 발표했습니다.',
    answer: '정부는 내년도 물가 안정 대책을 발표했습니다.',
  },
  {
    id: 2,
    context: '💼 Business Meeting',
    hint: '이번 분기 __ 는 전년 대비 __ 퍼센트 __ 했습니다.',
    answer: '이번 분기 매출은 전년 대비 십오 퍼센트 증가했습니다.',
  },
  {
    id: 3,
    context: '🎤 Variety Show Interview',
    hint: '저는 이번 작품이 __ 면에서 이전과 __ 것 같아요.',
    answer: '저는 이번 작품이 감정 표현 면에서 이전과 달랐던 것 같아요.',
  },
  {
    id: 4,
    context: '📺 News Briefing',
    hint: '해당 법안은 __ 상임위원회에서 __ 통과되었습니다.',
    answer: '해당 법안은 국회 상임위원회에서 만장일치로 통과되었습니다.',
  },
  {
    id: 5,
    context: '💼 Business Presentation',
    hint: '소비자 __ 이 __ 중심으로 변화하고 있습니다.',
    answer: '소비자 구매 패턴이 온라인 중심으로 변화하고 있습니다.',
  },
]

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'SakuraKorea', country: '🇯🇵', score: 2840, badge: '👑' },
  { rank: 2, name: 'KimchiLover99', country: '🇺🇸', score: 2650, badge: '🥈' },
  { rank: 3, name: 'HangeulPro', country: '🇬🇧', score: 2490, badge: '🥉' },
  { rank: 4, name: 'SeoulDreamer', country: '🇧🇷', score: 2340, badge: '⭐' },
  { rank: 5, name: 'KoreanPro77', country: '🇨🇳', score: 2210, badge: '⭐' },
]

// ── Mode config (colors per theme) ─────────────────────────────────────────────

const MODE_CONFIG: Record<GameMode, { progressGradient: string; accentColor: string; label: string }> = {
  beginner: {
    progressGradient: 'from-purple-500 to-green-500',
    accentColor: 'text-green-400',
    label: '🎯 Pronunciation Drill',
  },
  intermediate: {
    progressGradient: 'from-blue-500 to-cyan-500',
    accentColor: 'text-blue-400',
    label: '🗣️ Real-Life Dictation',
  },
  advanced: {
    progressGradient: 'from-indigo-500 to-purple-500',
    accentColor: 'text-indigo-400',
    label: '🎙️ Professional Accent',
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Hearts({ lives }: { lives: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <span
          key={i}
          className={`text-xl transition-all duration-300 ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}
        >
          ❤️
        </span>
      ))}
    </div>
  )
}

function AudioBars({ color = 'white' }: { color?: string }) {
  return (
    <div className="flex gap-1 items-end h-6">
      {[10, 18, 10].map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full animate-bounce"
          style={{ height: `${h}px`, backgroundColor: color, animationDelay: `${i * 140}ms` }}
        />
      ))}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function ClassLineupCards() {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {CLASS_LINEUP.map(cls => (
        <a
          key={cls.label}
          href={PAYHIP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${cls.style} hover:opacity-80 transition-opacity`}
        >
          <span className="text-base">{cls.emoji}</span>
          <span className="text-xs font-black tracking-wide">{cls.label}</span>
        </a>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AudioGame() {
  const [screen, setScreen] = useState<Screen>('dashboard')
  const [mode, setMode] = useState<GameMode>('beginner')
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState<FeedbackState>('idle')
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([])
  const [gameResult, setGameResult] = useState<'success' | 'fail'>('success')
  const [isPlaying, setIsPlaying] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [streak, setStreak] = useState(0)
  const [showPremiumBanner, setShowPremiumBanner] = useState(false)

  const totalQuestions =
    mode === 'beginner'
      ? BEGINNER_QUESTIONS.length
      : mode === 'intermediate'
      ? INTERMEDIATE_QUESTIONS.length
      : ADVANCED_QUESTIONS.length

  // ── Speech Synthesis ────────────────────────────────────────────────────────

  const playKorean = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return
      const speak = () => {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = 'ko-KR'
        utt.rate = mode === 'advanced' ? 1.0 : 0.75
        utt.pitch = 1.0
        setIsPlaying(true)
        utt.onend = () => setIsPlaying(false)
        utt.onerror = () => setIsPlaying(false)
        window.speechSynthesis.speak(utt)
      }
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak
      } else {
        speak()
      }
    },
    [mode],
  )

  // ── State Machine ───────────────────────────────────────────────────────────

  const startGame = useCallback((selectedMode: GameMode) => {
    setMode(selectedMode)
    setScore(0)
    setLives(MAX_LIVES)
    setQuestionIndex(0)
    setFeedback('idle')
    setWrongAnswers([])
    setUserInput('')
    setStreak(0)
    setShowPremiumBanner(false)
    setGameResult('success')
    setScreen('game')
  }, [])

  useEffect(() => {
    if (feedback === 'idle') return
    const isLastQuestion = questionIndex + 1 >= totalQuestions
    const gameEnds = lives === 0 || isLastQuestion
    const delay = feedback === 'correct' ? 1200 : 1800
    const timer = setTimeout(() => {
      if (gameEnds) {
        setGameResult(lives === 0 ? 'fail' : 'success')
        setScreen('result')
      } else {
        setQuestionIndex(prev => prev + 1)
        setFeedback('idle')
        setUserInput('')
        setShowPremiumBanner(false)
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [feedback, lives, questionIndex, totalQuestions])

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    }
  }, [screen])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleBeginnerAnswer = useCallback(
    (option: BeginnerOption) => {
      if (feedback !== 'idle') return
      if (option.correct) {
        setScore(prev => prev + BASE_POINTS + (streak >= 2 ? STREAK_BONUS : 0))
        setStreak(prev => prev + 1)
        setFeedback('correct')
      } else {
        setLives(prev => prev - 1)
        setStreak(0)
        setFeedback('wrong')
        setShowPremiumBanner(true)
        const q = BEGINNER_QUESTIONS[questionIndex]
        setWrongAnswers(prev => [
          ...prev,
          {
            mode: 'beginner',
            prompt: `"${q.spoken}" pronunciation`,
            userAnswer: option.word,
            correct: q.options.find(o => o.correct)?.word ?? '',
          },
        ])
      }
    },
    [feedback, streak, questionIndex],
  )

  const handleDictationSubmit = useCallback(() => {
    if (feedback !== 'idle' || !userInput.trim()) return
    const qs = mode === 'intermediate' ? INTERMEDIATE_QUESTIONS : ADVANCED_QUESTIONS
    const q = qs[questionIndex]
    const normalize = (s: string) => s.trim().replace(/\s+/g, ' ')
    const isCorrect = normalize(userInput) === normalize(q.answer)

    if (isCorrect) {
      setScore(prev => prev + BASE_POINTS + (streak >= 2 ? STREAK_BONUS : 0))
      setStreak(prev => prev + 1)
      setFeedback('correct')
    } else {
      setLives(prev => prev - 1)
      setStreak(0)
      setFeedback('wrong')
      setShowPremiumBanner(true)
      setWrongAnswers(prev => [
        ...prev,
        {
          mode,
          prompt: q.context,
          userAnswer: userInput,
          correct: q.answer,
        },
      ])
    }
  }, [feedback, userInput, questionIndex, streak, mode])

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400">
              Step
            </span>
            <span className="text-white"> Korean</span>
          </h1>
          <p className="mt-2 text-gray-500 text-sm tracking-wide">
            Choose your training mode
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">

          {/* Card 1 — Beginner */}
          <button
            onClick={() => startGame('beginner')}
            className="group relative p-7 rounded-2xl bg-gray-900 border border-gray-800 hover:border-green-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-500/10 text-left cursor-pointer"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="text-4xl mb-4">🎯</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30 mb-3">
                BEGINNER
              </span>
              <h2 className="text-base font-black text-white mb-2">Ear-Opening Room</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Train your ear to catch subtle differences —{' '}
                <span className="text-green-400 font-semibold">불 vs 뿔</span>, 살 vs 쌀 and more.
                Card-tap format.
              </p>
              <div className="mt-4 text-xs text-gray-700">5 rounds · Card tap</div>
            </div>
          </button>

          {/* Card 2 — Intermediate */}
          <button
            onClick={() => startGame('intermediate')}
            className="group relative p-7 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 text-left cursor-pointer"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="text-4xl mb-4">🗣️</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-3">
                INTERMEDIATE
              </span>
              <h2 className="text-base font-black text-white mb-2">Real-Life Dictation</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Survive real Korean — restaurants, subways, phone calls. Type what you hear in{' '}
                <span className="text-blue-400 font-semibold">everyday situations</span>.
              </p>
              <div className="mt-4 text-xs text-gray-700">5 rounds · Typing</div>
            </div>
          </button>

          {/* Card 3 — Advanced */}
          <button
            onClick={() => startGame('advanced')}
            className="group relative p-7 rounded-2xl bg-gray-900 border border-gray-800 hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 text-left cursor-pointer"
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <div className="text-4xl mb-4">🎙️</div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-3">
                ADVANCED
              </span>
              <h2 className="text-base font-black text-white mb-2">Media & Professional Accent</h2>
              <p className="text-xs text-gray-400 leading-relaxed">
                Master connected speech from{' '}
                <span className="text-indigo-400 font-semibold">news briefings, business meetings</span>{' '}
                and variety show interviews.
              </p>
              <div className="mt-4 text-xs text-gray-700">5 rounds · Typing</div>
            </div>
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-12 flex gap-12 text-center">
          {[
            { label: 'Global Learners', value: '128K+' },
            { label: "Today's Top", value: '2,840' },
            { label: 'Countries', value: '12' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {stat.value}
              </div>
              <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN: GAME
  // ─────────────────────────────────────────────────────────────────────────────

  if (screen === 'game') {
    const beginnerQ = mode === 'beginner' ? BEGINNER_QUESTIONS[questionIndex] : null
    const dictationQ =
      mode === 'intermediate'
        ? INTERMEDIATE_QUESTIONS[questionIndex]
        : mode === 'advanced'
        ? ADVANCED_QUESTIONS[questionIndex]
        : null
    const playText = beginnerQ ? beginnerQ.spoken : dictationQ?.answer ?? ''
    const progress = (questionIndex / totalQuestions) * 100
    const modeConfig = MODE_CONFIG[mode]
    const isIntermediate = mode === 'intermediate'

    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col">

        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur-sm border-b border-gray-800/60">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel()
                setScreen('dashboard')
              }}
              className="text-gray-500 hover:text-white transition-colors text-sm font-medium"
            >
              ← Menu
            </button>
            <div className="flex items-center gap-3">
              <Hearts lives={lives} />
              <div className="px-3 py-1.5 rounded-full bg-gray-800 text-sm font-bold flex items-center gap-1.5 border border-gray-700/60">
                <span className="text-yellow-400">⚡</span>
                <span>{score.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="h-0.5 bg-gray-800">
            <div
              className={`h-0.5 bg-gradient-to-r ${modeConfig.progressGradient} transition-all duration-700`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Streak Badge */}
        {streak >= 2 && feedback === 'idle' && (
          <div className="max-w-lg mx-auto px-4 pt-4 w-full">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold">
              🔥 {streak} in a row! Next correct +{STREAK_BONUS} pts
            </span>
          </div>
        )}

        {/* Question Counter */}
        <div className="max-w-lg mx-auto px-4 pt-5 pb-1 w-full">
          <p className="text-gray-600 text-xs">
            {modeConfig.label} ·{' '}
            <span className="text-gray-400 font-bold">{questionIndex + 1}</span>/{totalQuestions}
          </p>
        </div>

        {/* Game Content */}
        <div className="flex-1 max-w-lg mx-auto px-4 pb-10 w-full">

          {/* ════ BEGINNER MODE ════ */}
          {mode === 'beginner' && beginnerQ && (
            <div className="flex flex-col gap-5">
              {/* Audio Player */}
              <div className="flex flex-col items-center gap-3 pt-5 pb-2">
                <p className="text-gray-600 text-xs">Listen and select the word you hear</p>
                <button
                  onClick={() => playKorean(playText)}
                  disabled={feedback !== 'idle'}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                    ${isPlaying
                      ? 'bg-purple-500 shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-gray-800 hover:bg-gray-700 hover:-translate-y-0.5 border border-gray-700 text-white'
                    }`}
                >
                  {isPlaying ? (
                    <>
                      <AudioBars color="white" />
                      <div className="absolute inset-0 rounded-full bg-purple-400/20 animate-ping" />
                    </>
                  ) : (
                    <PlayIcon />
                  )}
                </button>
                <span className="text-gray-600 text-xs">
                  {isPlaying ? '🔊 Playing...' : 'Tap to play'}
                </span>
              </div>

              {/* Answer Cards */}
              <div className="grid grid-cols-2 gap-4">
                {beginnerQ.options.map(option => {
                  let cardClass =
                    'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800'
                  if (feedback !== 'idle') {
                    if (option.correct)
                      cardClass = 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10'
                    else cardClass = 'border-red-500/50 bg-red-500/5'
                  }
                  return (
                    <button
                      key={option.word}
                      onClick={() => handleBeginnerAnswer(option)}
                      disabled={feedback !== 'idle'}
                      className={`p-6 rounded-2xl border-2 text-center transition-all duration-200 ${cardClass}
                        ${feedback === 'idle' ? 'active:scale-95 cursor-pointer' : 'cursor-default'}
                        disabled:cursor-not-allowed`}
                    >
                      <div className="text-5xl font-black text-white mb-2">{option.word}</div>
                      <div className="text-sm text-gray-400">{option.meaning}</div>
                      {feedback !== 'idle' && option.correct && (
                        <div className="mt-2 text-green-400 text-xs font-bold">✓ Correct</div>
                      )}
                    </button>
                  )
                })}
              </div>

              {feedback === 'correct' && (
                <div className="text-center py-2 text-green-400 font-bold">
                  ✨ Perfect!{streak >= 2 ? ` 🔥 ${streak} streak (+${STREAK_BONUS}pts)` : ''}
                </div>
              )}

              {/* Beginner Wrong Banner */}
              {showPremiumBanner && feedback === 'wrong' && (
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/60 to-gray-900 p-5">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wide mb-2">
                    Pronunciation Insight
                  </p>
                  <p className="text-gray-300 text-xs leading-relaxed mb-3">
                    {beginnerQ.phoneTip}
                  </p>
                  <div className="pt-3 border-t border-amber-500/20">
                    <p className="text-gray-400 text-xs leading-relaxed mb-3">
                      Struggling with{' '}
                      <span className="text-white font-semibold">'불' and '뿔'</span>? Discover the
                      unique{' '}
                      <span className="text-amber-300 font-semibold">
                        muscle mechanics of Korean sounds
                      </span>.
                    </p>
                    <a
                      href={PAYHIP_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs font-black hover:opacity-90 transition-opacity"
                    >
                      "나만의 한국어 발음법" PDF 가이드북 보러가기 ➜
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════ INTERMEDIATE / ADVANCED MODE ════ */}
          {mode !== 'beginner' && dictationQ && (
            <div className="flex flex-col gap-5">
              {/* Context Card */}
              <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5 mt-3">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p
                      className={`text-xs font-bold uppercase tracking-widest mb-0.5 ${
                        isIntermediate ? 'text-blue-400' : 'text-indigo-400'
                      }`}
                    >
                      {dictationQ.context}
                    </p>
                    <h3 className="text-white text-lg font-black mt-0.5">
                      {isIntermediate ? 'Survival Dictation' : 'Professional Dictation'}
                    </h3>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {isIntermediate
                        ? 'Type the full sentence in Korean'
                        : 'Master the connected speech pattern'}
                    </p>
                  </div>
                  <button
                    onClick={() => playKorean(playText)}
                    disabled={feedback !== 'idle'}
                    className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200
                      ${isPlaying
                        ? `${isIntermediate
                            ? 'bg-blue-500 shadow-blue-500/50'
                            : 'bg-indigo-500 shadow-indigo-500/50'
                          } shadow-lg scale-105`
                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isPlaying ? <AudioBars color="white" /> : <PlayIcon />}
                  </button>
                </div>

                <div className="rounded-xl bg-gray-800/60 px-4 py-3">
                  <p className="text-sm text-gray-300">
                    <span
                      className={`font-bold text-xs mr-2 ${
                        isIntermediate ? 'text-blue-400' : 'text-indigo-400'
                      }`}
                    >
                      Hint
                    </span>
                    {dictationQ.hint}
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="flex flex-col gap-3">
                <label className="text-gray-500 text-xs">Type what you hear in Korean</label>
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleDictationSubmit()
                  }}
                  disabled={feedback !== 'idle'}
                  placeholder="한국어로 입력하세요..."
                  className={`w-full px-4 py-4 rounded-xl border-2 bg-gray-900 text-white text-base placeholder:text-gray-700 outline-none transition-all duration-200 disabled:opacity-60
                    ${feedback === 'correct'
                      ? 'border-green-500 bg-green-500/5'
                      : feedback === 'wrong'
                      ? 'border-red-500/60 bg-red-500/5'
                      : isIntermediate
                      ? 'border-gray-700 focus:border-blue-500'
                      : 'border-gray-700 focus:border-indigo-500'
                    }`}
                />
                <button
                  onClick={handleDictationSubmit}
                  disabled={feedback !== 'idle' || !userInput.trim()}
                  className={`w-full px-6 py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r
                    ${isIntermediate ? 'from-blue-600 to-cyan-600' : 'from-indigo-600 to-purple-600'}`}
                >
                  Submit Answer →
                </button>
              </div>

              {feedback === 'correct' && (
                <div className="text-center py-2 text-green-400 font-bold">
                  ✨ Excellent!{streak >= 2 ? ` 🔥 ${streak} streak (+${STREAK_BONUS}pts)` : ''}
                </div>
              )}

              {/* Intermediate / Advanced Wrong Banner */}
              {showPremiumBanner && feedback === 'wrong' && (
                <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-900 to-gray-950 p-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Correct Answer
                  </p>
                  <p className="text-white text-sm font-semibold mb-4">{dictationQ.answer}</p>
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Is real-life conversation or professional Korean still a barrier?{' '}
                      <span className="text-white font-semibold">
                        Step up with expert-curated targeted classes.
                      </span>
                    </p>
                    <ClassLineupCards />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SCREEN: RESULT
  // ─────────────────────────────────────────────────────────────────────────────

  const leaderboardWithUser = [
    ...MOCK_LEADERBOARD,
    { rank: 0, name: 'You 🫵', country: '🌏', score, badge: '🎮' },
  ]
    .sort((a, b) => b.score - a.score)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-7">

        {/* Result Header */}
        <div className="text-center">
          <div className="text-7xl mb-4">{gameResult === 'success' ? '🏆' : '💔'}</div>
          <h2 className="text-3xl font-black">
            {gameResult === 'success' ? 'Round Complete!' : 'Game Over'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {gameResult === 'success'
              ? 'Great work. Keep pushing your pronunciation forward.'
              : 'Every mistake is a muscle memory lesson. Try again.'}
          </p>
          <div className="mt-5 inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gray-900 border border-gray-800">
            <span className="text-gray-500 text-sm">Final Score</span>
            <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              {score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h3 className="font-bold text-white text-sm">🌍 Global Leaderboard</h3>
            <span className="text-xs text-green-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="divide-y divide-gray-800/50">
            {leaderboardWithUser.slice(0, 6).map(entry => (
              <div
                key={entry.name}
                className={`flex items-center px-5 py-3.5 gap-3 transition-colors
                  ${entry.name === 'You 🫵'
                    ? 'bg-purple-500/10 border-l-2 border-purple-500'
                    : 'hover:bg-gray-800/40'
                  }`}
              >
                <span className="text-lg w-5 text-center">{entry.badge}</span>
                <span className="text-gray-600 text-xs w-6">#{entry.rank}</span>
                <span className="text-lg">{entry.country}</span>
                <span
                  className={`flex-1 text-sm font-medium truncate ${
                    entry.name === 'You 🫵' ? 'text-purple-300' : 'text-white'
                  }`}
                >
                  {entry.name}
                </span>
                <span className="font-bold text-yellow-400 text-sm tabular-nums">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Wrong Answers Review */}
        {wrongAnswers.length > 0 && (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h3 className="font-bold text-white text-sm">
                📝 Review Notes{' '}
                <span className="text-gray-600 font-normal">({wrongAnswers.length})</span>
              </h3>
            </div>
            <div className="divide-y divide-gray-800/50">
              {wrongAnswers.map((wa, i) => (
                <div key={i} className="px-5 py-4">
                  <p className="text-gray-600 text-xs mb-2">{wa.prompt}</p>
                  <div className="flex flex-wrap gap-5 text-sm">
                    <div>
                      <span className="text-red-400 text-xs">Your answer  </span>
                      <span className="text-gray-400">{wa.userAnswer || '(no input)'}</span>
                    </div>
                    <div>
                      <span className="text-green-400 text-xs">Correct  </span>
                      <span className="text-white font-bold">{wa.correct}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium CTA Banner */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 to-gray-900 p-6">
          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">
            Step Korean · Accent Specialist
          </p>
          <p className="text-gray-200 text-sm leading-relaxed mb-5">
            You don't need to memorize more vocabulary. You just need to understand the{' '}
            <span className="text-white font-semibold">muscle mechanics of Korean pronunciation</span>.
            Unlock the{' '}
            <span className="text-indigo-300 font-semibold">
              'Step Korean Pronunciation Mapping Guide'
            </span>{' '}
            curated by an accent specialist to speak with absolute confidence.
          </p>
          <a
            href={PAYHIP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-5 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm hover:opacity-90 transition-opacity shadow-lg shadow-indigo-500/20"
          >
            🔓 Unlock Step Korean Guide & Video ($9.99/mo)
          </a>
        </div>

        {/* Replay / Menu */}
        <div className="flex gap-3">
          <button
            onClick={() => startGame(mode)}
            className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 transition-opacity"
          >
            🔄 Play Again
          </button>
          <button
            onClick={() => setScreen('dashboard')}
            className="px-6 py-4 rounded-xl bg-gray-800 border border-gray-700/60 text-gray-300 font-medium hover:bg-gray-700 transition-colors text-sm"
          >
            Menu
          </button>
        </div>

      </div>
    </div>
  )
}
