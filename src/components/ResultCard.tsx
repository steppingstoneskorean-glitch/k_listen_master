// src/components/ResultCard.tsx
// 결과 이미지 카드 (1:1 정사각) — html-to-image 로 캡처해 다운로드/공유한다.
//   · KpopQuiz.jsx 의 기존 canvas 포토카드와 시각 언어(그라데이션 + 화이트 카드)를 맞췄다.
//   · Dictation/Game 결과 화면처럼 아티스트 썸네일이 없는 경우 그라데이션 배너로 대체된다.

export interface ResultCardProps {
  thumbnailUrl?: string
  /** 아티스트명(K-Artist Live) 또는 레벨 타이틀(Dictation/Game) */
  title: string
  stars: number
  score: number
  correctCount?: number
  total?: number
  tagline?: string
}

export default function ResultCard({ thumbnailUrl, title, stars, score, correctCount, total, tagline }: ResultCardProps) {
  return (
    <div className="mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-4 shadow-2xl">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-white">
        {/* 썸네일 배너 (없으면 그라데이션 + 로고) */}
        <div className="relative h-[38%] w-full shrink-0 overflow-hidden bg-gradient-to-br from-indigo-500 to-fuchsia-500">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-5xl">🎧</div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-4 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-500">🎤 K-LISTEN MASTER</p>
          <p className="max-w-full truncate rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-extrabold text-indigo-700">
            {title.toUpperCase()} {'⭐'.repeat(Math.max(0, Math.min(5, stars)))}
          </p>
          <p className="text-6xl font-black tabular-nums text-slate-900">{score.toLocaleString()}</p>
          {correctCount !== undefined && total !== undefined && (
            <p className="text-sm font-semibold text-slate-500">
              {correctCount} / {total} correct
            </p>
          )}
          {tagline && <p className="mt-1 text-sm font-bold text-fuchsia-600">{tagline}</p>}
        </div>
      </div>
    </div>
  )
}
