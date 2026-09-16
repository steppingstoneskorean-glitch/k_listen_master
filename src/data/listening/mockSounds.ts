// src/data/listening/mockSounds.ts
// ─────────────────────────────────────────────────────────────────────────────
// Hear & Notice(핵심) 데모용 단일 단어 — "표기 vs 실제 소리" 흐름 확인 전용.
//   · 철학: Hear → Notice → Feel → Understand (규칙 암기 아님).
//   · note 는 전문용어 없이 감각 중심 설명(원문 문자열 → passthrough).
//   · 오디오 없음 → TTS 로 surface(실제 소리) 재생. 실제 콘텐츠는 녹음으로 교체.
// ─────────────────────────────────────────────────────────────────────────────

import type { DictationItem } from './schema'

export const SOUND_ITEMS: DictationItem[] = [
  { id: 7101, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '신고', chunks: ['신고'],
    annotations: [{ phenomenon: 'pause', rule: 'r24', span: [0, 2], surface: '신꼬',
      note: '받침 뒤 소리를 살짝 멈췄다 조금 더 세게 내요.' }] },
  { id: 7102, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '국물', chunks: ['국물'],
    annotations: [{ phenomenon: 'change', changeType: 'soften', rule: 'r18', span: [0, 2], surface: '궁물',
      note: '받침이 뒤 콧소리를 만나 부드럽게 바뀌어요.' }] },
  { id: 7103, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '같이', chunks: ['같이'],
    annotations: [{ phenomenon: 'change', changeType: 'front-shift', rule: 'r17', span: [0, 2], surface: '가치',
      note: '받침과 "이"가 만나 앞쪽에서 소리가 나요.' }] },
  { id: 7104, level: 'advanced', audioUrl: '', speed: 'normal', transcript: '신라', chunks: ['신라'],
    annotations: [{ phenomenon: 'change', changeType: 'flow', rule: 'r20', span: [0, 2], surface: '실라',
      note: '두 소리가 만나면서 부드럽게 이어져요.' }] },
  { id: 7105, level: 'advanced', audioUrl: '', speed: 'normal', transcript: '정리', chunks: ['정리'],
    annotations: [{ phenomenon: 'change', changeType: 'flow', rule: 'r19', span: [0, 2], surface: '정니',
      note: 'ㄹ이 물러나 콧소리처럼 들려요.' }] },
  { id: 7106, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '좋아요', chunks: ['좋아요'],
    annotations: [{ phenomenon: 'h-weaken', rule: 'r12h', span: [0, 3], surface: '조아요',
      note: 'ㅎ이 모음 앞에서 힘없이 사라져요.' }] },
  { id: 7107, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '축하', chunks: ['축하'],
    annotations: [{ phenomenon: 'change', changeType: 'breath', rule: 'r12a', span: [0, 2], surface: '추카',
      note: 'ㅎ과 만나 숨이 섞여 거세게 들려요.' }] },
  { id: 7108, level: 'intermediate', audioUrl: '', speed: 'normal', transcript: '한국어', chunks: ['한국어'],
    annotations: [{ phenomenon: 'carry', rule: 'r13', span: [0, 3], surface: '한구거',
      note: '받침이 뒤로 넘어가 소리가 이어져요.' }] },
]
