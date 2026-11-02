// src/pages/MaterialViewerPage.tsx
// 무료 자료 보기 — 페이지 이미지를 화면에서만 보여준다 (PDF 원본·다운로드 없음, 오너 방침)
//   · 이미지 우클릭/길게 누르기 저장·드래그를 막는다 (스크린샷까지 막을 수는 없음 — 가벼운 억제 목적)
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLang } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import type { Material } from '@/pages/MaterialsPage'

export default function MaterialViewerPage() {
  const { id = '' } = useParams()
  const { t, lang } = useLang()
  const [material, setMaterial] = useState<Material | null>(null)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!db || !id) return
    getDoc(doc(db, 'materials', id))
      .then(snap => {
        if (!snap.exists()) return setMissing(true)
        const m = { id: snap.id, ...snap.data() } as Material
        setMaterial(m)
        trackEvent('material_view', { material_id: m.id, level: m.level, type: m.type, episode: m.episode })
      })
      .catch(() => setMissing(true))
  }, [id])

  const title = material ? (lang === 'ko' ? material.titleKo : material.titleEn) : ''

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link to="/materials" className="text-sm font-semibold text-indigo-600" aria-label={t('materials.back')}>
          ‹ {t('materials.back')}
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-slate-800">{title}</h1>
      </header>

      {missing && <p className="mt-10 text-center text-sm text-slate-500">{t('materials.loadError')}</p>}

      <div
        className="mx-auto flex max-w-3xl select-none flex-col gap-3 px-2 py-4 sm:px-4"
        onContextMenu={e => e.preventDefault()}
        style={{ WebkitTouchCallout: 'none' }}
      >
        {material?.pageUrls?.map((src, i) => (
          <img
            key={src}
            src={src}
            alt={`${title} — ${i + 1}/${material.pageUrls.length}`}
            loading={i < 2 ? 'eager' : 'lazy'}
            draggable={false}
            className="pointer-events-none w-full rounded-lg bg-white shadow-sm"
            style={{ aspectRatio: '1240 / 1754' }}
          />
        ))}
      </div>
    </div>
  )
}
