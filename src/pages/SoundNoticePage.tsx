import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { SOUND_ITEMS } from '@/data/listening/mockSounds'
import ITEMS from '@/data/listening/items.json'
import { phenomenonLabel } from '@/data/listening/labels'
import { resolveString } from '@/data/listening/strings'
import type { DictationItem, Phenomenon } from '@/data/listening/schema'
import { recordListeningMiss, getPhenomenonWeakness } from '@/lib/errorHistory'
import { useGamification } from '@/lib/gamification'

// ── TTS (오디오 있으면 오디오, 실패/없으면 TTS) ────────────────────────────────
function speak(text: string, rate = 1) {
  try {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'; u.rate = rate
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
  } catch { /* 무시 */ }
}
function play(item: DictationItem, surface: string, rate = 1) {
  if (item.audioUrl) {
    const a = new Audio(item.audioUrl)
    a.onerror = () => speak(surface, rate)
    a.play().catch(() => speak(surface, rate))
  } else speak(surface, rate)
}

interface Round { item: DictationItem; surface: string; options: string[]; answerIdx: number }

function buildRound(item: DictationItem): Round {
  const surface = item.annotations[0]?.surface ?? item.transcript
  // 보기: 표기(그대로 읽은 형태) vs 실제 소리(surface), 순서 무작위
  const options = Math.random() < 0.5 ? [item.transcript, surface] : [surface, item.transcript]
  return { item, surface, options, answerIdx: options.indexOf(surface) }
}
// 태깅된 실제 항목(items.json) 중 '표기≠실제소리'만 사용, 없으면 데모(mockSounds) 폴백.
const REAL = (ITEMS as DictationItem[]).filter((it) => {
  const a = it.annotations?.[0]
  return !!a && !!a.surface && a.surface !== it.transcript
})
const POOL: DictationItem[] = REAL.length > 0 ? REAL : SOUND_ITEMS

function buildSession(n = 6): Round[] {
  return [...POOL].sort(() => Math.random() - 0.5).slice(0, n).map(buildRound)
}

export default function SoundNoticePage() {
  const { lang } = useLang()
  const { recordListeningRep } = useGamification()
  const [rounds, setRounds] = useState<Round[]>(() => buildSession())
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)

  const round = rounds[idx]

  useEffect(() => {
    if (done || !round) return
    const t = setTimeout(() => play(round.item, round.surface, 1), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  const pick = useCallback((i: number) => {
    if (chosen !== null || !round) return
    setChosen(i)
    void recordListeningRep() // 문항 완료 1회 기록(마일스톤)
    if (i === round.answerIdx) {
      setCorrectCount((c) => c + 1)
    } else {
      const an = round.item.annotations[0]
      if (an) {
        recordListeningMiss(round.item.transcript, round.options[i], {
          phenomenon: an.phenomenon, changeType: an.changeType, rule: an.rule, context: round.item.transcript,
        })
      }
    }
  }, [chosen, round, recordListeningRep])

  const next = useCallback(() => {
    if (idx + 1 >= rounds.length) { setDone(true); return }
    setIdx((i) => i + 1); setChosen(null)
  }, [idx, rounds.length])

  const restart = useCallback(() => {
    setRounds(buildSession()); setIdx(0); setChosen(null); setCorrectCount(0); setDone(false)
  }, [])

  // ── 결과 ──
  if (done) {
    const weakness = Object.entries(getPhenomenonWeakness()).sort((a, b) => b[1] - a[1]) as [Phenomenon, number][]
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-6xl">{correctCount >= rounds.length - 1 ? '🎧' : '👂'}</div>
            <h2 className="text-2xl font-black">오늘의 소리 듣기 완료</h2>
            <p className="text-gray-400">{correctCount}/{rounds.length} 소리를 제대로 들었어요</p>
          </div>
          {weakness.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-3">👂 자주 놓친 소리</p>
              <ul className="flex flex-col gap-2">
                {weakness.map(([p, n]) => (
                  <li key={p} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-200">{phenomenonLabel(p, undefined, lang).title}</span>
                    <span className="text-xs text-gray-400">{n}회</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={restart} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 font-black hover:opacity-90 transition">다시 듣기</button>
            <Link to="/" className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 font-medium hover:bg-gray-700 transition flex items-center">홈</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!round) return null
  const revealed = chosen !== null
  const an = round.item.annotations[0]

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">🎧 소리 듣기</span>
          <span className="text-gray-600 text-xs">{idx + 1} / {rounds.length}</span>
          <Link to="/" className="text-gray-500 hover:text-white text-sm">✕</Link>
        </div>
        <div className="h-1 bg-gray-800">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" style={{ width: `${(idx / rounds.length) * 100}%` }} />
        </div>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* 재생 */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => play(round.item, round.surface, 1)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition" aria-label="다시 듣기">
              <svg className="w-7 h-7 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button onClick={() => play(round.item, round.surface, 0.6)}
              className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🐢 천천히</button>
          </div>
          <span className="text-[10px] text-gray-600">데모 음성(TTS) · 실제 콘텐츠는 녹음 오디오</span>
        </div>

        <p className="text-center text-gray-200 text-base font-semibold">어떻게 들렸나요?</p>

        {/* 보기: 표기 vs 실제 소리 */}
        <div className="flex flex-col gap-3">
          {round.options.map((opt, i) => {
            const isAnswer = i === round.answerIdx
            const isChosen = i === chosen
            let cls = 'border-gray-700 bg-gray-900/80 hover:border-gray-500'
            if (revealed && isAnswer) cls = 'border-green-500 bg-green-500/10'
            else if (revealed && isChosen) cls = 'border-red-500/70 bg-red-500/10'
            else if (revealed) cls = 'border-gray-800 bg-gray-900/40 opacity-60'
            return (
              <button key={i} onClick={() => pick(i)} disabled={revealed}
                className={`w-full px-5 py-4 rounded-2xl border-2 text-center transition ${cls}`}>
                <span className="text-2xl font-black">{opt}</span>
                {revealed && isAnswer && <span className="ml-2 text-green-400">✓ 실제 소리</span>}
                {revealed && isChosen && !isAnswer && <span className="ml-2 text-red-400">✗</span>}
              </button>
            )
          })}
        </div>

        {/* 확인 + (필요 시) 설명 */}
        {revealed && (
          <div className="flex flex-col gap-4">
            <div className={`rounded-2xl border px-5 py-4 text-center ${chosen === round.answerIdx ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
              <p className={`font-black text-lg ${chosen === round.answerIdx ? 'text-green-400' : 'text-red-400'}`}>
                {chosen === round.answerIdx ? '잘 들었어요! 🎧' : '다시 들어볼까요'}
              </p>
              <p className="mt-2 text-sm text-gray-300">
                <span className="text-gray-500">이렇게 써요 </span>
                <span className="font-bold text-gray-100">{round.item.transcript}</span>
                <span className="text-gray-500"> · 이렇게 들려요 </span>
                <span className="font-bold text-green-300">{round.surface}</span>
              </p>
            </div>

            {/* 소리를 확인한 뒤: 책 프레임 라벨(막힘·넘김·바뀜·읽기) → 설명 → 항목별 note */}
            {an && (
              <div className="flex flex-col items-center gap-1 px-4 text-center">
                <span className="rounded-full border border-indigo-400/40 bg-indigo-500/15 px-2.5 py-0.5 text-[11px] font-bold text-indigo-300">
                  {phenomenonLabel(an.phenomenon, an.changeType, lang).title}
                </span>
                <p className="text-xs text-gray-500">{phenomenonLabel(an.phenomenon, an.changeType, lang).subtitle}</p>
                {an.note && <p className="mt-0.5 text-sm leading-relaxed text-gray-300">{resolveString(an.note, lang)}</p>}
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              <button onClick={() => play(round.item, round.surface, 1)} className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🔊 다시</button>
              <button onClick={() => play(round.item, round.surface, 0.6)} className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🐢 천천히</button>
            </div>

            <button onClick={next} className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 transition">
              {idx + 1 >= rounds.length ? '결과 보기' : '다음'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
