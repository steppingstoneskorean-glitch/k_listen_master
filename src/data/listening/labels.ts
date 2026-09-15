// src/data/listening/labels.ts
// ─────────────────────────────────────────────────────────────────────────────
// 표시 레이어 — 내부 코드(phenomenon/changeType/rule)를 학습자용 친근한 말로 바꾼다.
//   · 화면에는 여기 라벨만 노출. 'front-shift'·'r17'·'제17항' 같은 내부값은 절대 노출 X.
//   · ko / en 만 우선 지원(그 외 언어는 en 폴백). 실서비스는 i18n 으로 확장.
// ─────────────────────────────────────────────────────────────────────────────

import type { Phenomenon, ChangeType } from './schema'

type Lang = string
interface Label { title: string; family: string }

const CHANGE: Record<'ko' | 'en', Record<ChangeType, string>> = {
  ko: {
    soften: '부드러워짐',
    flow: '흐름',
    'front-shift': '앞으로 옮김',
    breath: '거세짐',
    'h-weaken': 'ㅎ 약해짐',
  },
  en: {
    soften: 'Soften',
    flow: 'Flow',
    'front-shift': 'Front Shift',
    breath: 'Breath',
    'h-weaken': 'H-weaken',
  },
}

const FAMILY: Record<'ko' | 'en', Record<Phenomenon, string>> = {
  ko: { pause: '멈춤', carry: '이어가기', change: '소리 바뀜', 'sound-contrast': '소리 구별' },
  en: { pause: 'Pause', carry: 'Carry', change: 'Change', 'sound-contrast': 'Sound Contrast' },
}

const CHANGE_EN_FAMILY = 'Change'

function base(lang: Lang): 'ko' | 'en' {
  return lang.startsWith('ko') ? 'ko' : 'en'
}

/** 현상(+세부)을 학습자용 라벨로. family=큰 갈래(Pause/Carry/Change), title=화면 배지 텍스트. */
export function phenomenonLabel(
  phenomenon: Phenomenon | null,
  changeType: ChangeType | undefined,
  lang: Lang,
): Label {
  const l = base(lang)
  if (phenomenon === null) {
    return { title: l === 'ko' ? '듣기' : 'Listening', family: l === 'ko' ? '듣기' : 'Listening' }
  }
  if (phenomenon === 'change') {
    const fam = FAMILY[l].change
    const sub = changeType ? CHANGE[l][changeType] : ''
    return { title: sub ? `${fam} · ${sub}` : fam, family: l === 'ko' ? '소리 바뀜' : CHANGE_EN_FAMILY }
  }
  return { title: FAMILY[l][phenomenon], family: FAMILY[l][phenomenon] }
}
