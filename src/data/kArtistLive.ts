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
      en: "Learn Korean while enjoying the members' healing journey.",
      ko: '멤버들의 힐링 여행과 함께 즐기는 한국어 공부',
      es: 'Aprende coreano mientras disfrutas del viaje de descanso de los miembros..',
      ja: 'メンバーたちの癒やしの旅を楽しみながら韓国語を学ぼう。',
    },
    artist: 'BTS',
    stars: 4,
    url: '/kpop-quiz/wu6bA3zK_us',
    videoId: 'wu6bA3zK_us',
    plays: 1,
    addedAt: 1,
    answer: '야! 야! 피자 같이 먹자.', // 한국어 고정 — 번역/치환 금지
  },
  {
    id: 2,
    title: { en: 'RunSeokJin Interview', ko: '런석진 인터뷰', es: 'Entrevista de RunSeokJin', ja: 'RunSeokJin インタビュー' },
    artist: 'BTS',
    stars: 3,
    url: '/kpop-quiz/ADw_zMarJdk',
    videoId: 'ADw_zMarJdk',
    plays: 0,
    addedAt: 2,
    desc: {
      en: "Learn Real Korean with Jin's Warm Voice",
      ko: '진(Jin)의 다정한 목소리로 배우는 리얼 한국어',
      es: 'Aprende coreano real con la cálida voz de Jin',
      ja: 'Jinの優しい声で学ぶリアル韓国語',
    },
  },
  {
    id: 3,
    title: { en: 'ATEEZ Unfiltered: Pre-Debut Hardships & Tour Secrets', ko: 'ATEEZ 필터 없는 토크: 데뷔 전 고충 & 투어 비밀', es: 'ATEEZ Revela: Secretos de su Pre-Debut y Gira Mundial', ja: 'ATEEZ激白、デビュー前の過酷な下積みと世界ツアーの裏話'},
    artist: 'Ateez',
    stars: 3,
    url: '/kpop-quiz/rBDBC82UmKo',
    videoId: 'rBDBC82UmKo',
    plays: 0,
    addedAt: 3,
     desc: {
      en: "A delightful chat between K-pop legend Kim Jae-joong and ATEEZ (San, Wooyoung, Yeosang)",
      ko: '가요계 대선배 김재중과 에이티즈(산, 우영, 여상)의 유쾌한 토크',
      es: 'Una divertida charla entre la gran leyenda del K-pop, Kim Jae-joong, y ATEEZ (San, Wooyoung, Yeosang)',
      ja: 'K-POP界の大先輩キム・ジェジュンとATEEZ（サン、ウヨン、ヨサン）の和気あいあいとしたトーク',
    },
  },
  {
    id: 4,
    title: { en: 'SKZ Group Vlog', ko: 'SKZ 단체 브이로그', es: 'SKZ Vlog grupal', ja: 'SKZ グループVlog' },
    artist: 'SKZ',
    stars: 4,
    url: '',
    plays: 0,
    addedAt: 4,
  },
  {
    id: 5,
    title: { en: 'Ateez Fan Meeting', ko: 'Ateez 팬미팅 현장', es: 'Ateez Fan meeting', ja: 'Ateez ファンミーティング' },
    artist: 'Ateez',
    stars: 2,
    url: '',
    plays: 0,
    addedAt: 5,
  },
]

/** '__all__' = 전체 필터 값 */
export const ARTISTS = ['__all__', 'BTS', 'Blackpink', 'EXO', 'SKZ', 'Ateez'] as const
export type ArtistFilter = (typeof ARTISTS)[number]

export const STAR_LEVELS = [0, 1, 2, 3, 4, 5] as const // 0 = 전체, 별점 최대 5
export type StarFilter = (typeof STAR_LEVELS)[number]
