import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { INTERMEDIATE_SENTENCES, ADVANCED_SENTENCES, DictationSentence, pickRandom } from '@/data/sentences'

const QUESTIONS_PER_SESSION = 10

type Screen = 'game' | 'result'

interface WrongEntry {
  displayText: string
  userAnswer: string
  correctAnswer: string
}

function useTTS(rate = 0.85) {
  const [isPlaying, setIsPlaying] = useState(false)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'ko-KR'
      utt.rate = rate
      utt.pitch = 1.0
      setIsPlaying(true)
      utt.onend = () => setIsPlaying(false)
      utt.onerror = () => setIsPlaying(false)
      window.speechSynthesis.speak(utt)
    }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      window.speechSynthesis.onvoiceschanged = doSpeak
    } else {
      doSpeak()
    }
  }, [rate])

  const cancel = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsPlaying(false)
  }, [])

  return { isPlaying, speak, cancel }
}

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

// Renders displayText, highlighting the [ ] blank as a styled chip
function ClozeDisplay({ text }: { text: string }) {
  const parts = text.split(/(\[.*?\])/)
  return (
    <p className="text-gray-100 text-lg leading-loose font-medium">
      {parts.map((part, i) =>
        /^\[.*\]$/.test(part) ? (
          <span
            key={i}
            className="inline-block mx-1 px-3 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 font-mono tracking-widest text-base align-middle"
          >
            ______
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  )
}

export default function DictationPage() {
  const { t } = useLang()
  const [params] = useSearchParams()
  const mode = params.get('mode') === 'advanced' ? 'advanced' : 'intermediate'
  const ttsRate = mode === 'advanced' ? 1.0 : 0.85
  const { isPlaying, speak, cancel } = useTTS(ttsRate)

  const [questions] = useState<DictationSentence[]>(() =>
    pickRandom(mode === 'advanced' ? ADVANCED_SENTENCES : INTERMEDIATE_SENTENCES, QUESTIONS_PER_SESSION)
  )
  const [idx, setIdx] = useState(0)
  const [screen, setScreen] = useState<Screen>('game')
  const [userInput, setUserInput] = useState('')
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongEntries, setWrongEntries] = useState<WrongEntry[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const current = questions[idx]
  const total = questions.length

  useEffect(() => {
    if (screen !== 'game' || !current) return
    const timer = setTimeout(() => speak(current.fullSentence), 300)
    return () => {
      clearTimeout(timer)
      cancel()
    }
  }, [idx, screen]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (feedback === 'idle') return
    const delay = feedback === 'correct' ? 1200 : 2000
    const timer = setTimeout(() => {
      if (idx + 1 >= total) {
        setScreen('result')
      } else {
        setIdx(i => i + 1)
        setUserInput('')
        setFeedback('idle')
        inputRef.current?.focus()
      }
    }, delay)
    return () => clearTimeout(timer)
  }, [feedback, idx, total])

  const handleSubmit = useCallback(() => {
    if (feedback !== 'idle' || !userInput.trim()) return
    if (userInput.trim() === current.answer) {
      setCorrectCount(c => c + 1)
      setFeedback('correct')
    } else {
      setWrongEntries(prev => [...prev, {
        displayText: current.displayText,
        userAnswer: userInput.trim(),
        correctAnswer: current.answer,
      }])
      setFeedback('wrong')
    }
  }, [feedback, userInput, current])

  const restartGame = useCallback(() => {
    window.location.reload()
  }, [])

  const accentColor = mode === 'advanced' ? 'from-indigo-500 to-purple-500' : 'from-blue-500 to-cyan-500'
  const badgeColor  = mode === 'advanced'
    ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  const modeLabel = mode === 'advanced' ? '🎙️ ADVANCED' : '🗣️ INTERMEDIATE'

  // ── Result screen ──
  if (screen === 'result') {
    const pct = Math.round((correctCount / total) * 100)
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg flex flex-col gap-6">
          <div className="text-center">
            <div className="text-7xl mb-4">{pct >= 70 ? '🏆' : '💪'}</div>
            <h2 className="text-3xl font-black">{t('dictation.result')}</h2>
            <div className="mt-4 inline-flex items-center gap-6 px-8 py-4 rounded-2xl bg-gray-900 border border-gray-800">
              <div className="text-center">
                <p className="text-gray-500 text-xs">{t('dictation.correct10')}</p>
                <p className="text-3xl font-black text-yellow-400">{correctCount}<span className="text-lg text-gray-500 ml-1">/ {total}</span></p>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div className="text-center">
                <p className="text-gray-500 text-xs">{t('dictation.score')}</p>
                <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{pct}%</p>
              </div>
            </div>
          </div>

          {wrongEntries.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="font-bold text-sm">📝 Review ({wrongEntries.length})</h3>
              </div>
              <div className="divide-y divide-gray-800/50 max-h-72 overflow-y-auto">
                {wrongEntries.map((e, i) => (
                  <div key={i} className="px-5 py-4">
                    <p className="text-gray-500 text-xs mb-2 leading-relaxed">{e.displayText}</p>
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="text-red-400 text-xs">{e.userAnswer || '(no input)'}</span>
                      <span className="text-green-400 font-bold">{t('dictation.correctAnswer')} {e.correctAnswer}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={restartGame}
              className={`flex-1 py-4 rounded-2xl bg-gradient-to-r ${accentColor} text-white font-black text-base hover:opacity-90 transition-opacity`}
            >
              {t('dictation.playAgain')}
            </button>
            <Link
              to="/home"
              className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700/60 text-gray-300 font-medium hover:bg-gray-700 transition-colors text-sm flex items-center"
            >
              {t('dictation.backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ──
  const progress = (idx / total) * 100

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>{modeLabel}</span>
            <span className="text-gray-600 text-xs">{idx + 1} / {total}</span>
          </div>
          <Link to="/home" className="text-gray-500 hover:text-white text-sm transition-colors">✕</Link>
        </div>
        <div className="h-1 bg-gray-800">
          <div className={`h-1 bg-gradient-to-r ${accentColor} transition-all duration-500`} style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Game area */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">

        {/* TTS button */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-gray-500 text-xs tracking-wide">듣고 빈칸에 들어갈 단어를 입력하세요</p>
          <button
            onClick={() => speak(current.fullSentence)}
            disabled={isPlaying || feedback !== 'idle'}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 disabled:cursor-not-allowed
              ${isPlaying
                ? `bg-gradient-to-br ${accentColor} shadow-xl scale-105`
                : 'bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-gray-500'
              }`}
          >
            {isPlaying ? (
              <AudioBars />
            ) : (
              <svg className="w-8 h-8 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          {!isPlaying && feedback === 'idle' && (
            <button
              onClick={() => speak(current.fullSentence)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
            >
              {t('dictation.listenAgain')}
            </button>
          )}
          {isPlaying && <p className="text-xs text-gray-500 animate-pulse">{t('dictation.autoPlaying')}</p>}
        </div>

        {/* Sentence with cloze blank */}
        <div className="rounded-2xl bg-gray-900/70 border border-gray-700/60 px-5 py-5">
          <p className="text-[10px] text-indigo-400/70 font-semibold uppercase tracking-widest mb-3">빈칸 채우기</p>
          <ClozeDisplay text={current.displayText} />
        </div>

        {/* Single-word input */}
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
                ? 'border-green-500 bg-green-500/8 shadow-lg shadow-green-500/10'
                : feedback === 'wrong'
                ? 'border-red-500/60 bg-red-500/6'
                : 'border-gray-700/80 focus:border-indigo-500 focus:bg-gray-900 focus:shadow-lg focus:shadow-indigo-500/10'
              }`}
          />
          <button
            onClick={handleSubmit}
            disabled={feedback !== 'idle' || !userInput.trim()}
            className={`w-full py-3.5 rounded-xl text-white font-bold hover:opacity-90 transition-opacity
              disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${accentColor}`}
          >
            {t('dictation.submit')}
          </button>
        </div>

        {/* Feedback */}
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
