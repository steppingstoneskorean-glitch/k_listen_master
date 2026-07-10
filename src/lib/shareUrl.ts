// src/lib/shareUrl.ts
// 결과 페이지 공유 링크 빌더 — 점수/난이도/이름 등을 쿼리 파라미터로 실어 보낸다.
//   · 리시버가 클릭하면 같은 게임/문제로 바로 진입 가능 (예: /dictation?mode=intermediate)
//   · 소셜 링크 미리보기 이미지는 클라이언트 결과 카드(resultCardImage.ts, html-to-image)로 생성한다.

export interface ShareMeta {
  /** 예: '/dictation?mode=intermediate', '/kpop-quiz/wu6bA3zK_us' — 이미 쿼리가 있어도 안전하게 병합됨 */
  path: string
  score: number
  stars: number
  /** 아티스트명(K-Artist Live) 또는 레벨 타이틀(Dictation/Game) */
  label: string
  correctCount?: number
  total?: number
  /** K-Artist Live 영상 썸네일 등 — 있으면 OG 이미지에 사용 */
  thumbnailUrl?: string
}

export function buildShareUrl(meta: ShareMeta): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://k-listen-master.vercel.app'
  const [pathname, existingQuery] = meta.path.split('?')
  const params = new URLSearchParams(existingQuery)
  params.set('score', String(meta.score))
  params.set('stars', String(meta.stars))
  params.set('label', meta.label)
  if (meta.correctCount !== undefined) params.set('correct', String(meta.correctCount))
  if (meta.total !== undefined) params.set('total', String(meta.total))
  if (meta.thumbnailUrl) params.set('thumb', meta.thumbnailUrl)
  return `${origin}${pathname}?${params.toString()}`
}
