// api/og-card.tsx
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 결과 공유 링크의 동적 OG 미리보기 이미지 (Vercel Edge Function)
//
//   GET /api/og-card?score=..&stars=..&label=..&correct=..&total=..&thumb=..
//   Returns: 1080×1080 PNG (@vercel/og 의 satori 렌더러)
//
//   middleware.ts 가 소셜 미디어 봇에게 보여주는 OG HTML 셸의 og:image 로 이 엔드포인트를
//   가리킨다. src/components/ResultCard.tsx 와 같은 시각 언어(그라데이션 + 화이트 카드)를
//   satori 호환 인라인 스타일(JSX)로 재구현했다 — Tailwind 클래스는 satori 에서 동작하지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url)
  const score = (searchParams.get('score') || '0').slice(0, 12)
  const stars = Math.max(0, Math.min(5, Number(searchParams.get('stars')) || 0))
  const label = (searchParams.get('label') || 'K-Listen Master').slice(0, 40)
  const correct = searchParams.get('correct')
  const total = searchParams.get('total')
  const thumb = searchParams.get('thumb')

  const starIcons = '⭐'.repeat(stars)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #c026d3 100%)',
          padding: 44,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            borderRadius: 56,
            padding: '48px 40px',
          }}
        >
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              width={640}
              height={230}
              style={{ objectFit: 'cover', borderRadius: 32, marginBottom: 28 }}
            />
          )}
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, letterSpacing: 2, color: '#6366f1' }}>
            🎤 K-LISTEN MASTER
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 22,
              fontSize: 34,
              fontWeight: 800,
              color: '#4f46e5',
              background: '#eef2ff',
              padding: '14px 34px',
              borderRadius: 999,
            }}
          >
            {label.toUpperCase()} {starIcons}
          </div>
          <div style={{ display: 'flex', marginTop: 36, fontSize: 150, fontWeight: 900, color: '#0f172a' }}>
            {score}
          </div>
          {correct && total && (
            <div style={{ display: 'flex', marginTop: 8, fontSize: 32, fontWeight: 600, color: '#64748b' }}>
              {correct} / {total} correct
            </div>
          )}
        </div>
      </div>
    ),
    { width: 1080, height: 1080 },
  )
}
