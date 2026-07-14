// src/pages/QuizStudioPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🎛️ 운영자 퀴즈 스튜디오 — 모드별(B/I/A) 게임 제작 + AI 초안 생성 → 검수 → 배포
//
//   모드:
//     · B (Beginner · 어순 맞히기)   : 절 단위 블록의 정답 순서 (blocks[])
//     · I (Intermediate · 의미 이해) : 들은 문장 + 의미 보기 4개 + 정답 인덱스
//     · A (Advanced · 빈칸 받아쓰기) : 전체 문장 + 빈칸 절 (기존) — AI 초안 생성 지원
//
//   흐름:
//     1) 유튜브 URL 입력 → 기존 초안/배포본(전 모드) 로드
//     2) 모드 탭 선택 → 해당 모드 문항 편집 (A 는 자막 붙여넣어 AI 생성 가능)
//     3) "초안 저장"(draft) / "배포"(published) — 모드 단위 병합이라 다른 모드 보존
//
//   접근 제한: ADMIN_EMAIL 로그인 시에만 렌더링
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  loadDraft,
  loadPublishedQuizzes,
  saveModeItems,
  unpublishModeItems,
  itemMode,
  type QuizItem,
} from '@/lib/quizStore'
import type { GameMode } from '@/data/kArtistLive'
import ClauseChunker, { splitWords } from '@/components/admin/ClauseChunker'

const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'

// youtu.be / watch?v= / embed / 맨 ID 모두 지원
function extractVideoId(url: string): string {
  if (!url) return ''
  const patterns = [/(?:youtu\.be\/)([\w-]{11})/, /(?:v=)([\w-]{11})/, /(?:embed\/)([\w-]{11})/]
  for (const re of patterns) {
    const m = url.match(re)
    if (m) return m[1]
  }
  return /^[\w-]{11}$/.test(url.trim()) ? url.trim() : ''
}

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400'

// 동적 Tailwind 클래스는 purge 되므로 모드별 정적 클래스 문자열을 미리 지정
const MODES: {
  key: GameMode
  label: string
  sub: string
  tabActive: string
  chipActive: string
}[] = [
  {
    key: 'B',
    label: 'Beginner',
    sub: '어순 맞히기',
    tabActive: 'border-emerald-400 bg-emerald-50',
    chipActive: 'border-emerald-300 bg-emerald-100 text-emerald-700',
  },
  {
    key: 'I',
    label: 'Intermediate',
    sub: '의미 이해하기',
    tabActive: 'border-blue-400 bg-blue-50',
    chipActive: 'border-blue-300 bg-blue-100 text-blue-700',
  },
  {
    key: 'A',
    label: 'Advanced',
    sub: '빈칸 받아쓰기',
    tabActive: 'border-purple-400 bg-purple-50',
    chipActive: 'border-purple-300 bg-purple-100 text-purple-700',
  },
]

// 새 빈 문항 (모드별 기본 필드)
function emptyItem(videoId: string, mode: GameMode, seq: number): QuizItem {
  const base: QuizItem = {
    id: `${videoId.slice(0, 6).toLowerCase()}_${mode.toLowerCase()}${String(seq).padStart(2, '0')}`,
    videoId,
    mode,
    startTime: 0,
    endTime: 4,
    fullSentence: '',
    explanation: '',
    hasHardcodedSubs: true,
    initialSpeed: 0.75,
  }
  if (mode === 'A') return { ...base, blankWord: '', hint: '' }
  if (mode === 'B') return { ...base, blocks: [] }
  return { ...base, options: ['', '', '', ''], correctIndex: 0 }
}

// 모드별 검증 — 문제 문자열 or null
function itemProblem(q: QuizItem, i: number): string | null {
  const tag = `#${i + 1}`
  if (q.endTime <= q.startTime) return `${tag}: 종료 시간이 시작 시간보다 빨라요`
  const m = itemMode(q)
  if (m === 'A') {
    if (!q.fullSentence.trim()) return `${tag}(A): 전체 문장이 비어 있어요`
    if (!q.blankWord || !q.blankWord.trim()) return `${tag}(A): 빈칸 단어가 비어 있어요`
    if (!q.fullSentence.includes(q.blankWord)) return `${tag}(A): 빈칸이 전체 문장에 없어요 (띄어쓰기 확인)`
  } else if (m === 'B') {
    if (!q.blocks || q.blocks.length < 2) return `${tag}(B): 블록이 2개 이상 필요해요 (문장 입력 후 절 묶기)`
  } else if (m === 'I') {
    if (!q.fullSentence.trim()) return `${tag}(I): 듣기 대상 문장이 비어 있어요`
    if (!q.options || q.options.length !== 4 || q.options.some((o) => !o.trim()))
      return `${tag}(I): 의미 보기 4개를 모두 입력하세요`
  }
  return null
}

export default function QuizStudioPage() {
  const { user } = useAuth()
  const isAdmin = Boolean(user && user.email === ADMIN_EMAIL)

  const [videoUrl, setVideoUrl] = useState('')
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])

  const [transcript, setTranscript] = useState('')
  const [count, setCount] = useState(20)

  const [items, setItems] = useState<QuizItem[]>([]) // 전 모드 문항
  const [activeMode, setActiveMode] = useState<GameMode>('A')
  const [publishedCount, setPublishedCount] = useState<number | null>(null)

  const [busy, setBusy] = useState<'' | 'generate' | 'save' | 'publish' | 'unpublish'>('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [previewSrc, setPreviewSrc] = useState('')

  const say = (kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text })
    if (kind === 'ok') setTimeout(() => setNotice(null), 4000)
  }

  // videoId 확정 → 기존 초안/배포본(전 모드) 로드
  useEffect(() => {
    if (!videoId || !isAdmin) return
    let cancelled = false
    Promise.all([loadDraft(videoId), loadPublishedQuizzes(videoId)])
      .then(([draft, published]) => {
        if (cancelled) return
        // 초안이 있으면 초안, 없으면 배포본을 편집 시작점으로 사용 (다른 모드 유실 방지)
        const seed = draft && draft.length ? draft : published || []
        setItems(seed)
        setPublishedCount(published ? published.length : 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [videoId, isAdmin])

  // ── AI 초안 생성 (A 모드 · 딕테이션 전용) ────────────────────────────────────
  const generate = useCallback(async () => {
    if (!user || !videoId) return
    setBusy('generate')
    setNotice(null)
    try {
      const idToken = await user.getIdToken()
      const r = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ videoId, transcript, count }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
      const aItems: QuizItem[] = (data.quizzes as QuizItem[]).map((q) => ({ ...q, mode: 'A' as const }))
      // 기존 B/I 문항은 보존하고 A 문항만 교체
      setItems((prev) => [...prev.filter((q) => itemMode(q) !== 'A'), ...aItems])
      setActiveMode('A')
      say('ok', `A(빈칸) 초안 ${aItems.length}개 생성 완료. 검수 후 저장/배포하세요.`)
    } catch (e) {
      say('err', e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }, [user, videoId, transcript, count])

  // ── 문항 편집 헬퍼 (flat index 기준) ─────────────────────────────────────────
  const update = (i: number, patch: Partial<QuizItem>) =>
    setItems((prev) => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const remove = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i))
  const addItem = () =>
    setItems((prev) => {
      const seq = prev.filter((q) => itemMode(q) === activeMode).length + 1
      return [...prev, emptyItem(videoId, activeMode, seq)]
    })

  const previewSegment = (q: QuizItem) => {
    setPreviewSrc(
      `https://www.youtube.com/embed/${q.videoId}?start=${Math.floor(q.startTime)}&end=${Math.ceil(
        q.endTime,
      )}&autoplay=1&rel=0`,
    )
  }

  // 전체 검증 + 현재 모드 문항(원본 인덱스 유지)
  const problems = useMemo(
    () => items.map((q, i) => itemProblem(q, i)).filter(Boolean) as string[],
    [items],
  )
  const shown = useMemo(
    () => items.map((q, i) => ({ q, i })).filter(({ q }) => itemMode(q) === activeMode),
    [items, activeMode],
  )
  const modeCounts = useMemo(() => {
    const c: Record<GameMode, number> = { B: 0, I: 0, A: 0 }
    for (const q of items) c[itemMode(q)]++
    return c
  }, [items])

  // ── 저장 / 배포 / 배포취소 (모드 단위 병합) ─────────────────────────────────
  const persist = useCallback(
    async (mode: 'save' | 'publish' | 'unpublish') => {
      if (!videoId) return
      if (mode !== 'unpublish' && problems.length) {
        say('err', '수정이 필요합니다: ' + problems[0])
        return
      }
      const presentModes = [...new Set(items.map(itemMode))] as GameMode[]
      setBusy(mode)
      try {
        if (mode === 'unpublish') {
          await unpublishModeItems(videoId, presentModes)
          setPublishedCount(0)
          say('ok', '배포가 취소되었습니다.')
        } else {
          await saveModeItems(videoId, presentModes, items, mode === 'publish')
          if (mode === 'publish') {
            setPublishedCount(items.length)
            say('ok', `🎉 배포 완료! /kpop-quiz/${videoId} 에서 ${presentModes.join('/')} 모드가 보입니다.`)
          } else {
            say('ok', '초안이 저장되었습니다 (학습자에게는 아직 비공개).')
          }
        }
      } catch (e) {
        say('err', e instanceof Error ? e.message : String(e))
      } finally {
        setBusy('')
      }
    },
    [videoId, items, problems],
  )

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-3 text-lg font-extrabold text-slate-900">운영자 전용 페이지</h1>
        <p className="mt-2 text-sm text-slate-500">관리자 계정으로 로그인해 주세요.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 text-slate-800">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">🎛️ 퀴즈 스튜디오</h1>
        <p className="mt-1 text-sm text-slate-500">
          한 영상에 <b>어순(B)·의미(I)·빈칸(A)</b> 세 가지 게임을 만들 수 있어요. 모드별로 만들고 함께 배포하세요.
        </p>
      </header>

      {/* ── STEP 1: 영상 ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-500">Step 1 · 영상</h2>
        <label className="mt-3 block text-xs font-semibold text-slate-500">
          유튜브 URL 또는 영상 ID
          <input
            className={`mt-1 ${field}`}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoUrl && !videoId && (
            <span className="mt-1 block text-xs font-medium text-amber-600">⚠️ 유효한 영상 ID를 찾지 못했습니다</span>
          )}
          {videoId && (
            <span className="mt-1 block text-xs font-medium text-emerald-600">
              ✔ videoId: {videoId}
              {publishedCount !== null &&
                (publishedCount > 0 ? ` · 현재 ${publishedCount}개 배포 중` : ' · 미배포')}
            </span>
          )}
        </label>
      </section>

      {/* 알림 */}
      {notice && (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
            notice.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {notice.text}
        </p>
      )}

      {videoId && (
        <>
          {/* ── STEP 2: 모드 선택 탭 ── */}
          <section className="mt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-500">Step 2 · 모드 선택</h2>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {MODES.map((m) => {
                const active = activeMode === m.key
                return (
                  <button
                    key={m.key}
                    onClick={() => setActiveMode(m.key)}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      active ? m.tabActive : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-black ${
                          active ? m.chipActive : 'border-slate-200 bg-slate-100 text-slate-500'
                        }`}
                      >
                        {m.key}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">{m.label}</span>
                      <span className="ml-auto text-[11px] font-bold text-slate-400">{modeCounts[m.key]}</span>
                    </div>
                    <p className="mt-1 text-[11px] font-semibold text-slate-500">{m.sub}</p>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── A 모드: AI 자막 생성 ── */}
          {activeMode === 'A' && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700">✨ AI 초안 생성 (빈칸 · 자막 필요)</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <label className="text-xs font-semibold text-slate-500 sm:col-span-3">
                  자막 (유튜브 → 더보기 → &ldquo;스크립트 표시&rdquo; → 전체 복사 · 타임스탬프 포함)
                  <textarea
                    rows={5}
                    className={`mt-1 ${field} font-mono text-xs`}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={'0:05\n안녕하세요 여러분\n0:08\n오늘은 같이 요리를 해볼 거예요\n...'}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  생성 개수
                  <select className={`mt-1 ${field}`} value={count} onChange={(e) => setCount(Number(e.target.value))}>
                    {[3, 5, 8, 10, 12, 15, 20].map((n) => (
                      <option key={n} value={n}>
                        {n}개
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={generate}
                    disabled={!videoId || transcript.trim().length < 50 || busy !== ''}
                    className="mt-2 w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busy === 'generate' ? '⏳ 생성 중…' : '✨ AI 생성'}
                  </button>
                </label>
              </div>
            </section>
          )}

          {/* ── 구간 미리듣기 ── */}
          {previewSrc && (
            <section className="mt-4 overflow-hidden rounded-2xl bg-black shadow-lg">
              <div className="relative aspect-video w-full">
                <iframe
                  key={previewSrc}
                  src={previewSrc}
                  title="segment preview"
                  allow="autoplay; encrypted-media"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </section>
          )}

          {/* ── STEP 3: 모드별 문항 편집 ── */}
          <section className="mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-500">
                Step 3 · {MODES.find((m) => m.key === activeMode)?.label} 문항 ({shown.length})
              </h2>
              <button
                onClick={addItem}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                + 문항 추가
              </button>
            </div>

            {shown.length === 0 && (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-400">
                이 모드의 문항이 아직 없어요. &ldquo;+ 문항 추가&rdquo;{activeMode === 'A' ? ' 또는 AI 생성' : ''}으로 시작하세요.
              </p>
            )}

            <ul className="mt-3 space-y-4">
              {shown.map(({ q, i }) => (
                <li key={q.id || i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400">
                      <span className="font-mono">{q.id}</span>
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => previewSegment(q)}
                        className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        ▶ 구간 미리듣기
                      </button>
                      <button
                        onClick={() => remove(i)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 공통: 구간/속도/자막 */}
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <label className="text-xs font-semibold text-slate-500">
                      시작 (초)
                      <input
                        type="number"
                        step="0.5"
                        className={`mt-1 ${field}`}
                        value={q.startTime}
                        onChange={(e) => update(i, { startTime: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">
                      종료 (초)
                      <input
                        type="number"
                        step="0.5"
                        className={`mt-1 ${field}`}
                        value={q.endTime}
                        onChange={(e) => update(i, { endTime: Number(e.target.value) })}
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-500">
                      재생 속도
                      <select
                        className={`mt-1 ${field}`}
                        value={q.initialSpeed ?? 0.75}
                        onChange={(e) => update(i, { initialSpeed: Number(e.target.value) })}
                      >
                        {[0.5, 0.75, 1.0].map((rate) => (
                          <option key={rate} value={rate}>
                            {rate.toFixed(2)}배{rate === 0.75 ? ' (기본)' : ''}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="col-span-2 flex items-end gap-2 pb-2 text-xs font-semibold text-slate-500">
                      <input
                        type="checkbox"
                        checked={q.hasHardcodedSubs ?? true}
                        onChange={(e) => update(i, { hasHardcodedSubs: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                      />
                      영상에 박힌 자막 있음 (하단 블라인드)
                    </label>
                  </div>

                  {/* ── A: 빈칸 받아쓰기 ── */}
                  {activeMode === 'A' && (
                    <>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        전체 문장 (한국어 원문)
                        <input
                          translate="no"
                          className={`mt-1 notranslate ${field}`}
                          value={q.fullSentence}
                          onChange={(e) => update(i, { fullSentence: e.target.value })}
                        />
                      </label>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        빈칸 절/단어 (전체 문장 안의 글자·띄어쓰기와 정확히 일치)
                        <input
                          translate="no"
                          className={`mt-1 notranslate ${field} ${
                            q.blankWord && !q.fullSentence.includes(q.blankWord) ? 'border-red-400 bg-red-50' : ''
                          }`}
                          value={q.blankWord ?? ''}
                          onChange={(e) => update(i, { blankWord: e.target.value })}
                        />
                      </label>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        힌트 (선택)
                        <textarea
                          rows={2}
                          className={`mt-1 ${field}`}
                          value={q.hint ?? ''}
                          onChange={(e) => update(i, { hint: e.target.value })}
                        />
                      </label>
                    </>
                  )}

                  {/* ── B: 어순 맞히기 (절 블록) ── */}
                  {activeMode === 'B' && (
                    <>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        전체 문장 (입력 후 아래에서 절 단위로 묶기 — 블록 순서 = 정답 순서)
                        <input
                          translate="no"
                          className={`mt-1 notranslate ${field}`}
                          value={q.fullSentence}
                          onChange={(e) =>
                            update(i, { fullSentence: e.target.value, blocks: splitWords(e.target.value) })
                          }
                          placeholder="예: 물 좀 갖다 주시겠어요?"
                        />
                      </label>
                      <div className="mt-2">
                        <ClauseChunker
                          chunks={q.blocks ?? []}
                          onChange={(next) => update(i, { blocks: next, fullSentence: next.join(' ') })}
                        />
                      </div>
                    </>
                  )}

                  {/* ── I: 의미 이해하기 (4지선다) ── */}
                  {activeMode === 'I' && (
                    <>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        듣기 대상 문장 (한국어 원문)
                        <input
                          translate="no"
                          className={`mt-1 notranslate ${field}`}
                          value={q.fullSentence}
                          onChange={(e) => update(i, { fullSentence: e.target.value })}
                        />
                      </label>
                      <p className="mt-2 text-xs font-semibold text-slate-500">의미 보기 4개 (라디오로 정답 선택)</p>
                      {[0, 1, 2, 3].map((oi) => {
                        const opts = q.options ?? ['', '', '', '']
                        return (
                          <div key={oi} className="mt-1.5 flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={(q.correctIndex ?? 0) === oi}
                              onChange={() => update(i, { correctIndex: oi })}
                              className="h-4 w-4 accent-indigo-600"
                            />
                            <input
                              className={field}
                              value={opts[oi] ?? ''}
                              onChange={(e) =>
                                update(i, { options: opts.map((o, k) => (k === oi ? e.target.value : o)) })
                              }
                              placeholder={`보기 ${String.fromCharCode(65 + oi)}`}
                            />
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* 공통: 해설 */}
                  <label className="mt-2 block text-xs font-semibold text-slate-500">
                    해설 (비우면 해설창 숨김 · 줄바꿈 유지)
                    <textarea
                      rows={3}
                      className={`mt-1 ${field} whitespace-pre-wrap`}
                      value={typeof q.explanation === 'string' ? q.explanation : JSON.stringify(q.explanation ?? '')}
                      onChange={(e) => update(i, { explanation: e.target.value })}
                    />
                  </label>
                </li>
              ))}
            </ul>

            {/* ── STEP 4: 저장/배포 ── */}
            <div className="sticky bottom-4 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              {problems.length > 0 && (
                <span className="w-full text-xs font-semibold text-amber-600">⚠️ {problems[0]}</span>
              )}
              <span className="w-full text-[11px] font-medium text-slate-400">
                저장/배포 시 B·I·A 전 모드가 함께 반영됩니다 (총 {items.length}문항)
              </span>
              <button
                onClick={() => persist('save')}
                disabled={busy !== '' || items.length === 0}
                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-40"
              >
                {busy === 'save' ? '저장 중…' : '💾 초안 저장'}
              </button>
              <button
                onClick={() => persist('publish')}
                disabled={busy !== '' || problems.length > 0 || items.length === 0}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-40"
              >
                {busy === 'publish' ? '배포 중…' : '🚀 배포 (학습자에게 공개)'}
              </button>
              {publishedCount !== null && publishedCount > 0 && (
                <button
                  onClick={() => persist('unpublish')}
                  disabled={busy !== ''}
                  className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-100 disabled:opacity-40"
                >
                  배포 취소
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
