import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { generateItemBlank, pickItems, type ItemBlank } from '@/data/listening/blank'
import { MOCK_ITEMS } from '@/data/listening/mockItems'
import { phenomenonLabel } from '@/data/listening/labels'
import type { DictationItem, Phenomenon } from '@/data/listening/schema'
import {
  recordListeningMiss,
  recordCorrect,
  getPhenomenonWeakness,
} from '@/lib/errorHistory'

const SESSION_SIZE = 5

// 입력 비교용 — 공백/문장부호 제거
function normalize(s: string) {
  return s.replace(/\s/g, '').replace(/[.,!?。]/g, '').trim()
}

// annotation 의 surface 를 transcript 에 적용해 "실제로 들리는" 발화형을 만든다.
function spokenForm(item: DictationItem): string {
  const spans = [...item.annotations]
    .filter((a) => a.surface)
    .sort((a, b) => b.span[0] - a.span[0]) // 뒤에서부터 치환해 인덱스 안 밀리게
  let out = item.transcript
  for (const a of spans) out = out.slice(0, a.span[0]) + a.surface + out.slice(a.span[1])
  return out
}

function speak(text: string, rate = 1) {
  try {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'
    u.rate = rate
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch {
    /* TTS 미지원 — 데모 음성은 부가 기능이라 조용히 무시 */
  }
}

function buildSession(): ItemBlank[] {
  const weakness = getPhenomenonWeakness()
  return pickItems(MOCK_ITEMS, SESSION_SIZE).map((it) => generateItemBlank(it, { weakness }))
}

type Result = { phenomenon: Phenomenon | null; correct: boolean }

// ── 빈칸 표시 ─────────────────────────────────────────────────────────────────
function Cloze({ text }: { text: string }) {
  return (
    <p className="text-gray-100 text-xl leading-loose font-medium text-center">
      {text.split(/(\[_+\])/).map((part, i) =>
        /^\[_+\]$/.test(part) ? (
          <span key={i} className="inline-block mx-1 px-4 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/50 text-indigo-300 font-mono tracking-widest align-middle">
            ____
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  )
}

// ── 오디오(데모 TTS) 버튼 ─────────────────────────────────────────────────────
function PlayRow({ spoken }: { spoken: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        <button
          onClick={() => speak(spoken, 1)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition"
          aria-label="다시 듣기"
        >
          <svg className="w-7 h-7 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
        </button>
        <button
          onClick={() => speak(spoken, 0.6)}
          className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition"
        >
          🐢 천천히
        </button>
      </div>
      <span className="text-[10px] text-gray-600">데모 음성(브라우저 TTS) · 실제 콘텐츠는 녹음 오디오</span>
    </div>
  )
}

export default function DecodeLabPage() {
  const { lang } = useLang()
  const [blanks, setBlanks] = useState<ItemBlank[]>(() => buildSession())
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState<'ask' | 'reveal'>('ask')
  const [lastCorrect, setLastCorrect] = useState(false)
  const [results, setResults] = useState<Result[]>([])
  const [done, setDone] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = blanks[idx]
  const spoken = current ? spokenForm(current.item) : ''

  // 문항 진입 시 자동 재생 + 포커스
  useEffect(() => {
    if (done || !current) return
    const timer = setTimeout(() => speak(spoken, 1), 350)
    inputRef.current?.focus()
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  const submit = useCallback(() => {
    if (phase !== 'ask' || !input.trim() || !current) return
    const correct = normalize(input) === normalize(current.answer)
    setLastCorrect(correct)
    setResults((r) => [...r, { phenomenon: current.phenomenon, correct }])
    if (correct) {
      recordCorrect(current.answer, { source: 'listening' })
    } else {
      recordListeningMiss(current.answer, input.trim(), {
        phenomenon: current.phenomenon ?? undefined,
        changeType: current.changeType,
        rule: current.annotation?.rule,
        context: current.item.transcript,
      })
    }
    setPhase('reveal')
  }, [phase, input, current])

  const next = useCallback(() => {
    if (idx + 1 >= blanks.length) { setDone(true); return }
    setIdx((i) => i + 1)
    setInput('')
    setPhase('ask')
  }, [idx, blanks.length])

  const restart = useCallback(() => {
    setBlanks(buildSession())
    setIdx(0); setInput(''); setPhase('ask'); setResults([]); setDone(false)
  }, [])

  // ── 결과 화면 ──
  if (done) {
    const correctCount = results.filter((r) => r.correct).length
    const weakness = Object.entries(getPhenomenonWeakness())
      .sort((a, b) => b[1] - a[1]) as [Phenomenon, number][]
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-6xl">{correctCount >= 4 ? '🎧' : '💪'}</div>
            <h2 className="text-2xl font-black">오늘의 리스닝 완료</h2>
            <p className="text-gray-400">실제 한국어 {correctCount}/{results.length} 문장을 알아들었어요</p>
          </div>

          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-3">👂 당신의 약점 (누적)</p>
            {weakness.length === 0 ? (
              <p className="text-gray-500 text-sm">아직 약점 데이터가 없어요. 몇 번 더 훈련하면 여기에 현상별로 쌓여요.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {weakness.map(([p, n]) => {
                  const label = phenomenonLabel(p, undefined, lang)
                  return (
                    <li key={p} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-200">{label.title}</span>
                      <span className="text-xs text-gray-400">{n}회 놓침</span>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="text-[11px] text-gray-600 mt-3">약점이 높은 현상은 다음 세션에서 더 자주 나와요.</p>
          </div>

          <div className="flex gap-3">
            <button onClick={restart} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 font-black hover:opacity-90 transition">
              다시 훈련
            </button>
            <Link to="/" className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 font-medium hover:bg-gray-700 transition flex items-center">
              홈
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!current) return null
  const label = phenomenonLabel(current.phenomenon, current.changeType, lang)

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
            🎧 DECODE LAB
          </span>
          <span className="text-gray-600 text-xs">{idx + 1} / {blanks.length}</span>
          <Link to="/" className="text-gray-500 hover:text-white text-sm">✕</Link>
        </div>
        <div className="h-1 bg-gray-800">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" style={{ width: `${(idx / blanks.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <p className="text-center text-gray-500 text-xs">듣고 빈칸에 들어갈 말을 입력하세요</p>

        <PlayRow spoken={spoken} />

        <div className="rounded-2xl bg-gray-900/70 border border-gray-700/60 px-5 py-6">
          <Cloze text={current.displayText} />
        </div>

        {phase === 'ask' && (
          <div className="flex flex-col gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
              placeholder="입력…"
              autoComplete="off"
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-700 bg-gray-900/80 text-white text-xl font-bold text-center tracking-wider outline-none focus:border-blue-500 transition"
            />
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              확인
            </button>
          </div>
        )}

        {phase === 'reveal' && (
          <div className="flex flex-col gap-4">
            {/* 정오 배너 */}
            <div className={`rounded-2xl border px-5 py-4 ${lastCorrect ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
              <p className={`font-black text-lg ${lastCorrect ? 'text-green-400' : 'text-red-400'}`}>
                {lastCorrect ? '정답! 🎉' : '아깝네요'}
              </p>

              {/* Why didn't I hear it? */}
              {current.phenomenon && current.surface && (
                <div className="mt-3 flex flex-col gap-2">
                  <span className="inline-flex self-start items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/40 text-indigo-300">
                    👂 {label.title}
                  </span>
                  <div className="flex items-center justify-center gap-3 text-lg py-1">
                    <span className="text-gray-400 line-through decoration-red-400/50">{current.surface}</span>
                    <span className="text-gray-600">→</span>
                    <span className="text-green-300 font-bold">{current.answer}</span>
                  </div>
                  {current.annotation?.note && (
                    <p className="text-sm text-gray-300 text-center leading-relaxed">{current.annotation.note}</p>
                  )}
                </div>
              )}
              {!lastCorrect && (
                <p className="mt-2 text-xs text-center">
                  <span className="text-gray-500">입력: </span>
                  <span className="text-red-300">{results[results.length - 1] && input ? input : '(미입력)'}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => speak(spoken, 1)} className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🔊 다시</button>
              <button onClick={() => speak(spoken, 0.6)} className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🐢 천천히</button>
            </div>

            <button onClick={next} className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition">
              {idx + 1 >= blanks.length ? '결과 보기' : '다음'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
