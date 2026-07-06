// src/data/kArtistLive.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Artist Live 영상 데이터 (홈 캐러셀 + Game Hub 공용)
//   · title/desc 는 다국어 객체(Localized) — pickText 로 해석
//   · answer(딕테이션 정답)는 학습 원문이므로 한국어 문자열로만 고정
//   · plays(누적 도전 수) / addedAt(등록 순서) 는 Game Hub 정렬용 메타데이터
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from '@/lib/i18n'

/* 다국어 텍스트 객체: en 은 필수(폴백), 나머지 언어는 선택 */
export type Localized = { en: string } & Partial<Record<Lang, string>>

export function pickText(localized: Localized, lang: Lang): string {
  return localized[lang] ?? localized.en
}

export interface LiveVideo {
  id: number
  /** 제목/설명: 다국어 객체로 관리 (브라우저 자동 번역과 무관하게 언어 전환) */
  title: Localized
  desc?: Localized
  artist: string
  stars: number // 1~5 (난이도)
  url: string // 학습 페이지 경로. 빈 문자열이면 Coming Soon
  videoId?: string // 유튜브 썸네일용
  /** 누적 도전 수 (인기순 정렬) */
  plays: number
  /** 등록 순서/시각 (최신순 정렬, 값이 클수록 최신) */
  addedAt: number
  /**
   * 딕테이션 정답 스크립트 — ⚠️ 오직 한국어 문자열만 허용.
   * 다국어 객체로 만들지 말 것. 화면에 표시할 때는 반드시
   * translate="no" + className="notranslate" 로 감싸 자동 번역을 차단한다.
   */
  answer?: string
}

// 카테고리 분류를 위한 artist / stars 필수 포함
export const LIVE_VIDEOS: LiveVideo[] = [
  {
    id: 1,
    title: {
      en: 'BTS Everyday Talk · Healing(?) Trip',
      ko: 'BTS 일상 대화 · 방탄이가 방에 들어가신다',
      es: 'BTS Charla cotidiana · Viaje sanador(?)',
      ja: 'BTS 日常会話 · 癒やし(?)旅行',
    },
    desc: {
      en: 'Catch real casual endings like “-자 (let’s)” from a live chat.',
      ko: '실제 대화 속 “-자(같이 하자)” 반말 어미를 잡아내 보세요.',
      es: 'Capta terminaciones informales reales como “-자 (hagamos)”.',
      ja: '実際の会話から「-자（〜しよう）」のタメ口語尾を聞き取ろう。',
    },
    artist: 'BTS',
    stars: 3,
    url: '/kpop-quiz',
    videoId: 'wu6bA3zK_us',
    plays: 1280,
    addedAt: 6,
    answer: '야! 야! 피자 같이 먹자.', // 한국어 고정 — 번역/치환 금지
  },
  {
    id: 2,
    title: { en: 'Blackpink Live Talk', ko: 'Blackpink 라이브 토크', es: 'Blackpink Charla en vivo', ja: 'Blackpink ライブトーク' },
    artist: 'Blackpink',
    stars: 2,
    url: '',
    plays: 340,
    addedAt: 5,
  },
  {
    id: 3,
    title: { en: 'EXO Reality Show Talk', ko: 'EXO 리얼 예능 대화', es: 'EXO Charla de reality', ja: 'EXO リアルバラエティ会話' },
    artist: 'EXO',
    stars: 3,
    url: '',
    plays: 210,
    addedAt: 4,
  },
  {
    id: 4,
    title: { en: 'SKZ Group Vlog', ko: 'SKZ 단체 브이로그', es: 'SKZ Vlog grupal', ja: 'SKZ グループVlog' },
    artist: 'SKZ',
    stars: 4,
    url: '',
    plays: 505,
    addedAt: 3,
  },
  {
    id: 5,
    title: { en: 'Ateez Fan Meeting', ko: 'Ateez 팬미팅 현장', es: 'Ateez Fan meeting', ja: 'Ateez ファンミーティング' },
    artist: 'Ateez',
    stars: 2,
    url: '',
    plays: 150,
    addedAt: 2,
  },
  {
    id: 6,
    title: { en: 'BTS Late-Night Live Chat', ko: 'BTS 심야 라이브 수다', es: 'BTS Charla nocturna en vivo', ja: 'BTS 深夜ライブおしゃべり' },
    artist: 'BTS',
    stars: 5,
    url: '',
    plays: 890,
    addedAt: 1,
  },
]

/** '__all__' = 전체 필터 값 */
export const ARTISTS = ['__all__', 'BTS', 'Blackpink', 'EXO', 'SKZ', 'Ateez'] as const
export type ArtistFilter = (typeof ARTISTS)[number]

export const STAR_LEVELS = [0, 1, 2, 3, 4, 5] as const // 0 = 전체, 별점 최대 5
export type StarFilter = (typeof STAR_LEVELS)[number]
