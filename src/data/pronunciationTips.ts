// src/data/pronunciationTips.ts
// ─────────────────────────────────────────────────────────────────────────────
// 발음팁(사람이 큐레이션한 고정 텍스트) — 최소 대립쌍별 발음 차이 설명.
//   · AI 생성이 아니라 손으로 작성한 문장이라 정확하고 안정적이다.
//   · 팁이 있는 쌍만 표시한다 — 없는 쌍은 팁 없이 넘어간다(품질 우선, 이후 수기 추가).
//   · 게임 쌍이 3개 단어여도(예: 딸/탈/달) 해당 팁의 단어가 모두 포함되면 매칭된다.
//   (기존 AudioGame 초급 발음드릴에서 이식)
// ─────────────────────────────────────────────────────────────────────────────

type Tip = { words: string[]; tip: string }

const TIPS: Tip[] = [
  { words: ['불', '뿔'], tip: '불[bul] vs 뿔[ppul] — ㅂ는 유성음, ㅃ는 경음(된소리)으로 성대 긴장도가 다릅니다.' },
  { words: ['살', '쌀'], tip: '살[sal] vs 쌀[ssal] — ㅅ(평음)과 ㅆ(경음)의 기식량 차이를 느껴보세요.' },
  { words: ['달', '탈'], tip: '달[dal] vs 탈[tal] — ㄷ(무기음)과 ㅌ(유기음)의 차이. ㅌ 발음 시 입 앞에 손을 대면 바람이 느껴져요!' },
  { words: ['구름', '그림'], tip: '구름[gureum] vs 그림[geurim] — 모음 ㅜ와 ㅡ의 입 모양 차이가 핵심입니다.' },
  { words: ['밤', '밥'], tip: '밤[bam] vs 밥[bap] — 받침 ㅁ(nasal)과 ㅂ(stop)은 입술 여는 방식이 완전히 달라요.' },
]

/** 대립쌍에 해당하는 발음팁을 반환한다. 없으면 null. */
export function getPronunciationTip(pair: string[]): string | null {
  const set = new Set(pair)
  for (const t of TIPS) {
    if (t.words.every(w => set.has(w))) return t.tip
  }
  return null
}
