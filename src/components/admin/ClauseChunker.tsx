// src/components/admin/ClauseChunker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 절(Clause) 단위 수동 청킹 도구 — 운영자 CMS 전용
//   · 단순 공백 분할이 아니라, 운영자가 인접 어절을 직접 묶어
//     "좀 갖다 주시겠어요?" 같은 대화 단위 절 블록을 만든다 (앱의 교육 정체성)
//   · ⊕ : 인접 블록 병합  /  ✂ : 블록을 다시 어절로 분할
//   · selectable 모드(A 딕테이션)에서는 블록을 클릭해 빈칸 대상으로 지정
// ─────────────────────────────────────────────────────────────────────────────

export function splitWords(sentence: string): string[] {
  return sentence.trim().split(/\s+/).filter(Boolean)
}

export default function ClauseChunker({
  chunks,
  onChange,
  selectable = false,
  selectedChunk = null,
  onSelectChunk,
}: {
  /** 현재 블록 목록 (순서 = 원문 순서 = B 모드 정답 순서) */
  chunks: string[]
  onChange: (next: string[]) => void
  /** true 면 블록 클릭으로 빈칸 대상 선택 (A 모드) */
  selectable?: boolean
  selectedChunk?: number | null
  onSelectChunk?: (idx: number) => void
}) {
  const mergeAt = (i: number) => {
    // chunks[i] 와 chunks[i+1] 를 하나의 절로 병합
    const next = [...chunks]
    next.splice(i, 2, `${chunks[i]} ${chunks[i + 1]}`)
    onChange(next)
  }

  const splitAt = (i: number) => {
    // 여러 어절이 묶인 블록을 다시 어절 단위로 분할
    const words = splitWords(chunks[i])
    if (words.length <= 1) return
    const next = [...chunks]
    next.splice(i, 1, ...words)
    onChange(next)
  }

  if (chunks.length === 0) {
    return <p className="text-xs text-slate-400">문장을 입력하면 어절 블록이 표시됩니다.</p>
  }

  return (
    <div>
      <div translate="no" className="notranslate flex flex-wrap items-center gap-y-2">
        {chunks.map((chunk, i) => {
          const multi = splitWords(chunk).length > 1
          const selected = selectable && selectedChunk === i
          return (
            <span key={`${i}-${chunk}`} className="flex items-center">
              <span
                role={selectable ? 'button' : undefined}
                onClick={() => selectable && onSelectChunk?.(i)}
                className={`relative inline-flex items-center gap-1 rounded-lg border-2 px-2.5 py-1.5 text-sm font-bold transition-colors ${
                  selected
                    ? 'border-indigo-500 bg-indigo-100 text-indigo-800'
                    : multi
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-300 bg-white text-slate-700'
                } ${selectable ? 'cursor-pointer hover:border-indigo-400' : ''}`}
                title={selectable ? '클릭하면 이 절을 빈칸으로 지정' : undefined}
              >
                {chunk}
                {multi && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      splitAt(i)
                    }}
                    title="어절로 다시 분할"
                    className="ml-0.5 rounded bg-white/70 px-1 text-[10px] font-black text-slate-500 hover:text-red-500"
                  >
                    ✂
                  </button>
                )}
              </span>
              {i < chunks.length - 1 && (
                <button
                  type="button"
                  onClick={() => mergeAt(i)}
                  title="다음 블록과 병합해 하나의 절로 묶기"
                  className="mx-0.5 flex h-5 w-5 items-center justify-center rounded-full text-xs font-black text-slate-400 hover:bg-indigo-100 hover:text-indigo-600"
                >
                  ⊕
                </button>
              )}
            </span>
          )
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-slate-400">
        ⊕ 를 눌러 인접 어절을 하나의 절로 묶고, ✂ 로 다시 분할합니다.
        {selectable && ' 절 블록을 클릭하면 빈칸 대상으로 지정됩니다.'}
      </p>
    </div>
  )
}
