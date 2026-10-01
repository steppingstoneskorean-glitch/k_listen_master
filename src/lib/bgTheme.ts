// src/lib/bgTheme.ts
// ─────────────────────────────────────────────────────────────────────────────
// 앱 배경색/테마 선택 — 학습자가 프로필에서 고른다. **기기(localStorage)에 저장**.
//   · <html> 의 data-theme(light|dark) + CSS 변수 --app-bg 로 적용.
//   · 라이트 프리셋은 --app-bg(앱 셸 배경)만 바꾼다 → 글씨·카드 그대로라 가독성 안전.
//   · dark 는 data-theme="dark" 로 index.css 의 다크 스킨(라이트 토큰 리맵)을 켠다.
//   · 전체화면 다크 페이지(Decode/Start 등)는 .app-shell 밖이라 영향 없음.
// ─────────────────────────────────────────────────────────────────────────────

export type BgThemeId = 'default' | 'cream' | 'mint' | 'sky' | 'lavender' | 'gray' | 'dark'

export interface BgThemeDef {
  id: BgThemeId
  labelKey: string // i18n 키 (프로필 스와치 라벨)
  swatch: string // 스와치 = 실제 배경색
  dark?: boolean
}

export const BG_THEMES: BgThemeDef[] = [
  { id: 'default', labelKey: 'bg.default', swatch: '#ffffff' },
  { id: 'cream', labelKey: 'bg.cream', swatch: '#fbf6ec' },
  { id: 'mint', labelKey: 'bg.mint', swatch: '#eafaf1' },
  { id: 'sky', labelKey: 'bg.sky', swatch: '#eaf2fd' },
  { id: 'lavender', labelKey: 'bg.lavender', swatch: '#f2ecfc' },
  { id: 'gray', labelKey: 'bg.gray', swatch: '#f1f3f5' },
  { id: 'dark', labelKey: 'bg.dark', swatch: '#0f141c', dark: true },
]

const KEY = 'klisten_bg_theme'

export function getBgTheme(): BgThemeId {
  try {
    const v = localStorage.getItem(KEY) as BgThemeId | null
    if (v && BG_THEMES.some((t) => t.id === v)) return v
  } catch {
    /* private mode 등 — 기본값 */
  }
  return 'default'
}

export function applyBgTheme(id: BgThemeId): void {
  const def = BG_THEMES.find((t) => t.id === id) ?? BG_THEMES[0]
  const el = document.documentElement
  el.setAttribute('data-theme', def.dark ? 'dark' : 'light')
  el.style.setProperty('--app-bg', def.swatch)
}

export function setBgTheme(id: BgThemeId): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* 저장 실패해도 적용은 진행 */
  }
  applyBgTheme(id)
}

/** 앱 부팅 시 저장된 테마 적용(첫 페인트 깜빡임 방지 — React 렌더 전에 호출). */
export function initBgTheme(): void {
  applyBgTheme(getBgTheme())
}
