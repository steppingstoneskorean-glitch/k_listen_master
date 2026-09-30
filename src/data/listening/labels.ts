// src/data/listening/labels.ts
// ─────────────────────────────────────────────────────────────────────────────
// 표시 레이어 — 내부 코드(phenomenon/changeType/rule)를 학습자용 친근한 말로.
//   · 화면 라벨은 책 프레임과 연동: 막힘·넘김·바뀜·읽기 (en: Pause·Carry·Change·Reading = 책 제목 → 홍보).
//   · 'front-shift'·'r17'·'제17항' 같은 내부값은 절대 노출 X.
//   · ko / en 만 우선(그 외 언어는 en 폴백). 실서비스는 i18n 으로 확장.
// ─────────────────────────────────────────────────────────────────────────────

import type { Phenomenon, ChangeType } from './schema'

type Lang = string
export interface Label { title: string; subtitle: string }

// 내부 phenomenon → 화면 말(title) + 한 줄 설명(subtitle). note 설명과 같은 프레임.
const PHENO: Record<'ko' | 'en', Record<Phenomenon, Label>> = {
  ko: {
    pause: { title: '막힘', subtitle: '공기가 잠깐 갇혔다 터져 나오면서 뒤 소리가 세게 나요.' },
    carry: { title: '넘김', subtitle: "받침이 다음 소리로 이어져요. 받침 뒤에 모음이 오면, 빈 소리인 'ㅇ' 자리에 받침 소리가 가요." },
    change: { title: '바뀜', subtitle: '두 소리가 만나면서 소리가 달라져요.' },
    'h-weaken': { title: '바뀜', subtitle: '두 소리가 만나면서 소리가 달라져요.' },
    reading: { title: '읽기', subtitle: '옆 소리 없이도 정해집니다' },
    'sound-contrast': { title: '소리 구별', subtitle: '비슷한 소리를 가려냅니다' },
  },
  en: {
    pause: { title: 'Pause', subtitle: 'Air is briefly trapped, then bursts out — the next sound comes out strong.' },
    carry: { title: 'Carry', subtitle: "The batchim carries into the next syllable. When a vowel follows, it fills the empty 'ㅇ' slot." },
    change: { title: 'Change', subtitle: 'Two sounds meet and the sound changes.' },
    'h-weaken': { title: 'Change', subtitle: 'Two sounds meet and the sound changes.' },
    reading: { title: 'Reading', subtitle: 'Decided on its own, no neighbor needed' },
    'sound-contrast': { title: 'Sound contrast', subtitle: 'Tell close sounds apart' },
  },
}

// change 세부(선택) — 화면엔 "바뀜 · 부드러워짐" 처럼 붙인다.
const CHANGE_SUB: Record<'ko' | 'en', Record<ChangeType, string>> = {
  ko: { soften: '부드러워짐', flow: '흐름', 'front-shift': '앞으로 옮김', breath: '거세짐' },
  en: { soften: 'Soften', flow: 'Flow', 'front-shift': 'Front shift', breath: 'Breath' },
}

function base(lang: Lang): 'ko' | 'en' {
  return lang.startsWith('ko') ? 'ko' : 'en'
}

/** 현상(+세부)을 학습자용 라벨로. title=화면 배지, subtitle=한 줄 설명(책 프레임 연동). */
export function phenomenonLabel(
  phenomenon: Phenomenon | null,
  changeType: ChangeType | undefined,
  lang: Lang,
): Label {
  const l = base(lang)
  if (phenomenon === null) return { title: l === 'ko' ? '듣기' : 'Listening', subtitle: '' }
  const b = PHENO[l][phenomenon]
  if (phenomenon === 'change' && changeType) {
    return { title: `${b.title} · ${CHANGE_SUB[l][changeType]}`, subtitle: b.subtitle }
  }
  return b
}
