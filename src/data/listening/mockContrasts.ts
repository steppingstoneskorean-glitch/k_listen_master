// src/data/listening/mockContrasts.ts
// ─────────────────────────────────────────────────────────────────────────────
// Contrast Lab 데모용 목 데이터 — 변별(discriminate) 흐름 확인 전용.
//   · 오디오 없음 → TTS 로 surface 를 재생.
//   · 신고/신문은 실제 예시(StringId 번역 경로) · 나머지는 원문 문자열(passthrough).
//   · 실제 콘텐츠는 items.json / contrast-sets.json 태깅으로 교체.
// ─────────────────────────────────────────────────────────────────────────────

import type { DictationItem, ContrastSet } from './schema'

export const CONTRAST_ITEMS: DictationItem[] = [
  { id: 8001, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '신고', chunks: ['신고'],
    annotations: [{ phenomenon: 'pause', rule: 'r24', span: [0, 2], surface: '신꼬', note: 'note.item.singo' }] },
  { id: 8002, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '신문', chunks: ['신문'],
    annotations: [], commonErrors: [{ surface: '싱뭉', l1: 'ja' }, { surface: '싱문', l1: 'ja' }] },

  { id: 8003, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '같이', chunks: ['같이'],
    annotations: [{ phenomenon: 'change', changeType: 'front-shift', rule: 'r17', span: [0, 2], surface: '가치',
      note: '받침 ㅌ이 이와 만나 앞으로 옮겨 [가치]처럼 들려요.' }] },
  { id: 8004, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '잔디', chunks: ['잔디'],
    annotations: [] },

  { id: 8005, level: 'advanced', audioUrl: '', speed: 'normal', transcript: '신라', chunks: ['신라'],
    annotations: [{ phenomenon: 'change', changeType: 'flow', rule: 'r20', span: [0, 2], surface: '실라',
      note: 'ㄴ이 ㄹ에 이끌려 [실라]로 흘러요.' }] },
  { id: 8006, level: 'advanced', audioUrl: '', speed: 'normal', transcript: '정리', chunks: ['정리'],
    annotations: [{ phenomenon: 'change', changeType: 'flow', rule: 'r19', span: [0, 2], surface: '정니',
      note: 'ㄹ이 물러나 [정니]로 들려요.' }] },
]

export const CONTRAST_SETS: ContrastSet[] = [
  { id: 1, axis: 'ax.gyeongeumhwa', question: 'q.gyeongeumhwa.eomi',
    members: [{ ref: 8001, firedRule: 'r24' }, { ref: 8002, firedRule: null }],
    note: 'note.contrast.singo_sinmun' },

  { id: 2, axis: 'ax.gugaeeumhwa', question: '받침 뒤에 "이"가 붙어 소리가 바뀌었나요?',
    members: [{ ref: 8003, firedRule: 'r17' }, { ref: 8004, firedRule: null }],
    note: '같이는 [가치]로 바뀌지만, 잔디는 그대로예요.' },

  { id: 3, axis: 'ax.yueumhwa', question: 'ㄴ과 ㄹ이 만나 어느 쪽 소리로 들리나요?',
    members: [{ ref: 8005, firedRule: 'r20' }, { ref: 8006, firedRule: 'r19' }],
    note: '신라는 ㄹ로 흐르고(실라), 정리는 ㄴ으로 물러서요(정니).' },
]
