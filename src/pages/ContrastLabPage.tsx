import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import { CONTRAST_ITEMS, CONTRAST_SETS } from '@/data/listening/mockContrasts'
import type { ContrastSet, DictationItem, Annotation } from '@/data/listening/schema'
import { resolveString } from '@/data/listening/strings'
import { recordListeningMiss } from '@/lib/errorHistory'

// ── 데이터 해석 ───────────────────────────────────────────────────────────────
function itemById(id: number): DictationItem {
  return CONTRAST_ITEMS.find((i) => i.id === id)!
}
function memberAnnotation(item: DictationItem, firedRule: string | null): Annotation | undefined {
  if (firedRule === null) return undefined
  return item.annotations.find((a) => a.rule === firedRule)
}
/** surface 파생: firedRule≠null → 그 rule annotation.surface, null → transcript */
function deriveSurface(item: DictationItem, firedRule: string | null): string {
  return memberAnnotation(item, firedRule)?.surface ?? item.transcript
}

interface RMember { ref: number; item: DictationItem; firedRule: string | null; surface: string; written: string }
interface Round { set: ContrastSet; members: RMember[]; targetIdx: number }

function buildRound(set: ContrastSet): Round {
  const members = set.members.map((m) => {
    const item = itemById(m.ref)
    return { ref: m.ref, item, firedRule: m.firedRule, surface: deriveSurface(item, m.firedRule), written: item.transcript }
  })
  return { set, members, targetIdx: Math.floor(Math.random() * members.length) }
}
function buildSession(): Round[] {
  return [...CONTRAST_SETS].sort(() => Math.random() - 0.5).map(buildRound)
}

// ── TTS (오디오 있으면 오디오, 실패/없으면 TTS) ────────────────────────────────
function speak(text: string, rate = 1) {
  try {
    if (!('speechSynthesis' in window)) return
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'ko-KR'; u.rate = rate
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)
  } catch { /* TTS 미지원 무시 */ }
}
function play(item: DictationItem, surface: string, rate = 1) {
  if (item.audioUrl) {
    const a = new Audio(item.audioUrl)
    a.onerror = () => speak(surface, rate)
    a.play().catch(() => speak(surface, rate))
  } else speak(surface, rate)
}

export default function ContrastLabPage() {
  const { lang } = useLang()
  const [rounds, setRounds] = useState<Round[]>(() => buildSession())
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongQs, setWrongQs] = useState<string[]>([])
  const [done, setDone] = useState(false)

  const round = rounds[idx]
  const target = round?.members[round.targetIdx]

  // 라운드 진입 시 타깃 소리 자동 재생
  useEffect(() => {
    if (done || !round) return
    const t = setTimeout(() => play(target.item, target.surface, 1), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, done])

  const pick = useCallback((i: number) => {
    if (chosen !== null || !round) return
    setChosen(i)
    const ok = i === round.targetIdx
    if (ok) {
      setCorrectCount((c) => c + 1)
    } else {
      setWrongQs((w) => [...w, resolveString(round.set.question, lang)])
      // 대비의 현상(표시된 멤버의 annotation) 으로 오답 기록 → 약점 집계
      const markedAnn =
        memberAnnotation(target.item, target.firedRule) ??
        round.members.map((m) => memberAnnotation(m.item, m.firedRule)).find(Boolean)
      if (markedAnn) {
        recordListeningMiss(target.written, round.members[i].written, {
          phenomenon: markedAnn.phenomenon,
          changeType: markedAnn.changeType,
          rule: target.firedRule ?? undefined,
          context: target.written,
        })
      }
    }
  }, [chosen, round, target, lang])

  const next = useCallback(() => {
    if (idx + 1 >= rounds.length) { setDone(true); return }
    setIdx((i) => i + 1); setChosen(null)
  }, [idx, rounds.length])

  const restart = useCallback(() => {
    setRounds(buildSession()); setIdx(0); setChosen(null); setCorrectCount(0); setWrongQs([]); setDone(false)
  }, [])

  // ── 결과 ──
  if (done) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-lg mx-auto px-4 py-10 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-6xl">{correctCount >= rounds.length - 1 ? '👂' : '🔁'}</div>
            <h2 className="text-2xl font-black">변별 완료</h2>
            <p className="text-gray-400">{correctCount}/{rounds.length} 정확히 구별했어요</p>
          </div>
          {wrongQs.length > 0 && (
            <div className="rounded-2xl bg-gray-900 border border-gray-800 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-400/80 mb-3">다시 볼 판단</p>
              <ul className="flex flex-col gap-1.5 text-sm text-gray-200 list-disc pl-5">
                {wrongQs.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={restart} className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 font-black hover:opacity-90 transition">다시</button>
            <Link to="/" className="px-6 py-4 rounded-2xl bg-gray-800 border border-gray-700 text-gray-300 font-medium hover:bg-gray-700 transition flex items-center">홈</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!round) return null
  const revealed = chosen !== null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <header className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800/60">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">🎧 소리 구별</span>
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
            <button onClick={() => play(target.item, target.surface, 1)}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg hover:opacity-90 active:scale-95 transition" aria-label="다시 듣기">
              <svg className="w-7 h-7 ml-1 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <button onClick={() => play(target.item, target.surface, 0.6)}
              className="h-10 px-4 rounded-full bg-gray-800 border border-gray-700 text-gray-300 text-sm font-bold hover:border-gray-500 transition">🐢 천천히</button>
          </div>
          <span className="text-[10px] text-gray-600">데모 음성(TTS) · 실제 콘텐츠는 녹음 오디오</span>
        </div>

        {/* 판별 질문 */}
        <p className="text-center text-gray-300 text-sm font-semibold px-4">{resolveString(round.set.question, lang)}</p>
        <p className="text-center text-gray-600 text-xs -mt-4">방금 들은 소리는 어느 쪽인가요?</p>

        {/* 선택지 */}
        <div className="flex flex-col gap-3">
          {round.members.map((m, i) => {
            const isTarget = i === round.targetIdx
            const isChosen = i === chosen
            let cls = 'border-gray-700 bg-gray-900/80 hover:border-gray-500'
            if (revealed && isTarget) cls = 'border-green-500 bg-green-500/10'
            else if (revealed && isChosen) cls = 'border-red-500/70 bg-red-500/10'
            else if (revealed) cls = 'border-gray-800 bg-gray-900/40 opacity-60'
            return (
              <button key={m.ref} onClick={() => pick(i)} disabled={revealed}
                className={`w-full px-5 py-4 rounded-2xl border-2 text-left transition ${cls}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black">{m.written}</span>
                  {revealed && (
                    <span className="text-sm text-gray-400">
                      [{m.surface}] {isTarget ? '✓' : isChosen ? '✗' : ''}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* 해설 */}
        {revealed && (
          <div className="flex flex-col gap-4">
            <div className={`rounded-2xl border px-5 py-4 ${chosen === round.targetIdx ? 'border-green-500/40 bg-green-500/5' : 'border-red-500/40 bg-red-500/5'}`}>
              <p className={`font-black text-lg ${chosen === round.targetIdx ? 'text-green-400' : 'text-red-400'}`}>
                {chosen === round.targetIdx ? '정답! 🎉' : '아깝네요'}
              </p>
              {round.set.note && (
                <p className="mt-2 text-sm text-gray-300 leading-relaxed">{resolveString(round.set.note, lang)}</p>
              )}
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
