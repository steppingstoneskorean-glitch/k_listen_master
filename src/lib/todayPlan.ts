// src/lib/todayPlan.ts
// ─────────────────────────────────────────────────────────────────────────────
// "오늘의 계획" (Today's Plan) local state.
//   · 사용자가 오늘 고른 레벨/세부레벨과, 순서대로 완료한 단계를 날짜별로 localStorage 에 보관.
//   · 자정(날짜 변경) 시 자동 리셋 — 매일 새 계획으로 시작.
//   · Firestore 가 아닌 로컬 저장: 계획은 '오늘 하루' 성격이라 기기별로 가벼우면 충분.
//
// 3단계 순서: Catch the Sound 게임 → 영상 1개 → 복습.  (섀도잉은 옵션이라 순서 밖)
//   · subLevel 의 의미는 레벨에 따라 다르다:
//       - beginner:     게임 시작 레벨 1~4 (별 개수). 이후 레벨은 이어서 진행.
//       - intermediate/advanced: 받아쓰기 빈칸 개수 1~2 (EASY/HARD).
// ─────────────────────────────────────────────────────────────────────────────

import type { LevelKey } from '@/data/gameLevels'

export type PlanStepKey = 'game' | 'video' | 'review' | 'shadow'

/** 필수 순서 단계 (섀도잉은 옵션이라 제외) */
export const ORDERED_STEPS: PlanStepKey[] = ['game', 'video', 'review']

export interface TodayPlan {
  date: string // YYYY-MM-DD
  level: LevelKey | null
  /** 레벨별 세부 선택값. beginner=시작레벨(1~4), int/adv=빈칸 개수(1~2) */
  subLevel: number
  done: PlanStepKey[]
}

const KEY = 'klisten_today_plan_v1'
const LEVEL_KEY = 'klisten_level_v1' // 영속 레벨(프로필) — 일일 계획 리셋과 분리

/** 사용자가 정한 레벨(초/중/고 + 세부). 매일 리셋되지 않고 유지된다. */
export interface LevelPref { level: LevelKey; subLevel: number }

export function getLevelPref(): LevelPref | null {
  try {
    const raw = localStorage.getItem(LEVEL_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<LevelPref>
    if (!p.level) return null
    return { level: p.level as LevelKey, subLevel: typeof p.subLevel === 'number' ? p.subLevel : 1 }
  } catch {
    return null
  }
}

export function setLevelPref(level: LevelKey, subLevel: number): void {
  try {
    localStorage.setItem(LEVEL_KEY, JSON.stringify({ level, subLevel }))
  } catch {
    /* storage disabled — 레벨은 계획에도 저장되니 치명적이지 않음 */
  }
}

export function clearLevelPref(): void {
  try {
    localStorage.removeItem(LEVEL_KEY)
  } catch {
    /* ignore */
  }
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function empty(): TodayPlan {
  // 일일 리셋 시에도 레벨은 영속 pref 에서 이어받는다(매일 레벨 재선택 마찰 제거).
  const pref = getLevelPref()
  return { date: todayStr(), level: pref?.level ?? null, subLevel: pref?.subLevel ?? 1, done: [] }
}

/** 오늘의 계획을 읽어온다. 날짜가 바뀌었으면 새 계획으로 리셋. */
export function loadPlan(): TodayPlan {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<TodayPlan>
    if (parsed.date !== todayStr()) return empty()
    return {
      date: todayStr(),
      level: (parsed.level as LevelKey) ?? null,
      subLevel: typeof parsed.subLevel === 'number' ? parsed.subLevel : 1,
      done: Array.isArray(parsed.done) ? (parsed.done as PlanStepKey[]) : [],
    }
  } catch {
    return empty()
  }
}

function save(plan: TodayPlan): TodayPlan {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan))
  } catch {
    /* storage full / disabled — plan just won't persist */
  }
  return plan
}

/** 오늘의 레벨 + 세부레벨을 설정(또는 변경)한다. 영속 pref 에도 저장해 매일 유지된다. */
export function setPlanLevel(level: LevelKey, subLevel: number): TodayPlan {
  setLevelPref(level, subLevel)
  const plan = loadPlan()
  return save({ ...plan, level, subLevel })
}

/** 한 단계를 완료로 표시한다(중복 방지). */
export function markStepDone(step: PlanStepKey): TodayPlan {
  const plan = loadPlan()
  if (plan.done.includes(step)) return plan
  return save({ ...plan, done: [...plan.done, step] })
}

/** 계획을 처음부터 다시(레벨 재선택). 영속 pref 도 지워 선택 화면이 다시 나오게 한다. */
export function resetPlan(): TodayPlan {
  clearLevelPref()
  return save(empty())
}

/** 순서 단계 중 몇 개를 끝냈는지 (0~ORDERED_STEPS.length) */
export function orderedDoneCount(plan: TodayPlan): number {
  return ORDERED_STEPS.filter(s => plan.done.includes(s)).length
}

/** 다음에 해야 할 순서 단계. 모두 끝냈으면 null. */
export function nextStep(plan: TodayPlan): PlanStepKey | null {
  return ORDERED_STEPS.find(s => !plan.done.includes(s)) ?? null
}
