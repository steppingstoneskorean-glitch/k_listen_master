import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { HangulComposer } from '@/lib/hangul'

// 하단 고정 온스크린 한글 키보드 (두벌식).
//   · 제어 입력과 함께 사용: value/onChange 로 부모의 답 상태를 갱신.
//   · 사용자가 자기 IME 로 직접 입력해도 됨 — 그 경우 value 가 외부에서 바뀌므로
//     조합 상태를 syncExternal 로 흡수한다(직접 입력 우선, 병행 가능).
//   · open=false 면 렌더하지 않음(기본 닫힘, 토글로 연다).

type Props = {
  value: string
  onChange: (next: string) => void
  open: boolean
  onClose: () => void
  onSubmit?: () => void
  disabled?: boolean
}

const BASE: string[][] = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
]
const SHIFT: string[][] = [
  ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅒ', 'ㅖ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
]

export default function HangulKeyboard({ value, onChange, open, onClose, onSubmit, disabled }: Props) {
  const { t } = useLang()
  const composer = useRef(new HangulComposer())
  const lastEmit = useRef<string | null>(null)
  const [shift, setShift] = useState(false)

  // 외부(직접 타이핑/부모 리셋)로 값이 바뀌면 조합 상태를 그 값에 맞춘다.
  useEffect(() => {
    if (value !== lastEmit.current) composer.current.syncExternal(value)
  }, [value])

  if (!open) return null

  const emit = (next: string) => { lastEmit.current = next; onChange(next) }
  const pressJamo = (j: string) => {
    if (disabled) return
    emit(composer.current.input(j))
    if (shift) setShift(false)
  }
  const backspace = () => { if (!disabled) emit(composer.current.backspace()) }
  const space = () => { if (!disabled) emit(composer.current.space()) }
  const done = () => {
    if (disabled) return
    emit(composer.current.commit())
    if (onSubmit) onSubmit()
    else onClose()
  }

  const rows = shift ? SHIFT : BASE

  const Key = ({ label, onClick, className = '' }: { label: React.ReactNode; onClick: () => void; className?: string }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white text-lg font-bold text-slate-800 shadow-[0_1px_0_#c7ccd6] transition-transform active:translate-y-px active:bg-indigo-100 ${className}`}
    >
      {label}
    </button>
  )

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-300 bg-[#eceef3] px-1.5 pt-2 shadow-[0_-8px_24px_-12px_rgba(15,23,42,.35)]"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* 헤더 — 닫기 버튼만 우측에 */}
      <div className="mb-1 flex items-center justify-end px-2 text-[11px] font-bold text-slate-500">
        <button type="button" onClick={onClose} className="rounded-md px-2 py-0.5 text-slate-500 hover:bg-slate-200">
          ✕ {t('kbd.close')}
        </button>
      </div>

      {/* 자모 행 */}
      {rows.map((row, r) => (
        <div key={r} className="mx-0.5 my-1 flex justify-center gap-1">
          {/* 마지막 자모 행: ⇧ … ⌫ 배치 */}
          {r === 2 && (
            <button
              type="button"
              onClick={() => setShift(s => !s)}
              className={`flex h-11 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-black shadow-[0_1px_0_#c7ccd6] ${shift ? 'bg-indigo-200 text-indigo-700' : 'bg-white text-slate-600'}`}
              style={{ flex: 1.4 }}
              aria-label="shift"
            >
              ⇧
            </button>
          )}
          {row.map(j => (
            <Key key={j} label={j} onClick={() => pressJamo(j)} />
          ))}
          {r === 2 && (
            <button
              type="button"
              onClick={backspace}
              className="flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-lg font-bold text-slate-600 shadow-[0_1px_0_#c7ccd6] active:translate-y-px active:bg-indigo-100"
              style={{ flex: 1.4 }}
              aria-label="backspace"
            >
              ⌫
            </button>
          )}
        </div>
      ))}

      {/* 스페이스 / 완료 */}
      <div className="mx-0.5 my-1 flex justify-center gap-1">
        <button
          type="button"
          onClick={space}
          className="h-11 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-400 shadow-[0_1px_0_#c7ccd6] active:bg-indigo-100"
          style={{ flex: 4 }}
        >
          {t('kbd.space')}
        </button>
        <button
          type="button"
          onClick={done}
          className="h-11 rounded-lg bg-indigo-600 text-sm font-black text-white shadow-[0_1px_0_#4338ca] active:translate-y-px"
          style={{ flex: 2 }}
        >
          {t('kbd.done')}
        </button>
      </div>
    </div>
  )
}
