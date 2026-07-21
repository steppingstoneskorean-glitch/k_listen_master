// src/pages/GrammarListPage.tsx
// 문법·표현 해설 목록 (/grammar) — 퀴즈 해설을 확장한 텍스트 콘텐츠 허브.
//   · 학습 집중을 위해 밝은 배경(라이트 테마) — Layout 의 다크 배경을 페이지에서 덮는다.
//   · 레벨 카테고리 필터(All / Beginner / Intermediate)로 원하는 레벨만 모아 볼 수 있다.
//   · UI 문자열은 i18n.tsx, 아티클 본문은 grammarTranslations.json 사전으로 다국어 표시.

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { GRAMMAR_ARTICLES } from '@/data/grammarArticles'
import { useLang } from '@/lib/i18n'
import { useGrammarT } from '@/lib/grammarI18n'

const LEVEL_STYLE: Record<string, string> = {
  beginner: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-600 border-amber-200',
}

type LevelFilter = 'all' | 'beginner' | 'intermediate'

const FILTERS: { value: LevelFilter; labelKey: 'grammar.filterAll' | 'grammar.filterBeginner' | 'grammar.filterIntermediate' }[] = [
  { value: 'all', labelKey: 'grammar.filterAll' },
  { value: 'beginner', labelKey: 'grammar.filterBeginner' },
  { value: 'intermediate', labelKey: 'grammar.filterIntermediate' },
]

const LEVEL_LABEL_KEY = {
  beginner: 'grammar.filterBeginner',
  intermediate: 'grammar.filterIntermediate',
} as const

export default function GrammarListPage() {
  const { t } = useLang()
  const tr = useGrammarT()
  const [filter, setFilter] = useState<LevelFilter>('all')

  useEffect(() => {
    document.title = 'Korean Grammar & Expressions from K-pop Lives | K-Listen Master'
    return () => {
      document.title = 'K-Listen Master | Learn Korean with K-Pop — Free Listening Game'
    }
  }, [])

  const shown = GRAMMAR_ARTICLES.filter(a => filter === 'all' || a.level === filter)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900">{t('grammar.listTitle')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            {t('grammar.listIntro')}
          </p>
        </div>

        {/* 레벨 필터 */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.value
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
              }`}
            >
              {t(f.labelKey)}
            </button>
          ))}
          <span className="ml-1 text-xs text-slate-400">
            {t('grammar.guidesCount').replace('{n}', String(shown.length))}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {shown.map(a => (
            <Link
              key={a.slug}
              to={`/grammar/${a.slug}`}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LEVEL_STYLE[a.level]}`}
                >
                  {t(LEVEL_LABEL_KEY[a.level])}
                </span>
                <span translate="no" className="notranslate truncate text-[11px] font-semibold text-indigo-500">{a.pattern}</span>
              </div>
              <h2 className="text-base font-bold leading-snug text-slate-900 group-hover:text-indigo-600 transition-colors">
                {tr(a.title)}
              </h2>
              <p className="text-xs leading-relaxed text-slate-500 line-clamp-3">{tr(a.summary)}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
