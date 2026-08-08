// src/pages/TermsPage.tsx
// 이용약관 — 현재 UI 언어의 번역본을 렌더한다(정본: 한국어). 콘텐츠는 src/data/legalTerms.ts.
import { useLang } from '@/lib/i18n'
import LegalDocView, { type LegalLang } from '@/components/LegalDocView'
import { TERMS } from '@/data/legalTerms'

export default function TermsPage() {
  const { lang } = useLang()
  const doc = TERMS[lang as LegalLang] ?? TERMS.ko
  return <LegalDocView doc={doc} />
}
