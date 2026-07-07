// src/pages/QuizStudioPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 🎛️ 운영자 퀴즈 스튜디오 — AI 초안 생성 → 검수/수정 → 배포
//
//   흐름:
//     1) 유튜브 URL + 자막(스크립트) 붙여넣기 → "AI 퀴즈 생성"
//     2) /api/generate-quiz 가 베테랑 교사 프롬프트로 초안 생성
//     3) 각 문항을 카드에서 직접 수정 + 구간 미리듣기로 타이밍 확인
//     4) "초안 저장" (Firestore draft) → "배포" (published — 학습자에게 공개)
//
//   접근 제한: ADMIN_EMAIL 로그인 시에만 렌더링
//   자막 얻는 법: 유튜브 영상 → 설명 더보기 → "스크립트 표시" → 전체 복사
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import {
  loadDraft,
  loadPublishedQuizzes,
  publishQuizzes,
  saveDraft,
  unpublishQuizzes,
  type QuizItem,
} from '@/lib/quizStore'

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

export default function QuizStudioPage() {
  const { user } = useAuth()
  const isAdmin = Boolean(user && user.email === ADMIN_EMAIL)

  const [videoUrl, setVideoUrl] = useState('')
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])

  const [transcript, setTranscript] = useState('')
  const [count, setCount] = useState(8)

  const [items, setItems] = useState<QuizItem[]>([])
  const [publishedCount, setPublishedCount] = useState<number | null>(null)

  const [busy, setBusy] = useState<'' | 'generate' | 'save' | 'publish' | 'unpublish'>('')
  const [notice, setNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  // 구간 미리듣기: iframe src 를 갈아끼우는 방식 (IFrame API 불필요)
  const [previewSrc, setPreviewSrc] = useState('')

  const say = (kind: 'ok' | 'err', text: string) => {
    setNotice({ kind, text })
    if (kind === 'ok') setTimeout(() => setNotice(null), 4000)
  }

  // videoId 가 정해지면 기존 초안/배포 상태 로드
  useEffect(() => {
    if (!videoId || !isAdmin) return
    let cancelled = false
    Promise.all([loadDraft(videoId), loadPublishedQuizzes(videoId)])
      .then(([draft, published]) => {
        if (cancelled) return
        if (draft && draft.length) setItems(draft)
        setPublishedCount(published ? published.length : 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [videoId, isAdmin])

  // ── AI 초안 생성 ───────────────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!user || !videoId) return
    setBusy('generate')
    setNotice(null)
    try {
      const idToken = await user.getIdToken()
      const r = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ videoId, transcript, count }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`)
      setItems(data.quizzes)
      say('ok', `퀴즈 초안 ${data.quizzes.length}개가 생성되었습니다. 검수 후 저장/배포하세요.`)
    } catch (e) {
      say('err', e instanceof Error ? e.message : String(e))
    } finally {
      setBusy('')
    }
  }, [user, videoId, transcript, count])

  // ── 문항 편집 헬퍼 ─────────────────────────────────────────────────────────
  const update = (i: number, patch: Partial<QuizItem>) =>
    setItems((prev) => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)))
  const remove = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i))
  const addEmpty = () =>
    setItems((prev) => [
      ...prev,
      {
        id: `${videoId.slice(0, 6).toLowerCase()}_${String(prev.length + 1).padStart(2, '0')}`,
        videoId,
        startTime: 0,
        endTime: 4,
        fullSentence: '',
        blankWord: '',
        explanation: '',
        hasHardcodedSubs: true,
      },
    ])

  const previewSegment = (q: QuizItem) => {
    setPreviewSrc(
      `https://www.youtube.com/embed/${q.videoId}?start=${Math.floor(q.startTime)}&end=${Math.ceil(
        q.endTime,
      )}&autoplay=1&rel=0`,
    )
  }

  // 배포/저장 전 검증
  const problems = useMemo(
    () =>
      items
        .map((q, i) => {
          if (!q.fullSentence.trim()) return `#${i + 1}: 전체 문장이 비어 있음`
          if (!q.blankWord.trim()) return `#${i + 1}: 빈칸 단어가 비어 있음`
          if (!q.fullSentence.includes(q.blankWord))
            return `#${i + 1}: 빈칸 "${q.blankWord}" 이(가) 전체 문장에 없음 (띄어쓰기 확인)`
          if (q.endTime <= q.startTime) return `#${i + 1}: 종료 시간이 시작 시간보다 빠름`
          return null
        })
        .filter(Boolean) as string[],
    [items],
  )

  const persist = useCallback(
    async (mode: 'save' | 'publish' | 'unpublish') => {
      if (!videoId) return
      if (mode !== 'unpublish' && problems.length) {
        say('err', '수정이 필요합니다: ' + problems[0])
        return
      }
      setBusy(mode)
      try {
        if (mode === 'save') {
          await saveDraft(videoId, items)
          say('ok', '초안이 저장되었습니다 (학습자에게는 아직 비공개).')
        } else if (mode === 'publish') {
          await publishQuizzes(videoId, items)
          setPublishedCount(items.length)
          say('ok', `🎉 배포 완료! 이제 /kpop-quiz/${videoId} 에서 이 퀴즈가 보입니다.`)
        } else {
          await unpublishQuizzes(videoId)
          setPublishedCount(0)
          say('ok', '배포가 취소되었습니다.')
        }
      } catch (e) {
        say('err', e instanceof Error ? e.message : String(e))
      } finally {
        setBusy('')
      }
    },
    [videoId, items, problems],
  )

  // ── 접근 제한 ──────────────────────────────────────────────────────────────
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
          유튜브 자막을 붙여넣으면 AI가 베테랑 교사 수준의 퀴즈 초안을 만듭니다. 검수·수정 후 배포하세요.
        </p>
      </header>

      {/* ── STEP 1: 영상 + 자막 입력 ── */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-500">Step 1 · 영상과 자막</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
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
          <label className="text-xs font-semibold text-slate-500">
            생성할 퀴즈 수
            <select className={`mt-1 ${field}`} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {[3, 5, 8, 10, 12, 15].map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="mt-3 block text-xs font-semibold text-slate-500">
          자막 (유튜브 → 더보기 → &ldquo;스크립트 표시&rdquo; → 전체 복사해서 붙여넣기 · 타임스탬프 포함)
          <textarea
            rows={8}
            className={`mt-1 ${field} font-mono text-xs`}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={'0:05\n안녕하세요 여러분\n0:08\n오늘은 같이 요리를 해볼 거예요\n...'}
          />
        </label>

        <button
          onClick={generate}
          disabled={!videoId || transcript.trim().length < 50 || busy !== ''}
          className="mt-4 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy === 'generate' ? '⏳ AI가 퀴즈를 만드는 중… (최대 2~3분)' : '✨ AI 퀴즈 생성'}
        </button>
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

      {/* ── 구간 미리듣기 플레이어 ── */}
      {previewSrc && (
        <section className="mt-6 overflow-hidden rounded-2xl bg-black shadow-lg">
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

      {/* ── STEP 2: 초안 검수/수정 ── */}
      {items.length > 0 && (
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-indigo-500">
              Step 2 · 검수 및 수정 ({items.length}문항)
            </h2>
            <button
              onClick={addEmpty}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              + 문항 추가
            </button>
          </div>

          <ul className="mt-3 space-y-4">
            {items.map((q, i) => {
              const blankOk = !q.blankWord || q.fullSentence.includes(q.blankWord)
              return (
                <li key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400">
                      #{i + 1} · <span className="font-mono">{q.id}</span>
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

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    <label className="col-span-2 flex items-end gap-2 pb-2 text-xs font-semibold text-slate-500">
                      <input
                        type="checkbox"
                        checked={q.hasHardcodedSubs}
                        onChange={(e) => update(i, { hasHardcodedSubs: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                      />
                      영상에 박힌 자막 있음 (하단 블라인드 표시)
                    </label>
                  </div>

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
                    빈칸 단어 (전체 문장 안의 글자와 띄어쓰기가 정확히 일치해야 함)
                    <input
                      translate="no"
                      className={`mt-1 notranslate ${field} ${!blankOk ? 'border-red-400 bg-red-50' : ''}`}
                      value={q.blankWord}
                      onChange={(e) => update(i, { blankWord: e.target.value })}
                    />
                    {!blankOk && (
                      <span className="mt-1 block text-xs font-medium text-red-500">
                        ⚠️ 전체 문장에서 이 구절을 찾을 수 없습니다
                      </span>
                    )}
                  </label>

                  <label className="mt-2 block text-xs font-semibold text-slate-500">
                    해설 (비우면 해설창 숨김 · 줄바꿈 유지)
                    <textarea
                      rows={4}
                      className={`mt-1 ${field} whitespace-pre-wrap`}
                      value={q.explanation}
                      onChange={(e) => update(i, { explanation: e.target.value })}
                    />
                  </label>
                </li>
              )
            })}
          </ul>

          {/* ── STEP 3: 저장/배포 ── */}
          <div className="sticky bottom-4 mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            {problems.length > 0 && (
              <span className="w-full text-xs font-semibold text-amber-600">⚠️ {problems[0]}</span>
            )}
            <button
              onClick={() => persist('save')}
              disabled={busy !== ''}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-40"
            >
              {busy === 'save' ? '저장 중…' : '💾 초안 저장'}
            </button>
            <button
              onClick={() => persist('publish')}
              disabled={busy !== '' || problems.length > 0}
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
      )}
    </div>
  )
}
