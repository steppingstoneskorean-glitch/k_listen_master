// src/components/MilestoneToast.tsx
// 듣기 문항 마일스톤 달성 시 가벼운 인앱 축하(토스트).
//   · 학습 성과 피드백만 — XP/뱃지/스트릭/레벨업 없음.
//   · gamification.pendingMilestone 을 구독해 표시, 4초 뒤 자동 닫힘(탭하면 즉시 닫힘).

import { useEffect } from 'react'
import { useLang } from '@/lib/i18n'
import { useGamification } from '@/lib/gamification'

export default function MilestoneToast() {
  const { t } = useLang()
  const { pendingMilestone, clearMilestone } = useGamification()

  useEffect(() => {
    if (pendingMilestone == null) return
    const timer = setTimeout(clearMilestone, 4000)
    return () => clearTimeout(timer)
  }, [pendingMilestone, clearMilestone])

  if (pendingMilestone == null) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4">
      <button
        type="button"
        onClick={clearMilestone}
        className="pointer-events-auto max-w-sm rounded-2xl border border-indigo-200 bg-white px-5 py-3 text-center text-sm font-black text-slate-800 shadow-xl shadow-indigo-200/50"
      >
        {t('milestone.done').replace('{n}', String(pendingMilestone))}
      </button>
    </div>
  )
}
