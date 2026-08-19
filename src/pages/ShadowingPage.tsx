// src/pages/ShadowingPage.tsx
// 섀도잉 모드 — 원어민 음성을 듣고, 내 목소리를 녹음해 "귀로 직접 비교"하는 자가 학습.
//   흐름: 레벨 선택 → (듣기 → 녹음 → 비교 → 자가 평가) × N → 요약
//   설계 원칙: 브라우저 음성인식 점수는 신뢰도가 낮아 제거했다. 대신 학습자가
//     원어민 음원과 자기 녹음을 직접 비교하고 스스로 평가한다(섀도잉의 본질).
//   연동:
//     · 스트릭 — 세션 완료 시 markVideoCompleted()
//     · 자가 평가('더 연습'/'잘 됐어요')는 진행 흐름 제어에만 쓴다 —
//       섀도잉은 개인 복습(오답노트)에 기록을 남기지 않는다(사용자 요청).
//   부가: 재생 중 파형 애니메이션 / 원어민·내 목소리 배타 재생 / 배속 선택
//   녹음은 MediaRecorder 사용, 로컬 메모리 전용(서버 전송 없음).

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLang, LanguageSwitcher } from '@/lib/i18n'
import { useGamification } from '@/lib/gamification'
import {
  INTERMEDIATE_SENTENCES,
  ADVANCED_SENTENCES,
  pickRandom,
  DictationSentence,
} from '@/data/sentences'
import { BEGINNER_SHADOW_PAIRS, wordAudioUrl, sample } from '@/data/minimalPairs'
import { playExclusive, stopExclusive } from '@/lib/exclusivePlayer'
import ShadowCompare from '@/components/ShadowCompare'
import ShadowScore from '@/components/ShadowScore'
import { AI_SCORE_ENABLED } from '@/lib/shadowConsent'

const SESSION_SIZE = 8
const RATES = [0.5, 0.75, 1, 1.25] // 배속 옵션


function recordingSupported(): boolean {
  return typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof window !== 'undefined'
    && typeof window.MediaRecorder !== 'undefined'
}

export default function ShadowingPage() {
  const { t } = useLang()
  const { markVideoCompleted } = useGamification()
  const [searchParams] = useSearchParams()

  // 오답노트에서 특정 문장만 연습하도록 넘어온 경우(?s=문장) — 그 문장 하나로 시작
  const preset = useMemo(() => {
    const s = searchParams.get('s')
    if (!s) return null
    return [...INTERMEDIATE_SENTENCES, ...ADVANCED_SENTENCES].find(x => x.fullSentence === s) ?? null
  }, [searchParams])

  const [screen, setScreen] = useState<'select' | 'practice' | 'done'>(preset ? 'practice' : 'select')
  const [mode, setMode] = useState<'sentence' | 'pair'>('sentence')
  const [deck, setDeck] = useState<DictationSentence[]>(preset ? [preset] : [])
  const [pairDeck, setPairDeck] = useState<string[][]>([])
  const [index, setIndex] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [round, setRound] = useState(0) // 같은 문장 재연습 시 ShadowItem 강제 remount

  // 현재 세션 길이 (초급은 대립쌍, 중·고급은 문장)
  const sessionLength = mode === 'pair' ? pairDeck.length : deck.length

  const start = (level: 'beginner' | 'intermediate' | 'advanced') => {
    if (level === 'beginner') {
      setPairDeck(sample(BEGINNER_SHADOW_PAIRS, SESSION_SIZE))
      setMode('pair')
    } else {
      const src = level === 'intermediate' ? INTERMEDIATE_SENTENCES : ADVANCED_SENTENCES
      setDeck(pickRandom(src, SESSION_SIZE))
      setMode('sentence')
    }
    setIndex(0)
    setReviewCount(0)
    setRound(r => r + 1)
    setScreen('practice')
  }

  // 재연습: 단일 문장 모드면 같은 문장을 다시, 아니면 레벨 선택으로
  const practiceAgain = () => {
    if (preset) {
      setIndex(0)
      setReviewCount(0)
      setRound(r => r + 1)
      setScreen('practice')
    } else {
      setScreen('select')
    }
  }

  const handleItemDone = (reviewed: boolean) => {
    if (reviewed) setReviewCount(c => c + 1)
    if (index + 1 >= sessionLength) {
      void markVideoCompleted() // 스트릭: 오늘의 학습 활동으로 기록
      setScreen('done')
    } else {
      setIndex(i => i + 1)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">← {t('shadowing.home')}</Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black" translate="no">🎤 Shadowing</span>
          <span className="rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-0.5">BETA</span>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {screen === 'select' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
            <div>
              <h1 className="text-2xl font-black" translate="no">🎤 Shadowing</h1>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">{t('shadowing.subtitle')}</p>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => start('beginner')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                {t('shadowing.startBeginner')}
              </button>
              <button
                onClick={() => start('intermediate')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                {t('shadowing.startIntermediate')}
              </button>
              <button
                onClick={() => start('advanced')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-500 text-white font-bold hover:opacity-90 transition-opacity"
              >
                {t('shadowing.startAdvanced')}
              </button>
            </div>
          </div>
        )}

        {screen === 'practice' && mode === 'pair' && pairDeck[index] && (
          <ShadowPairItem
            key={`${pairDeck[index].join('-')}-${round}`}
            pair={pairDeck[index]}
            index={index}
            total={pairDeck.length}
            onDone={handleItemDone}
          />
        )}

        {screen === 'practice' && mode === 'sentence' && deck[index] && (
          <ShadowItem
            key={`${deck[index].id}-${round}`}
            sentence={deck[index]}
            index={index}
            total={deck.length}
            onDone={handleItemDone}
          />
        )}

        {screen === 'done' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="text-2xl font-black">{t('shadowing.done')}</h2>
            <div className="flex flex-col items-center gap-1 text-sm text-slate-500">
              <span><span className="text-slate-900 font-bold">{sessionLength}</span> {t('shadowing.practiced')}</span>
              {reviewCount > 0 && (
                <span><span className="text-violet-600 font-bold">{reviewCount}</span> {t('shadowing.reviewSaved')}</span>
              )}
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={practiceAgain}
                className="w-full py-3.5 rounded-2xl bg-indigo-500 text-white font-bold hover:bg-indigo-400 transition-colors"
              >
                {t('shadowing.again')}
              </button>
              {(reviewCount > 0 || preset) && (
                <Link
                  to="/review"
                  className="w-full py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-600 font-bold hover:border-slate-400 hover:text-slate-900 transition-colors text-center"
                >
                  {t('review.title')}
                </Link>
              )}
              <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                {t('shadowing.home')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 재생 중 파형 애니메이션 ───────────────────────────────────────────────────
function Waveform({ active }: { active: boolean }) {
  const heights = [10, 18, 26, 20, 30, 16, 24, 12]
  return (
    <div className="flex items-end justify-center gap-1 h-8" aria-hidden>
      {heights.map((h, i) => (
        <div
          key={i}
          className={`w-1.5 rounded-full bg-indigo-400 ${active ? '' : 'opacity-30'}`}
          style={
            active
              ? { height: `${h}px`, animation: `shadow-wave 0.9s ease-in-out ${i * 90}ms infinite` }
              : { height: '6px' }
          }
        />
      ))}
    </div>
  )
}

// ── 단일 문장 연습 카드 ──────────────────────────────────────────────────────
function ShadowItem({
  sentence,
  index,
  total,
  onDone,
}: {
  sentence: DictationSentence
  index: number
  total: number
  onDone: (reviewed: boolean) => void
}) {
  const { t } = useLang()
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [micBlocked, setMicBlocked] = useState(false)
  const [scoreNonce, setScoreNonce] = useState(0) // 녹음 시작 시 증가 → AI 채점 자동 트리거

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const canRecord = recordingSupported()

  // 원어민 음원 재생 (audioRef 공유 → 내 목소리와 배타 재생)
  const play = useCallback((r = 1) => {
    audioRef.current?.pause()
    const a = new Audio(sentence.audioUrl)
    a.playbackRate = r
    a.onplay = () => setPlaying(true)
    a.onended = () => setPlaying(false)
    a.onpause = () => setPlaying(false)
    audioRef.current = a
    playExclusive(a) // 페이지 전체 배타 재생
  }, [sentence.audioUrl])

  // 진입 시 자동 1회 재생 + 언마운트 정리
  useEffect(() => {
    play()
    return () => {
      stopExclusive()
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
      streamRef.current?.getTracks().forEach(tr => tr.stop())
    }
  }, [play])

  // 녹음 URL 누수 방지
  useEffect(() => {
    return () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl) }
  }, [recordedUrl])

  const selectSpeed = (r: number) => {
    setRate(r)
    play(r)
  }

  const startRecording = async () => {
    stopExclusive() // 재생 중이면(원어민/내 목소리) 멈추고 녹음 시작
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null) }
    setMicBlocked(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        setRecordedUrl(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach(tr => tr.stop())
        streamRef.current = null
        setRecording(false)
      }
      mediaRecRef.current = rec
      rec.start()
      setRecording(true)
      setScoreNonce(n => n + 1) // 녹음과 동시에 AI 채점 시작(같은 발화를 채점·비교 둘 다)
    } catch {
      // 마이크 불가(권한 거부/Permissions-Policy 차단 등) — 듣기 + 자가 평가만.
      // 예전엔 조용히 삼켜서 사용자가 원인을 몰랐다. 이제 안내를 노출한다.
      setRecording(false)
      setMicBlocked(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
    else setRecording(false)
  }

  // 자가 평가 → 다음 문장으로. 섀도잉은 개인 복습에 기록을 남기지 않는다(사용자 요청).
  const markReview = () => { onDone(true) }
  const markGood = () => { onDone(false) }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <style>{`@keyframes shadow-wave { 0%,100% { transform: scaleY(0.4) } 50% { transform: scaleY(1) } }`}</style>

      {/* 진행 표시 */}
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{index + 1} / {total}</span>
      </div>

      {/* 목표 문장 + 파형 */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-6 text-center flex flex-col items-center gap-4">
        <Waveform active={playing} />
        <p className="text-xl font-medium leading-relaxed text-slate-900">{sentence.fullSentence}</p>
      </div>

      {/* 원어민 발음 듣기 — 배속을 누르면 그 속도로 원어민 음성을 들려준다 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold text-slate-700">🔊 {t('shadowing.listenNative')}</span>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-200 p-1" role="group" aria-label={t('shadowing.listenNative')}>
          {RATES.map(r => (
            <button
              key={r}
              onClick={() => selectSpeed(r)}
              aria-pressed={rate === r}
              className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition-colors ${
                rate === r ? 'bg-indigo-500 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      {/* 녹음 + 내 목소리 비교 */}
      {canRecord ? (
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full py-4 rounded-2xl text-white font-bold transition-all ${
              recording ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:opacity-90'
            }`}
          >
            {recording ? `⏹ ${t('shadowing.stop')}` : `🎤 ${t('shadowing.record')}`}
          </button>
          {recording && <p className="text-[11px] text-rose-500">🎙️ {t('shadowing.listening')}</p>}
          {recordedUrl && !recording && (
            <ShadowCompare key={recordedUrl} nativeSrc={sentence.audioUrl} mineSrc={recordedUrl} />
          )}
          {micBlocked && !recording && (
            <p className="text-[11px] text-rose-500 text-center max-w-xs leading-snug">🚫 {t('shadowing.micBlocked')}</p>
          )}
          {!recordedUrl && !recording && !micBlocked && (
            <p className="text-[11px] text-slate-500 text-center max-w-xs leading-snug">{t('shadowing.recordPrompt')}</p>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-slate-500 text-center max-w-xs leading-snug">{t('shadowing.recordPrompt')}</p>
      )}

      {/* AI 발음 채점 (Azure) — 녹음 버튼이 트리거, 같은 발화를 자동 채점 (프로덕션 숨김) */}
      {AI_SCORE_ENABLED && (
        <ShadowScore referenceText={sentence.fullSentence} triggerNonce={scoreNonce} hideButton />
      )}

      {/* 자가 평가 → 다음 (두 버튼 색상 통일) */}
      <div className="w-full flex items-center gap-3">
        <button
          onClick={markReview}
          className="flex-1 py-3.5 rounded-2xl border border-violet-300 bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 transition-colors text-sm"
        >
          {t('shadowing.needPractice')}
        </button>
        <button
          onClick={markGood}
          className="flex-1 py-3.5 rounded-2xl border border-violet-300 bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 transition-colors text-sm"
        >
          {t('shadowing.gotIt')}
        </button>
      </div>
    </div>
  )
}

// ── 초급: 최소 대립쌍 비교 연습 카드 ─────────────────────────────────────────
//   '고기 ↔ 거기' 처럼 헷갈리는 두(세) 소리를 번갈아 듣고, 따라 말하며 귀로 비교한다.
function ShadowPairItem({
  pair,
  index,
  total,
  onDone,
}: {
  pair: string[]
  index: number
  total: number
  onDone: (reviewed: boolean) => void
}) {
  const { t } = useLang()
  const [playingWord, setPlayingWord] = useState<string | null>(null)
  const [alternating, setAlternating] = useState(false)
  const [rate, setRate] = useState(1)
  const [recording, setRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [micBlocked, setMicBlocked] = useState(false)
  const [target, setTarget] = useState<string>(pair[0]) // AI 채점 대상 단어
  const [scoreNonce, setScoreNonce] = useState(0) // 녹음 시작 시 증가 → 채점 트리거

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const seqTimer = useRef<number | null>(null)
  const cancelledRef = useRef(false)
  const mediaRecRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const canRecord = recordingSupported()

  // 모든 재생/시퀀스 중단
  const stopAll = useCallback(() => {
    cancelledRef.current = true
    if (seqTimer.current) { clearTimeout(seqTimer.current); seqTimer.current = null }
    stopExclusive()
    setAlternating(false)
    setPlayingWord(null)
  }, [])

  // 한 단어 재생
  const playWord = useCallback((word: string, r = rate) => {
    stopAll()
    cancelledRef.current = false
    const a = new Audio(wordAudioUrl(word))
    a.playbackRate = r
    a.onplay = () => setPlayingWord(word)
    a.onended = () => setPlayingWord(null)
    a.onpause = () => setPlayingWord(null)
    audioRef.current = a
    playExclusive(a)
  }, [rate, stopAll])

  // 번갈아 재생 — pair 를 2회 순회하며 소리를 대비시킨다
  const alternate = useCallback((r = rate) => {
    stopAll()
    cancelledRef.current = false
    setAlternating(true)
    const seq = [...pair, ...pair]
    let i = 0
    const next = () => {
      if (cancelledRef.current) return
      if (i >= seq.length) { setAlternating(false); setPlayingWord(null); return }
      const word = seq[i++]
      const a = new Audio(wordAudioUrl(word))
      a.playbackRate = r
      a.onplay = () => setPlayingWord(word)
      a.onended = () => {
        setPlayingWord(null)
        if (!cancelledRef.current) seqTimer.current = window.setTimeout(next, 380)
      }
      audioRef.current = a
      playExclusive(a)
    }
    next()
  }, [pair, rate, stopAll])

  // 진입 시 한 번 번갈아 들려주기 + 언마운트 정리
  useEffect(() => {
    alternate()
    return () => {
      stopAll()
      if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
      streamRef.current?.getTracks().forEach(tr => tr.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => { if (recordedUrl) URL.revokeObjectURL(recordedUrl) }
  }, [recordedUrl])

  const startRecording = async () => {
    stopAll()
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); setRecordedUrl(null) }
    setMicBlocked(false)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const rec = new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })
        setRecordedUrl(URL.createObjectURL(blob))
        streamRef.current?.getTracks().forEach(tr => tr.stop())
        streamRef.current = null
        setRecording(false)
      }
      mediaRecRef.current = rec
      rec.start()
      setRecording(true)
      setScoreNonce(n => n + 1) // 녹음과 동시에 목표 단어 AI 채점 시작
    } catch {
      setRecording(false)
      setMicBlocked(true)
    }
  }

  const stopRecording = () => {
    if (mediaRecRef.current?.state === 'recording') mediaRecRef.current.stop()
    else setRecording(false)
  }

  const playMine = () => {
    if (!recordedUrl) return
    stopAll()
    const a = new Audio(recordedUrl)
    audioRef.current = a
    playExclusive(a)
  }

  // 섀도잉은 개인 복습에 기록을 남기지 않는다(사용자 요청) — 자가 평가는 진행 흐름에만 쓴다.
  const markReview = () => { onDone(true) }
  const markGood = () => { onDone(false) }

  return (
    <div className="w-full max-w-md flex flex-col items-center gap-6">
      <style>{`@keyframes shadow-wave { 0%,100% { transform: scaleY(0.4) } 50% { transform: scaleY(1) } }`}</style>

      {/* 진행 표시 */}
      <div className="w-full flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(index / total) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-500 shrink-0">{index + 1} / {total}</span>
      </div>

      {/* 대립쌍 비교 카드 — 단어를 탭하면 개별 재생 */}
      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-6 flex flex-col items-center gap-4">
        <Waveform active={playingWord !== null} />
        <div className={`grid w-full gap-3 ${pair.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {pair.map(word => (
            <button
              key={word}
              onClick={() => { playWord(word); setTarget(word) }}
              translate="no"
              className={`notranslate relative rounded-2xl border-2 py-5 text-2xl font-black transition-all ${
                playingWord === word
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 scale-105'
                  : target === word
                    ? 'border-indigo-400 bg-indigo-50/50 text-slate-800'
                    : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              {target === word && (
                <span className="absolute top-1.5 right-2 text-[10px] font-bold text-indigo-500">🎯</span>
              )}
              {word}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 text-center">{t('shadowing.pairScoreTargetHint')}</p>
      </div>

      {/* 번갈아 듣기 + 배속 */}
      <div className="w-full flex flex-col items-center gap-3">
        <button
          onClick={alternating ? stopAll : () => alternate()}
          className={`w-full py-3.5 rounded-2xl font-bold transition-colors ${
            alternating ? 'bg-slate-200 text-slate-700' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:opacity-90'
          }`}
        >
          {alternating ? `⏹ ${t('shadowing.pairStop')}` : `🔁 ${t('shadowing.pairAlternate')}`}
        </button>
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-200 p-1" role="group" aria-label={t('shadowing.listenNative')}>
          {RATES.map(r => (
            <button
              key={r}
              onClick={() => setRate(r)}
              aria-pressed={rate === r}
              className={`rounded-full px-3 py-1.5 text-sm font-bold tabular-nums transition-colors ${
                rate === r ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      {/* 녹음 + 내 목소리 듣기 */}
      {canRecord ? (
        <div className="w-full flex flex-col items-center gap-3">
          <button
            onClick={recording ? stopRecording : startRecording}
            className={`w-full py-4 rounded-2xl text-white font-bold transition-all ${
              recording ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90'
            }`}
          >
            {recording ? `⏹ ${t('shadowing.stop')}` : `🎤 ${t('shadowing.record')}`}
          </button>
          {recording && <p className="text-[11px] text-rose-500">🎙️ {t('shadowing.listening')}</p>}
          {recordedUrl && !recording && (
            <button
              onClick={playMine}
              className="w-full py-3 rounded-2xl border border-emerald-300 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors text-sm"
            >
              ▶ {t('shadowing.myVoice')}
            </button>
          )}
          {micBlocked && !recording && (
            <p className="text-[11px] text-rose-500 text-center max-w-xs leading-snug">🚫 {t('shadowing.micBlocked')}</p>
          )}
          {!recordedUrl && !recording && !micBlocked && (
            <p className="text-[11px] text-slate-500 text-center max-w-xs leading-snug">{t('shadowing.pairRecordPrompt')}</p>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-slate-500 text-center max-w-xs leading-snug">{t('shadowing.pairRecordPrompt')}</p>
      )}

      {/* AI 발음 채점 — 선택한 목표 단어 기준, 녹음 버튼이 트리거 (프로덕션 숨김) */}
      {AI_SCORE_ENABLED && canRecord && (
        <div className="w-full flex flex-col items-center gap-2">
          <p className="text-[11px] text-slate-500 text-center">
            🎯 {t('shadowing.scoreTargetWord')}:{' '}
            <span translate="no" className="notranslate font-bold text-indigo-600">{target}</span>
          </p>
          <ShadowScore referenceText={target} triggerNonce={scoreNonce} hideButton />
        </div>
      )}

      {/* 자가 평가 → 다음 */}
      <div className="w-full flex items-center gap-3">
        <button
          onClick={markReview}
          className="flex-1 py-3.5 rounded-2xl border border-violet-300 bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 transition-colors text-sm"
        >
          {t('shadowing.needPractice')}
        </button>
        <button
          onClick={markGood}
          className="flex-1 py-3.5 rounded-2xl border border-violet-300 bg-violet-50 text-violet-700 font-bold hover:bg-violet-100 transition-colors text-sm"
        >
          {t('shadowing.gotIt')}
        </button>
      </div>
    </div>
  )
}
