// src/data/gameLevels.ts
// 게임 레벨 → 별점 매핑 (전 화면 일관성)
//   Beginner ★1 · Intermediate ★2 · Advanced ★4 (고급 변별력을 위해 4)

export type LevelKey = 'beginner' | 'intermediate' | 'advanced'

export const LEVEL_STARS: Record<LevelKey, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
}
