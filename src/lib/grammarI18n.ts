// src/lib/grammarI18n.ts
// 문법 아티클 본문의 다국어 표시 헬퍼.
//   · grammarArticles.ts 는 영어 원문만 담고, 번역은 grammarTranslations.json 사전
//     ({영어원문: {ko,es,ja}})에서 UI 언어에 맞춰 찾아 쓴다. 없으면 영어로 폴백.
//   · 사전은 scripts/translate-grammar.cjs 가 pre-commit 에서 자동 생성/갱신한다.

import { useLang } from '@/lib/i18n'
import dict from '@/data/grammarTranslations.json'

type TargetLang = 'ko' | 'es' | 'ja'
type Dict = Record<string, Partial<Record<TargetLang, string>>>

export function useGrammarT(): (s: string) => string {
  const { lang } = useLang()
  if (lang === 'en') return s => s
  return s => (dict as Dict)[s]?.[lang as TargetLang] ?? s
}
