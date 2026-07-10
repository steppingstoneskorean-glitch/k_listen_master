// middleware.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 공유 링크 OG 미리보기 (Vercel Edge Middleware)
//
//   이 앱은 클라이언트 렌더링 SPA(Vite)라 index.html 의 OG 태그가 고정 값이다.
//   메신저/디스코드 등 링크 미리보기 봇은 JS 를 실행하지 않으므로, 봇의 User-Agent 를
//   감지했을 때만 요청 쿼리(score/stars/label/...)로 만든 동적 OG 태그 HTML 셸을
//   대신 응답한다. 실제 사용자는 항상 그대로 SPA 로 통과한다.
//
//   og:image 는 api/og-card.tsx (@vercel/og) 를 가리켜 결과 카드와 동일한 시각 언어의
//   1080×1080 이미지를 그때그때 생성한다.
// ─────────────────────────────────────────────────────────────────────────────

import { next } from '@vercel/edge'

export const config = {
  matcher: ['/dictation', '/game', '/kpop-quiz/:path*'],
}

const BOT_UA =
  /facebookexternalhit|Facebot|Twitterbot|Discordbot|WhatsApp|TelegramBot|Slackbot|LinkedInBot|KakaoTalk|Kakao|Pinterest|redditbot|SkypeUriPreview|vkShare|W3C_Validator|Iframely|Embedly/i

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || ''
  if (!BOT_UA.test(ua)) return next()

  const url = new URL(request.url)
  const score = url.searchParams.get('score')
  const stars = url.searchParams.get('stars')
  const label = url.searchParams.get('label')
  const correct = url.searchParams.get('correct')
  const total = url.searchParams.get('total')

  // 공유 파라미터가 없는 일반 방문(봇이 그냥 페이지를 미리보기)은 그대로 통과시킨다
  if (!score || !label) return next()

  const title = `🎵 ${label} — ${score} pts${stars ? ` (${stars}★)` : ''} | K-Listen Master`
  const description =
    correct && total
      ? `I scored ${score} pts (${correct}/${total} correct) on the ${label} quiz. Can you beat me?`
      : `I scored ${score} pts on the ${label} quiz. Can you beat me?`

  const ogImageUrl = new URL('/api/og-card', url.origin)
  url.searchParams.forEach((v, k) => ogImageUrl.searchParams.set(k, v))

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="K-Listen Master" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(url.toString())}" />
<meta property="og:image" content="${escapeHtml(ogImageUrl.toString())}" />
<meta property="og:image:width" content="1080" />
<meta property="og:image:height" content="1080" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(ogImageUrl.toString())}" />
</head>
<body></body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
