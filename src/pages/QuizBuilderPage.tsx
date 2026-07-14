// src/pages/QuizBuilderPage.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 멀티 모드(B/I/A) 퀴즈 데이터 입력 대시보드 — 운영자 전용 CMS (/quiz-builder)
//   Step 1  영상 메타데이터: URL(→videoId 자동 추출) · 아티스트 · 제목
//   Step 2  모드 토글: B/I/A 활성화 + 모드별 세부 난이도(1~3성) — 9-tier
//   Step 3  모드별 동적 입력 폼
//     [B] 문장 입력 → ClauseChunker 로 절 단위 블록 구성 (블록 순서 = 정답 순서)
//     [I] 듣기 대상 문장 + 의미 보기 4개 + 정답 라디오
//     [A] 별점 선택 + 문장 입력 → 절 블록을 클릭해 빈칸(blank) 지정 + 힌트
//   출력: JSON(복사) + Firestore 저장(초안)/배포 — 모드 단위 병합이라 다른 모드 보존
//   접근 제한: ADMIN_EMAIL 로그인 시에만 렌더링
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/auth'
import { ARTISTS, MODE_ORDER, type GameMode } from '@/data/kArtistLive'
import { loadDraft, saveModeItems, itemMode, type QuizItem } from '@/lib/quizStore'
import { ModeChip } from '@/components/kartist/ui'
import ClauseChunker, { splitWords } from '@/components/admin/ClauseChunker'

const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'
const ARTIST_OPTIONS = ARTISTS.filter(a => a !== '__all__')

// URL 에서 videoId 추출 (youtu.be / watch?v= / embed / 11자 ID 모두 지원)
function extractVideoId(url: string): string {
  if (!url) return ''
  for (const re of [/(?:youtu\.be\/)([\w-]{11})/, /(?:v=)([\w-]{11})/, /(?:embed\/)([\w-]{11})/]) {
    const m = url.match(re)
    if (m) return m[1]
  }
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim()
  return ''
}

// ── 모드별 편집 초안 모델 ────────────────────────────────────────────────────
interface ItemDraft {
  start: string
  end: string
  sentence: string
  chunks: string[] // B/A: 절 블록
  blank: string // A: 빈칸으로 지정된 절
  hint: string // A
  options: string[] // I: 보기 4개
  correct: number // I: 정답 인덱스
  explanation: string
  subs: boolean // 하드코딩 자막 블라인드
}

const emptyDraft = (): ItemDraft => ({
  start: '',
  end: '',
  sentence: '',
  chunks: [],
  blank: '',
  hint: '',
  options: ['', '', '', ''],
  correct: 0,
  explanation: '',
  subs: true,
})

// 배포/저장된 QuizItem → 편집 초안으로 역변환
function itemToDraft(q: QuizItem): ItemDraft {
  return {
    start: String(q.startTime ?? ''),
    end: String(q.endTime ?? ''),
    sentence: q.fullSentence || '',
    chunks: Array.isArray(q.blocks) && q.blocks.length > 0 ? q.blocks : splitWords(q.fullSentence || ''),
    blank: q.blankWord || '',
    hint: q.hint || '',
    options:
      Array.isArray(q.options) && q.options.length === 4 ? [...q.options] : ['', '', '', ''],
    correct: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    explanation: typeof q.explanation === 'string' ? q.explanation : '',
    subs: q.hasHardcodedSubs !== false,
  }
}

// 편집 초안 → 배포용 QuizItem
function draftToItem(d: ItemDraft, mode: GameMode, videoId: string, n: number): QuizItem {
  const base = {
    id: `${videoId.slice(0, 6).toLowerCase()}_${mode.toLowerCase()}${String(n + 1).padStart(2, '0')}`,
    videoId,
    mode,
    startTime: Number(d.start) || 0,
    endTime: Number(d.end) || 0,
    explanation: d.explanation,
    hasHardcodedSubs: d.subs,
  }
  if (mode === 'B') {
    return { ...base, fullSentence: d.chunks.join(' '), blocks: d.chunks }
  }
  if (mode === 'I') {
    return { ...base, fullSentence: d.sentence, options: d.options, correctIndex: d.correct }
  }
  return { ...base, fullSentence: d.chunks.join(' ') || d.sentence, blankWord: d.blank, hint: d.hint }
}

// 초안 검증 — 문제 목록 반환
function validateDraft(d: ItemDraft, mode: GameMode, idx: number): string[] {
  const tag = `[${mode}] #${idx + 1}`
  const problems: string[] = []
  const start = Number(d.start)
  const end = Number(d.end)
  if (!(end > start)) problems.push(`${tag}: 종료 시간이 시작 시간보다 커야 함`)
  if (mode === 'B') {
    if (d.chunks.length < 2) problems.push(`${tag}: 블록이 2개 이상 필요 (문장 입력 후 절 묶기)`)
  } else if (mode === 'I') {
    if (!d.sentence.trim()) problems.push(`${tag}: 듣기 대상 문장이 비어 있음`)
    if (d.options.some(o => !o.trim())) problems.push(`${tag}: 의미 보기 4개를 모두 입력`)
  } else {
    const full = d.chunks.join(' ')
    if (!full.trim()) problems.push(`${tag}: 문장이 비어 있음`)
    if (!d.blank.trim()) problems.push(`${tag}: 빈칸으로 지정된 절이 없음 (블록 클릭)`)
    else if (!full.includes(d.blank)) problems.push(`${tag}: 빈칸 절이 문장에 없음`)
  }
  return problems
}

const MODE_LABEL: Record<GameMode, string> = {
  B: 'Beginner — 블록 배열 (절 순서 맞추기)',
  I: 'Intermediate — 의미 고르기 (4지선다)',
  A: 'Advanced — 딕테이션 (절 빈칸)',
}

const field =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400'

export default function QuizBuilderPage() {
  const { user } = useAuth()
  const isAdmin = Boolean(user && user.email === ADMIN_EMAIL)

  // Step 1 — 영상 메타데이터
  const [videoUrl, setVideoUrl] = useState('')
  const videoId = useMemo(() => extractVideoId(videoUrl), [videoUrl])
  const [artist, setArtist] = useState<string>(ARTIST_OPTIONS[0])
  const [titleEn, setTitleEn] = useState('')
  const [titleKo, setTitleKo] = useState('')

  // Step 2 — 모드 토글 + 모드별 별점 (9-tier)
  const [enabled, setEnabled] = useState<Record<GameMode, boolean>>({ B: false, I: false, A: true })
  const [modeStars, setModeStars] = useState<Record<GameMode, number>>({ B: 1, I: 2, A: 2 })

  // Step 3 — 모드별 문항 초안
  const [drafts, setDrafts] = useState<Record<GameMode, ItemDraft[]>>({ B: [], I: [], A: [] })
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const say = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text })
    setTimeout(() => setMsg(null), 5000)
  }

  // videoId 확정 시 기존 초안 로드 → 모드별 편집기에 시딩
  useEffect(() => {
    if (!videoId || !isAdmin) return
    let cancelled = false
    loadDraft(videoId)
      .then(items => {
        if (cancelled || !items || items.length === 0) return
        const next: Record<GameMode, ItemDraft[]> = { B: [], I: [], A: [] }
        for (const q of items) next[itemMode(q)].push(itemToDraft(q))
        setDrafts(next)
        setEnabled({ B: next.B.length > 0, I: next.I.length > 0, A: next.A.length > 0 })
        say('ok', `기존 초안 ${items.length}개를 불러왔습니다.`)
      })
      .catch(() => { /* 문서 없음 — 새로 작성 */ })
    return () => { cancelled = true }
  }, [videoId, isAdmin])

  const enabledModes = MODE_ORDER.filter(m => enabled[m])

  const updateDraft = useCallback((mode: GameMode, idx: number, patch: Partial<ItemDraft>) => {
    setDrafts(prev => ({
      ...prev,
      [mode]: prev[mode].map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }))
  }, [])

  const addDraft = (mode: GameMode) =>
    setDrafts(prev => ({ ...prev, [mode]: [...prev[mode], emptyDraft()] }))
  const removeDraft = (mode: GameMode, idx: number) =>
    setDrafts(prev => ({ ...prev, [mode]: prev[mode].filter((_, i) => i !== idx) }))

  // 산출물: 모드별 QuizItem + availableModes 스니펫
  const builtItems = useMemo(
    () =>
      enabledModes.flatMap(m => drafts[m].map((d, i) => draftToItem(d, m, videoId || 'unknown', i))),
    [enabledModes, drafts, videoId],
  )
  const availableModesSnippet = useMemo(
    () =>
      JSON.stringify(
        enabledModes.map(m => ({ mode: m, stars: modeStars[m] })),
      ),
    [enabledModes, modeStars],
  )
  const problems = useMemo(
    () => enabledModes.flatMap(m => drafts[m].flatMap((d, i) => validateDraft(d, m, i))),
    [enabledModes, drafts],
  )

  const exportJson = JSON.stringify(
    { videoId, artist, title: { en: titleEn, ko: titleKo }, availableModes: JSON.parse(availableModesSnippet), items: builtItems },
    null,
    2,
  )

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* ignore */ }
  }

  const persist = useCallback(
    async (publish: boolean) => {
      if (!videoId) return
      if (publish && problems.length > 0) {
        say('err', `배포 전 문제를 해결하세요: ${problems[0]} 외 ${problems.length - 1}건`)
        return
      }
      setBusy(publish ? 'publish' : 'save')
      try {
        await saveModeItems(videoId, enabledModes, builtItems, publish)
        say('ok', publish
          ? `🎉 배포 완료! ${enabledModes.join('/')} 모드 ${builtItems.length}문항이 /kpop-quiz/${videoId} 에 공개됩니다.`
          : `초안 저장 완료 (${builtItems.length}문항). 배포 전까지 학습자에게 보이지 않습니다.`)
      } catch (e) {
        say('err', `저장 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
      setBusy('')
    },
    [videoId, enabledModes, builtItems, problems],
  )

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center text-slate-500">
        <p className="text-4xl">🔒</p>
        <p className="mt-3 text-sm font-semibold">관리자 전용 페이지입니다.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 text-slate-800">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
        🛠️ 멀티 모드 퀴즈 빌더 <span className="text-indigo-600">B/I/A</span>
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        절(Clause) 단위 블록이 이 앱의 교육 정체성입니다 — 공백 단위 자동 분할이 아니라 ⊕ 로 직접 묶어주세요.
      </p>

      {msg && (
        <p
          className={`mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold ${
            msg.kind === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* ── Step 1: 영상 메타데이터 ─────────────────────────────────────── */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Step 1 · 영상 정보</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
            영상 URL 또는 ID
            <input className={`mt-1 ${field}`} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtu.be/..." />
            {videoUrl && !videoId && <span className="mt-1 block text-amber-600">⚠️ videoId 를 추출할 수 없습니다</span>}
            {videoId && <span className="mt-1 block text-emerald-600">✔ videoId: {videoId}</span>}
          </label>
          <label className="text-xs font-semibold text-slate-500">
            아티스트 (By Artist)
            <select className={`mt-1 ${field}`} value={artist} onChange={e => setArtist(e.target.value)}>
              {ARTIST_OPTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-500">
            제목 (EN)
            <input className={`mt-1 ${field}`} value={titleEn} onChange={e => setTitleEn(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
            제목 (KO)
            <input className={`mt-1 ${field}`} value={titleKo} onChange={e => setTitleKo(e.target.value)} />
          </label>
        </div>
      </section>

      {/* ── Step 2: 모드 활성화 + 모드별 별점 (9-tier) ───────────────────── */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Step 2 · 모드 & 난이도</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODE_ORDER.map(m => (
            <div
              key={m}
              className={`rounded-xl border-2 p-3 transition-colors ${
                enabled[m] ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={enabled[m]}
                  onChange={e => setEnabled(prev => ({ ...prev, [m]: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                />
                <ModeChip mode={m} />
                {MODE_LABEL[m].split(' — ')[0]}
              </label>
              <p className="mt-1 text-[11px] text-slate-500">{MODE_LABEL[m].split(' — ')[1]}</p>
              {enabled[m] && (
                <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                  난이도
                  <select
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    value={modeStars[m]}
                    onChange={e => setModeStars(prev => ({ ...prev, [m]: Number(e.target.value) }))}
                  >
                    {[1, 2, 3].map(n => (
                      <option key={n} value={n}>{'⭐'.repeat(n)} ({n})</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Step 3: 모드별 문항 편집기 ───────────────────────────────────── */}
      {enabledModes.map(m => (
        <section key={m} className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-indigo-500">
              Step 3 · <ModeChip mode={m} /> {MODE_LABEL[m]}
            </h2>
            <button
              type="button"
              onClick={() => addDraft(m)}
              className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
            >
              + 문항 추가
            </button>
          </div>

          {drafts[m].length === 0 && (
            <p className="mt-3 text-xs text-slate-400">아직 문항이 없습니다. "+ 문항 추가"를 눌러 시작하세요.</p>
          )}

          {drafts[m].map((d, i) => (
            <div key={i} className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-500">#{i + 1}</p>
                <button
                  type="button"
                  onClick={() => removeDraft(m, i)}
                  className="text-xs font-bold text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>

              {/* 공통: 구간 시간 */}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-slate-500">
                  시작 (초)
                  <input type="number" step="0.1" className={`mt-1 ${field}`} value={d.start} onChange={e => updateDraft(m, i, { start: e.target.value })} />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  종료 (초)
                  <input type="number" step="0.1" className={`mt-1 ${field}`} value={d.end} onChange={e => updateDraft(m, i, { end: e.target.value })} />
                </label>
              </div>

              {/* B / A: 문장 → 절 청킹 */}
              {(m === 'B' || m === 'A') && (
                <>
                  <label className="mt-3 block text-xs font-semibold text-slate-500">
                    전체 문장 (입력 후 아래에서 절 단위로 묶기)
                    <input
                      className={`mt-1 ${field}`}
                      value={d.sentence}
                      onChange={e =>
                        updateDraft(m, i, {
                          sentence: e.target.value,
                          chunks: splitWords(e.target.value),
                          blank: '',
                        })
                      }
                      placeholder="예: 물 좀 갖다 주시겠어요?"
                    />
                  </label>
                  <div className="mt-3">
                    <ClauseChunker
                      chunks={d.chunks}
                      onChange={next => {
                        const patch: Partial<ItemDraft> = { chunks: next }
                        // 빈칸으로 지정했던 절이 사라졌으면 해제
                        if (m === 'A' && d.blank && !next.includes(d.blank)) patch.blank = ''
                        updateDraft(m, i, patch)
                      }}
                      selectable={m === 'A'}
                      selectedChunk={m === 'A' ? d.chunks.indexOf(d.blank) : null}
                      onSelectChunk={idx => updateDraft(m, i, { blank: d.chunks[idx] })}
                    />
                  </div>
                  {m === 'A' && (
                    <>
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        빈칸 절: {d.blank ? <mark className="rounded bg-indigo-100 px-1.5 py-0.5 font-bold text-indigo-700">{d.blank}</mark> : <span className="text-amber-600">블록을 클릭해 지정하세요</span>}
                      </p>
                      <label className="mt-2 block text-xs font-semibold text-slate-500">
                        힌트 (선택 — 정답 미노출 발음/문맥 단서)
                        <input className={`mt-1 ${field}`} value={d.hint} onChange={e => updateDraft(m, i, { hint: e.target.value })} />
                      </label>
                    </>
                  )}
                </>
              )}

              {/* I: 듣기 문장 + 의미 보기 4개 */}
              {m === 'I' && (
                <>
                  <label className="mt-3 block text-xs font-semibold text-slate-500">
                    듣기 대상 문장 (한국어 원문)
                    <input className={`mt-1 ${field}`} value={d.sentence} onChange={e => updateDraft(m, i, { sentence: e.target.value })} />
                  </label>
                  <p className="mt-3 text-xs font-semibold text-slate-500">의미 보기 4개 (번역) — 라디오로 정답 선택</p>
                  {d.options.map((opt, oi) => (
                    <div key={oi} className="mt-1.5 flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${m}-${i}`}
                        checked={d.correct === oi}
                        onChange={() => updateDraft(m, i, { correct: oi })}
                        className="h-4 w-4 accent-indigo-600"
                      />
                      <input
                        className={field}
                        value={opt}
                        onChange={e =>
                          updateDraft(m, i, {
                            options: d.options.map((o, k) => (k === oi ? e.target.value : o)),
                          })
                        }
                        placeholder={`보기 ${String.fromCharCode(65 + oi)}`}
                      />
                    </div>
                  ))}
                </>
              )}

              {/* 공통: 해설 + 자막 블라인드 */}
              <label className="mt-3 block text-xs font-semibold text-slate-500">
                해설 (선택 · 줄바꿈 유지)
                <textarea rows={2} className={`mt-1 ${field} whitespace-pre-wrap`} value={d.explanation} onChange={e => updateDraft(m, i, { explanation: e.target.value })} />
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
                <input type="checkbox" checked={d.subs} onChange={e => updateDraft(m, i, { subs: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-indigo-600" />
                영상에 박힌 자막 있음 (하단 블라인드 표시)
              </label>
            </div>
          ))}
        </section>
      ))}

      {/* ── 검증 + 출력/저장 ─────────────────────────────────────────────── */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500">Export & 배포</h2>

        {problems.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-700">
            {problems.map((p, i) => (
              <li key={i}>⚠️ {p}</li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!videoId || builtItems.length === 0 || busy !== ''}
            onClick={() => persist(false)}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:opacity-40"
          >
            {busy === 'save' ? '저장 중…' : '💾 초안 저장'}
          </button>
          <button
            type="button"
            disabled={!videoId || builtItems.length === 0 || busy !== ''}
            onClick={() => persist(true)}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy === 'publish' ? '배포 중…' : '🚀 배포 (학습자 공개)'}
          </button>
          <button
            type="button"
            onClick={copyJson}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 shadow hover:bg-slate-200"
          >
            {copied ? '✔ 복사됨' : '📋 JSON 복사'}
          </button>
        </div>

        <p className="mt-4 mb-1 text-xs font-semibold text-slate-500">
          kArtistLive.ts 의 availableModes 에 붙여넣기:
        </p>
        <code className="block overflow-x-auto rounded-lg bg-slate-50 p-2 font-mono text-xs text-indigo-700">
          availableModes: {availableModesSnippet}
        </code>

        <p className="mt-3 mb-1 text-xs font-semibold text-slate-500">전체 페이로드 (JSON)</p>
        <textarea
          readOnly
          value={exportJson}
          rows={10}
          className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-700 outline-none"
        />
      </section>
    </div>
  )
}
