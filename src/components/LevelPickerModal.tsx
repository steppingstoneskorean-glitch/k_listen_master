import { useNavigate } from 'react-router-dom'
import { useLang } from '@/lib/i18n'

// '새 학습' → 레벨 선택 → 해당 Catch the Sound 로 연결.
// 목적지는 홈의 Catch the Sound 카드와 동일하게 맞춘다.
const LEVELS = [
  { id: 'beginner',     emoji: '🎯', label: 'home.level1.label', title: 'home.level1.title', sub: 'home.level1.rounds', to: '/game',                        cls: 'hover:border-emerald-300' },
  { id: 'intermediate', emoji: '🗣️', label: 'home.level2.label', title: 'home.level2.title', sub: 'home.level2.rounds', to: '/dictation?mode=intermediate', cls: 'hover:border-blue-300' },
  { id: 'advanced',     emoji: '🎙️', label: 'home.level3.label', title: 'home.level3.title', sub: 'home.level3.rounds', to: '/dictation?mode=advanced',     cls: 'hover:border-indigo-300' },
] as const

export default function LevelPickerModal({ onClose }: { onClose: () => void }) {
  const { t } = useLang()
  const navigate = useNavigate()

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-slate-900">{t('home.chooseLevel')}</h2>
        <p className="mt-1 text-sm font-bold text-emerald-500" translate="no">🎯 Catch the Sound</p>

        <div className="mt-4 flex flex-col gap-2.5">
          {LEVELS.map(l => (
            <button
              key={l.id}
              type="button"
              onClick={() => go(l.to)}
              className={`group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${l.cls}`}
            >
              <span className="text-2xl transition-transform group-hover:scale-110">{l.emoji}</span>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t(l.label)}</span>
                <p className="text-sm font-black text-slate-800">{t(l.title)}</p>
                <p className="text-[11px] text-slate-400">{t(l.sub)}</p>
              </div>
              <span className="shrink-0 text-emerald-500 opacity-0 transition-opacity group-hover:opacity-100">→</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  )
}
