// src/lib/hangul.ts
// ─────────────────────────────────────────────────────────────────────────────
// 두벌식 한글 조합기 (온스크린 키보드용).
//   · 자모를 순서대로 input() 하면 committed 문자열 + 조합 중 음절을 합쳐 반환.
//   · 겹모음(ㅘ/ㅙ/ㅚ/ㅝ/ㅞ/ㅟ/ㅢ)·겹받침(ㄳ/ㄵ/ㄺ…) 결합, 받침 이동(안+ㅣ→아니) 처리.
//   · React 제어 입력과 함께 쓰기 위해 syncExternal() 로 외부(직접 타이핑) 변경을 흡수한다.
//   Node 단위 테스트 10/10 통과(출발·안녕·값·닭·과·의·업서 등).
// ─────────────────────────────────────────────────────────────────────────────

const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ']
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']

const CHO_IDX: Record<string, number> = {}
CHO.forEach((c, i) => { CHO_IDX[c] = i })
const JONG_IDX: Record<string, number> = {}
JONG.forEach((c, i) => { if (c) JONG_IDX[c] = i })

const JUNG_COMB: Record<string, Record<string, string>> = {
  'ㅗ': { 'ㅏ': 'ㅘ', 'ㅐ': 'ㅙ', 'ㅣ': 'ㅚ' },
  'ㅜ': { 'ㅓ': 'ㅝ', 'ㅔ': 'ㅞ', 'ㅣ': 'ㅟ' },
  'ㅡ': { 'ㅣ': 'ㅢ' },
}
const JONG_COMB: Record<string, Record<string, string>> = {
  'ㄱ': { 'ㅅ': 'ㄳ' },
  'ㄴ': { 'ㅈ': 'ㄵ', 'ㅎ': 'ㄶ' },
  'ㄹ': { 'ㄱ': 'ㄺ', 'ㅁ': 'ㄻ', 'ㅂ': 'ㄼ', 'ㅅ': 'ㄽ', 'ㅌ': 'ㄾ', 'ㅍ': 'ㄿ', 'ㅎ': 'ㅀ' },
  'ㅂ': { 'ㅅ': 'ㅄ' },
}
const JONG_SPLIT: Record<string, [string, string]> = {
  'ㄳ': ['ㄱ','ㅅ'], 'ㄵ': ['ㄴ','ㅈ'], 'ㄶ': ['ㄴ','ㅎ'], 'ㄺ': ['ㄹ','ㄱ'], 'ㄻ': ['ㄹ','ㅁ'],
  'ㄼ': ['ㄹ','ㅂ'], 'ㄽ': ['ㄹ','ㅅ'], 'ㄾ': ['ㄹ','ㅌ'], 'ㄿ': ['ㄹ','ㅍ'], 'ㅀ': ['ㄹ','ㅎ'], 'ㅄ': ['ㅂ','ㅅ'],
}
const JUNG_SPLIT: Record<string, string> = {
  'ㅘ': 'ㅗ', 'ㅙ': 'ㅗ', 'ㅚ': 'ㅗ', 'ㅝ': 'ㅜ', 'ㅞ': 'ㅜ', 'ㅟ': 'ㅜ', 'ㅢ': 'ㅡ',
}

/** 이 자모가 자음인가(초/종성 가능) */
export function isConsonant(j: string): boolean { return CHO_IDX[j] !== undefined }
/** 이 자모가 모음인가 */
export function isVowel(j: string): boolean { return JUNG.includes(j) }

type Syl = { cho: number; jung: number; jong: number }

export class HangulComposer {
  private committed = ''
  private cur: Syl | null = null

  private syllable(): string {
    if (!this.cur) return ''
    const { cho, jung, jong } = this.cur
    if (cho >= 0 && jung >= 0) return String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + (jong < 0 ? 0 : jong))
    if (cho >= 0) return CHO[cho]
    if (jung >= 0) return JUNG[jung]
    return ''
  }

  /** 확정 문자열 + 조합 중 음절 */
  get text(): string { return this.committed + this.syllable() }

  private flush() { this.committed += this.syllable(); this.cur = null }

  /** 외부(직접 타이핑/부모 리셋)로 값이 바뀐 경우 조합 상태를 그 값으로 맞춘다 */
  syncExternal(value: string) { this.committed = value; this.cur = null }

  reset() { this.committed = ''; this.cur = null }

  /** 자모 하나 입력 → 갱신된 전체 텍스트 */
  input(j: string): string {
    if (isConsonant(j)) {
      if (!this.cur) { this.cur = { cho: CHO_IDX[j], jung: -1, jong: -1 }; return this.text }
      const { cho, jung, jong } = this.cur
      if (cho >= 0 && jung < 0) { this.flush(); this.cur = { cho: CHO_IDX[j], jung: -1, jong: -1 }; return this.text }
      if (cho >= 0 && jung >= 0 && jong < 0) {
        if (JONG_IDX[j] !== undefined) this.cur.jong = JONG_IDX[j]
        else { this.flush(); this.cur = { cho: CHO_IDX[j], jung: -1, jong: -1 } }
        return this.text
      }
      if (cho >= 0 && jung >= 0 && jong >= 0) {
        const cj = JONG[jong]
        const comb = JONG_COMB[cj] && JONG_COMB[cj][j]
        if (comb) this.cur.jong = JONG_IDX[comb]
        else { this.flush(); this.cur = { cho: CHO_IDX[j], jung: -1, jong: -1 } }
        return this.text
      }
    } else if (isVowel(j)) {
      if (!this.cur) { this.cur = { cho: -1, jung: JUNG.indexOf(j), jong: -1 }; return this.text }
      const { jung, jong } = this.cur
      if (jung < 0) { this.cur.jung = JUNG.indexOf(j); return this.text }
      if (jong < 0) {
        const comb = JUNG_COMB[JUNG[jung]] && JUNG_COMB[JUNG[jung]][j]
        if (comb) this.cur.jung = JUNG.indexOf(comb)
        else { this.flush(); this.cur = { cho: -1, jung: JUNG.indexOf(j), jong: -1 } }
        return this.text
      }
      // 받침이 있으면 다음 음절 초성으로 이동 (겹받침이면 뒷자음만 이동)
      const jc = JONG[jong]
      let moveCons: string, keepJong: number
      if (JONG_SPLIT[jc]) { keepJong = JONG_IDX[JONG_SPLIT[jc][0]]; moveCons = JONG_SPLIT[jc][1] }
      else { keepJong = -1; moveCons = jc }
      const pc = this.cur.cho, pj = this.cur.jung, kj = keepJong < 0 ? 0 : keepJong
      this.committed += String.fromCharCode(0xac00 + (pc * 21 + pj) * 28 + kj)
      this.cur = { cho: CHO_IDX[moveCons], jung: JUNG.indexOf(j), jong: -1 }
      return this.text
    }
    return this.text
  }

  /** 지우기 (조합 중이면 한 자모씩 분해, 아니면 확정 문자 하나 삭제) */
  backspace(): string {
    if (this.cur) {
      const { cho, jung, jong } = this.cur
      if (jong >= 0) {
        const s = JONG_SPLIT[JONG[jong]]
        this.cur.jong = s ? JONG_IDX[s[0]] : -1
      } else if (jung >= 0) {
        const sp = JUNG_SPLIT[JUNG[jung]]
        this.cur.jung = sp ? JUNG.indexOf(sp) : -1
        if (this.cur.cho < 0 && this.cur.jung < 0) this.cur = null
      } else if (cho >= 0) {
        this.cur = null
      } else {
        this.cur = null
      }
    } else if (this.committed) {
      this.committed = this.committed.slice(0, -1)
    }
    return this.text
  }

  /** 공백 */
  space(): string { this.flush(); this.committed += ' '; return this.text }

  /** 조합 확정(제출 직전 등) */
  commit(): string { this.flush(); return this.text }
}
