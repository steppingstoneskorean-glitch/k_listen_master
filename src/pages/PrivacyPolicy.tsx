// src/pages/PrivacyPolicy.tsx
// 개인정보처리방침 — 현재 UI 언어의 번역본을 렌더한다(정본: 한국어). 콘텐츠는 src/data/legalPrivacy.ts.
import { useLang } from '@/lib/i18n'
import LegalDocView, { type LegalLang } from '@/components/LegalDocView'
import { PRIVACY } from '@/data/legalPrivacy'

export default function PrivacyPolicy() {
  const { lang } = useLang()
  const doc = PRIVACY[lang as LegalLang] ?? PRIVACY.ko
  return <LegalDocView doc={doc} />
}
