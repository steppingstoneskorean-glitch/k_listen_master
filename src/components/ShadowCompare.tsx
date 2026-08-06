// src/components/ShadowCompare.tsx
// 원어민 음원 ↔ 학습자 녹음 A/B 비교 재생.
//   · ▶ 원어민 / ▶ 나 원탭 전환
//   · 🔁 번갈아 재생 (원어민→나→원어민 … 자동 반복)
//   항상 하나만 재생(exclusivePlayer). 학습자가 귀로 직접 비교한다.

import { useEffect, useRef, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { playExclusive, stopExclusive } from '@/lib/exclusivePlayer'

export default function ShadowCompare({ nativeSrc, mineSrc }: { nativeSrc: string; mineSrc: string }) {
  const { t } = useLang()
  const [alternating, setAlternating] = useState(false)
  const altRef = useRef(false)

  useEffect(() => {
    return () => { altRef.current = false; stopExclusive() }
  }, [])

  const playOne = (which: 'native' | 'mine') => {
    altRef.current = false
    setAlternating(false)
    playExclusive(new Audio(which === 'native' ? nativeSrc : mineSrc))
  }

  const toggleAlternate = () => {
    if (altRef.current) {
      altRef.current = false
      setAlternating(false)
      stopExclusive()
      return
    }
    altRef.current = true
    setAlternating(true)
    const step = (which: 'native' | 'mine') => {
      if (!altRef.current) return
      const a = new Audio(which === 'native' ? nativeSrc : mineSrc)
      a.onended = () => { if (altRef.current) step(which === 'native' ? 'mine' : 'native') }
      playExclusive(a)
    }
    step('native')
  }

  return (
    <div className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white shadow-sm p-3">
      <button
        onClick={() => playOne('native')}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors text-xs font-bold"
      >
        ▶ {t('shadowing.native')}
      </button>
      <button
        onClick={() => playOne('mine')}
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors text-xs font-bold"
      >
        ▶ {t('shadowing.you')}
      </button>
      <button
        onClick={toggleAlternate}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-colors text-xs font-bold ${
          alternating ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
        }`}
      >
        {alternating ? `⏹ ${t('shadowing.stopAlternate')}` : `🔁 ${t('shadowing.alternate')}`}
      </button>
    </div>
  )
}
