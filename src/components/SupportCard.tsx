// src/components/SupportCard.tsx
// 결과 화면 하단의 조용한 Ko-fi 후원 한 줄 카드.
//   · 공유/로그인 CTA 를 잡아먹지 않도록 항상 결과 화면 맨 아래에 둔다.
//   · Ko-fi 공식 위젯 스크립트를 쓰지 않는다 — 제3자 스크립트를 추가하면 개인정보처리방침
//     고지 대상이 늘고 로드가 느려진다. 단순 링크 + 인라인 SVG 로 충분하다.
//   · variant='dark'(게임/받아쓰기 결과) / 'light'(K-Artist Live 결과) — ChallengeShare 와 동일 규약.

import { useLang } from '@/lib/i18n'

const KOFI_URL = 'https://ko-fi.com/stepkorean'

export default function SupportCard({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const { t } = useLang()
  const dark = variant === 'dark'

  return (
    <a
      href={KOFI_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
        dark
          ? 'border-gray-700/60 bg-gray-800/40 text-gray-400 hover:border-gray-600 hover:text-gray-200'
          : 'border-slate-200 bg-white text-slate-500 shadow-sm hover:border-slate-300 hover:text-slate-700'
      }`}
    >
      <KofiCup />
      <span className="text-balance break-keep text-center">{t('support.cta')}</span>
    </a>
  )
}

function KofiCup() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#FF5E5B]" fill="currentColor" aria-hidden="true">
      <path d="M4 4h13a4 4 0 0 1 0 8h-1.1a6 6 0 0 1-11.8 0V4Zm12 6h1a2 2 0 0 0 0-4h-1v4ZM3 20h16a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2Z" />
    </svg>
  )
}
