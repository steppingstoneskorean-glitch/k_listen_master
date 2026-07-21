// src/pages/GrammarArticlePage.tsx
// 문법·표현 해설 상세 (/grammar/:slug)
//   · 학습 집중을 위해 밝은 배경(라이트 테마) — Layout 의 다크 배경을 페이지에서 덮는다.
//   · document.title + meta description 을 글별로 설정 (SPA SEO — 영어 원문 고정)
//   · UI 문자열은 i18n.tsx, 본문은 grammarTranslations.json 사전으로 다국어 표시.
//   · 관련 퀴즈 CTA 로 "읽기 → 듣기 연습" 동선을 연결한다.

import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getArticle, GRAMMAR_ARTICLES } from '@/data/grammarArticles'
import { useLang } from '@/lib/i18n'
import { useGrammarT } from '@/lib/grammarI18n'
import NotFoundPage from '@/pages/NotFoundPage'

export default function GrammarArticlePage() {
  const { slug } = useParams()
  const article = slug ? getArticle(slug) : undefined
  const { t } = useLang()
  const tr = useGrammarT()

  useEffect(() => {
    if (!article) return
    document.title = `${article.title} | K-Listen Master`
    const meta = document.querySelector('meta[name="description"]')
    const original = meta?.getAttribute('content') ?? ''
    meta?.setAttribute('content', article.summary)
    return () => {
      document.title = 'K-Listen Master | Learn Korean with K-Pop — Free Listening Game'
      meta?.setAttribute('content', original)
    }
  }, [article])

  if (!article) return <NotFoundPage />

  const related = article.related
    .map(s => GRAMMAR_ARTICLES.find(a => a.slug === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))

  return (
    <div className="min-h-screen bg-slate-50">
      <article className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link to="/grammar" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
          ← {t('grammar.listTitle')}
        </Link>

        {/* Title block */}
        <header className="mt-4">
          <h1 className="text-balance text-2xl font-black leading-tight text-slate-900 sm:text-3xl">
            {tr(article.title)}
          </h1>
          <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">
            <p translate="no" className="notranslate text-lg font-bold text-indigo-700">{article.pattern}</p>
            <p className="mt-1 text-sm text-slate-600">{tr(article.meaning)}</p>
          </div>
        </header>

        {/* Sections */}
        <div className="mt-8 flex flex-col gap-8">
          {article.sections.map(sec => (
            <section key={sec.heading}>
              <h2 className="text-lg font-bold text-slate-900">{tr(sec.heading)}</h2>
              {sec.paragraphs?.map((p, i) => (
                <p key={i} className="mt-3 text-sm leading-relaxed text-slate-700">
                  {tr(p)}
                </p>
              ))}
              {sec.examples && (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {sec.examples.map(ex => (
                    <li key={ex.ko} className="rounded-xl bg-white border border-slate-200 px-4 py-3 shadow-sm">
                      {/* 한국어 예문은 브라우저 자동 번역 차단 */}
                      <p translate="no" className="notranslate text-sm font-semibold text-slate-900">{ex.ko}</p>
                      {/* 예문의 영어 뜻풀이는 번역하지 않는다 — 한국어 UI 에서 번역하면
                          바로 위 한국어 예문과 똑같아져 뜻풀이 역할을 잃는다 */}
                      <p className="mt-0.5 text-xs text-slate-500">{ex.en}</p>
                      {ex.note && <p className="mt-1 text-[11px] text-amber-600">{ex.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        {/* 관련 퀴즈 CTA */}
        {article.quiz && (
          <Link
            to={`/kpop-quiz/${article.quiz.videoId}`}
            className="mt-10 block rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 shadow-lg transition-opacity hover:opacity-90"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200">
              {t('grammar.hearIt')}
            </p>
            <p translate="no" className="notranslate mt-1.5 text-base font-bold text-white">
              “{article.quiz.sentence}”
            </p>
            <p className="mt-1 text-xs text-indigo-200">
              {t('grammar.tryQuiz').replace('{label}', article.quiz.label)}
            </p>
          </Link>
        )}

        {/* 관련 글 */}
        {related.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">
              {t('grammar.keepLearning')}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {related.map(r => (
                <li key={r.slug}>
                  <Link
                    to={`/grammar/${r.slug}`}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    {tr(r.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  )
}
