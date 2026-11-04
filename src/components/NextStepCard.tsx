// src/components/NextStepCard.tsx
// 결과 화면의 "다음 계단: 1:1 말하기" 카드 — 게임(유입 훅) → 유료 1:1 수업(전환)으로 넘기는 장치.
//   · 마케팅 OS(marketing/os/01_brand/usp.md "자산과 퍼널 역할")의 K-Listen 다음 단계 버튼.
//   · Payhip 링크에 UTM 을 붙여 어느 게임에서 넘어왔는지 남긴다 (09_tracking 규칙).
//   · 클릭은 GA(class_cta_click) + Meta 픽셀(InitiateCheckout, 동의한 경우만)으로 기록.
//   · 수업은 앱 밖에서 제공되는 서비스라 외부 결제 링크로 보낸다.
//   · variant='dark'(게임/받아쓰기 결과) / 'light'(K-Stars 결과) — SupportCard 와 동일 규약.

import { useLang } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import { trackPixel } from '@/lib/metaPixel'

const PAYHIP_URL = 'https://payhip.com/StepKorean'

function classUrl(from: string) {
  const url = new URL(PAYHIP_URL)
  url.searchParams.set('utm_source', 'klisten')
  url.searchParams.set('utm_medium', 'app')
  url.searchParams.set('utm_campaign', 'next_step')
  url.searchParams.set('utm_content', from)
  return url.toString()
}

export default function NextStepCard({ from, variant = 'dark' }: { from: string; variant?: 'dark' | 'light' }) {
  const { t } = useLang()
  const dark = variant === 'dark'

  return (
    <a
      href={classUrl(from)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        trackEvent('class_cta_click', { from })
        trackPixel('InitiateCheckout', { content_name: 'speaking_class', content_category: from })
      }}
      className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${
        dark
          ? 'border-indigo-500/40 bg-indigo-500/10 hover:border-indigo-400/70'
          : 'border-indigo-100 bg-white shadow-sm hover:bg-indigo-50'
      }`}
    >
      {/* ㄱㄴㄷ 계단 — Step Korean 레벨 색(브랜드 가이드) */}
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-end justify-center gap-0.5 rounded-xl bg-white p-1.5">
        <span className="h-2.5 w-2 rounded-sm bg-[#1E4BCD]" />
        <span className="h-4 w-2 rounded-sm bg-[#703785]" />
        <span className="h-6 w-2 rounded-sm bg-[#DB1E21]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-indigo-300' : 'text-indigo-500'}`}>
          {t('nextStep.kicker')}
        </span>
        <span className={`block text-balance break-keep text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
          {t('nextStep.title')}
        </span>
        <span className={`block text-xs ${dark ? 'text-gray-400' : 'text-slate-500'}`}>{t('nextStep.sub')}</span>
      </span>
      <span className={dark ? 'text-gray-500' : 'text-slate-300'}>↗</span>
    </a>
  )
}
