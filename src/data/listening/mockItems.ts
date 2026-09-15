// src/data/listening/mockItems.ts
// ─────────────────────────────────────────────────────────────────────────────
// Decode Lab 데모용 목(mock) 데이터 — UI 흐름 확인 전용.
//   · 오디오 파일이 없어 화면에서는 브라우저 TTS 로 대체(데모 표시).
//   · 음운 매핑은 사용자(교사)가 제공한 값 기반이나, 실제 배포 전 검수 대상.
//   · 실제 콘텐츠는 items.json 에 교사가 태깅 → 이 파일을 교체.
// ─────────────────────────────────────────────────────────────────────────────

import type { DictationItem } from './schema'

export const MOCK_ITEMS: DictationItem[] = [
  {
    id: 9001, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '저는 밥을 먹어요', chunks: ['저는', '밥을', '먹어요'],
    annotations: [
      { phenomenon: 'carry', rule: 'r13', span: [3, 5], surface: '바블',
        note: '받침 ㅂ이 뒤 음절로 이어져 [바블]처럼 들려요.' },
    ],
  },
  {
    id: 9002, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '국물이 뜨거워요', chunks: ['국물이', '뜨거워요'],
    annotations: [
      { phenomenon: 'change', changeType: 'soften', rule: 'r18', span: [0, 2], surface: '궁물',
        note: 'ㄱ이 뒤의 ㅁ을 만나 [궁물]로 부드러워져요.' },
    ],
  },
  {
    id: 9003, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '같이 가요', chunks: ['같이', '가요'],
    annotations: [
      { phenomenon: 'change', changeType: 'front-shift', rule: 'r17', span: [0, 2], surface: '가치',
        note: '받침 ㅌ이 이와 만나 앞으로 옮겨 [가치]처럼 들려요.' },
    ],
  },
  {
    id: 9004, level: 'advanced', audioUrl: '', speed: 'normal',
    transcript: '신라 시대', chunks: ['신라', '시대'],
    annotations: [
      { phenomenon: 'change', changeType: 'flow', rule: 'r20', span: [0, 2], surface: '실라',
        note: 'ㄴ이 ㄹ에 이끌려 [실라]로 흘러요.' },
    ],
  },
  {
    id: 9005, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '축하해요', chunks: ['축하해요'],
    annotations: [
      { phenomenon: 'change', changeType: 'breath', rule: 'r12a', span: [0, 2], surface: '추카',
        note: 'ㅎ이 앞 소리와 합쳐 [추카]로 거세져요.' },
    ],
  },
  {
    id: 9006, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '좋아요', chunks: ['좋아요'],
    annotations: [
      { phenomenon: 'change', changeType: 'h-weaken', rule: 'r12h', span: [0, 3], surface: '조아요',
        note: 'ㅎ이 모음 앞에서 사라져 [조아요]로 들려요.' },
    ],
  },
  {
    id: 9007, level: 'intermediate', audioUrl: '', speed: 'normal',
    transcript: '학교에 가요', chunks: ['학교에', '가요'],
    annotations: [
      { phenomenon: 'pause', rule: 'r23', span: [0, 2], surface: '학꾜',
        note: '받침을 잠깐 잡았다 놓아 [학꾜]로 굳어져요.' },
    ],
  },
]
