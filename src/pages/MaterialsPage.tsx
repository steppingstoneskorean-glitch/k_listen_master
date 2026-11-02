// src/pages/MaterialsPage.tsx
// 무료 자료 — 팟캐스트 에피소드별 워크시트·단어장 PDF (로그인 유저 전용, RequireAuth 뒤)
//   · 목록은 Firestore materials (published) — AI 자료 담당(scripts/staff/materials.mjs)이 채운다
//   · Firestore 규칙상 로그인 유저만 읽을 수 있어 다운로드 링크도 로그인 뒤에만 노출된다
import { useEffect, useMemo, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useLang } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

type Level = 'beginner' | 'intermediate' | 'advanced' | 'all'
type MaterialType = 'worksheet' | 'vocab' | 'other'

interface Material {
  id: string
  level: Level
  type: MaterialType
  grade: number | null
  episode: number | null
  titleEn: string
  titleKo: string
  pages: number
  url: string
}

const LEVEL_ORDER: Level[] = ['beginner', 'intermediate', 'advanced', 'all']
const LEVEL_STYLE: Record<Level, string> = {
  beginner: 'bg-emerald-50 text-emerald-700',
  intermediate: 'bg-sky-50 text-sky-700',
  advanced: 'bg-violet-50 text-violet-700',
  all: 'bg-slate-100 text-slate-600',
}
const TYPE_ORDER: MaterialType[] = ['worksheet', 'vocab', 'other']
const TYPE_ICON: Record<MaterialType, string> = { worksheet: '📝', vocab: '📖', other: '📄' }

export default function MaterialsPage() {
  const { t, lang } = useLang()
  const [items, setItems] = useState<Material[] | null>(null)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<Level | 'every'>('every')

  useEffect(() => {
    if (!db) return
    getDocs(query(collection(db, 'materials'), where('published', '==', true)))
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }) as Material)))
      // 규칙 배포 전(permission-denied)엔 오류 대신 '준비 중'으로 보이게
      .catch((e: { code?: string }) => (e?.code === 'permission-denied' ? setItems([]) : setError(true)))
  }, [])

  // 에피소드 최신순 → 레벨 → 종류(워크시트 먼저)
  const groups = useMemo(() => {
    const list = (items ?? [])
      .filter(m => filter === 'every' || m.level === filter)
      .sort(
        (a, b) =>
          (b.episode ?? 0) - (a.episode ?? 0) ||
          LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level) ||
          TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type),
      )
    const byEp = new Map<number, Material[]>()
    for (const m of list) byEp.set(m.episode ?? 0, [...(byEp.get(m.episode ?? 0) ?? []), m])
    return [...byEp.entries()]
  }, [items, filter])

  const levelsPresent = useMemo(() => LEVEL_ORDER.filter(l => items?.some(m => m.level === l)), [items])

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
      <section className="mx-auto w-full max-w-lg px-4 pt-5 pb-24">
        <h1 className="text-xl font-black text-slate-900">{t('materials.title')}</h1>
        <p className="mt-1 text-sm text-slate-500 break-keep">{t('materials.desc')}</p>

        {levelsPresent.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {(['every', ...levelsPresent] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setFilter(l)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                  filter === l ? 'bg-indigo-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t(l === 'every' ? 'materials.all' : `materials.${l}`)}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-8 text-center text-sm text-rose-600">{t('materials.loadError')}</p>}
        {!error && items === null && <p className="mt-8 text-center text-sm text-slate-400">…</p>}
        {!error && items?.length === 0 && (
          <p className="mt-8 text-center text-sm font-semibold text-slate-500">{t('materials.comingSoon')}</p>
        )}

        {groups.map(([ep, list]) => (
          <div key={ep} className="mt-6">
            {ep > 0 && (
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                {t('materials.episode')} {ep}
              </h2>
            )}
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {list.map(m => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xl" aria-hidden>{TYPE_ICON[m.type]}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{lang === 'ko' ? m.titleKo : m.titleEn}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${LEVEL_STYLE[m.level]}`}>
                        {t(`materials.${m.level === 'all' ? 'all' : m.level}`)}
                        {m.grade ? (lang === 'ko' ? ` · ${m.grade}급` : ` · L${m.grade}`) : ''}
                      </span>
                      <span className="text-slate-400">
                        {t(`materials.${m.type}`)} · {m.pages} {t('materials.pages')}
                      </span>
                    </div>
                  </div>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('material_download', { material_id: m.id, level: m.level, type: m.type, episode: m.episode })}
                    className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:opacity-90"
                  >
                    {t('materials.download')}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  )
}
