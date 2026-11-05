// api/_lib/koPron.mjs
// ─────────────────────────────────────────────────────────────────────────────
// 한국어 표준 발음 근사 엔진 — "글자와 발음이 다른 곳"을 규칙으로 찾는다.
//   · AI 퀴즈 생성(quizGen.mjs)이 출제 우선순위를 정하고 해설의 "Sounds like:" 줄을 쓰는 데 쓴다.
//     LLM 은 이 판단이 부정확하다(실측: '이야기예요 → [이야기예요]'를 연음이라 표기) — 그래서 규칙으로 계산한다.
//   · 표준 발음법 중 자주 들리고 예외가 적은 규칙만 다룬다:
//     연음(13~15항), 구개음화(17), 격음화(12), ㅎ 탈락·약화(12-4), 비음화(18·19), 유음화(20), 경음화(23·24·27).
//     ㄴ 첨가·사잇소리·한자어 경음화처럼 낱말을 알아야 하는 규칙은 다루지 않는다(놓쳐도 우선순위만 밀릴 뿐).
//   · 음절 하나가 음절 하나로 바뀌므로 발음 문자열은 원문과 글자 위치가 같다.
// ─────────────────────────────────────────────────────────────────────────────

const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('')
const V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('')
const T = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'.split('')]

const isHangul = (ch) => ch >= '가' && ch <= '힣'
function split(ch) {
  const c = ch.charCodeAt(0) - 0xac00
  return { l: L[Math.floor(c / 588)], v: V[Math.floor((c % 588) / 28)], t: T[c % 28] }
}
const join = ({ l, v, t }) => String.fromCharCode(0xac00 + (L.indexOf(l) * 21 + V.indexOf(v)) * 28 + T.indexOf(t))

// 받침 대표음 (자음 앞)
const REP = {
  ㄱ: 'ㄱ', ㄲ: 'ㄱ', ㅋ: 'ㄱ', ㄳ: 'ㄱ', ㄺ: 'ㄱ',
  ㄴ: 'ㄴ', ㄵ: 'ㄴ', ㄶ: 'ㄴ',
  ㄷ: 'ㄷ', ㅅ: 'ㄷ', ㅆ: 'ㄷ', ㅈ: 'ㄷ', ㅊ: 'ㄷ', ㅌ: 'ㄷ', ㅎ: 'ㄷ',
  ㄹ: 'ㄹ', ㄼ: 'ㄹ', ㄽ: 'ㄹ', ㄾ: 'ㄹ', ㅀ: 'ㄹ',
  ㅁ: 'ㅁ', ㄻ: 'ㅁ',
  ㅂ: 'ㅂ', ㅍ: 'ㅂ', ㅄ: 'ㅂ', ㄿ: 'ㅂ',
  ㅇ: 'ㅇ',
}
// 겹받침 + 모음: 앞 받침은 남고 뒤 자음이 넘어간다 (ㅅ 은 된소리로)
const DOUBLE_LINK = {
  ㄳ: ['ㄱ', 'ㅆ'], ㄵ: ['ㄴ', 'ㅈ'], ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅆ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅄ: ['ㅂ', 'ㅆ'],
}
const ASPIRATE = { ㄱ: 'ㅋ', ㄷ: 'ㅌ', ㅂ: 'ㅍ', ㅈ: 'ㅊ' }
const TENSE = { ㄱ: 'ㄲ', ㄷ: 'ㄸ', ㅂ: 'ㅃ', ㅅ: 'ㅆ', ㅈ: 'ㅉ' }
const NASAL = { ㄱ: 'ㅇ', ㄷ: 'ㄴ', ㅂ: 'ㅁ' }

/** 규칙 이름(한국어) → 학습자용 영어 이름 */
export const RULE_EN = {
  연음: 'liaison',
  구개음화: 'palatalization',
  격음화: 'aspiration',
  'ㅎ 탈락': 'silent ㅎ',
  'ㅎ 약화': 'weak ㅎ',
  '의→에': '의 said as 에',
  비음화: 'nasalization',
  유음화: 'ㄹ assimilation',
  경음화: 'tensing',
}

// 받침 c 와 다음 초성 o 사이 (같은 어절 안). a/b 는 split() 결과를 직접 고친다. 적용된 규칙 이름을 돌려준다.
function applyBoundary(a, b, next2) {
  const c = a.t
  const o = b.l
  if (!c) return []

  // ── 다음 음절이 모음으로 시작 ──
  if (o === 'ㅇ') {
    if (c === 'ㅇ') return []
    if (c === 'ㅎ') { a.t = ''; return ['ㅎ 탈락'] }
    if (c === 'ㄶ' || c === 'ㅀ') { a.t = ''; b.l = c === 'ㄶ' ? 'ㄴ' : 'ㄹ'; return ['ㅎ 탈락', '연음'] }
    if (DOUBLE_LINK[c]) { [a.t, b.l] = DOUBLE_LINK[c]; return ['연음'] }
    if ((c === 'ㄷ' || c === 'ㅌ') && b.v === 'ㅣ') { a.t = ''; b.l = c === 'ㄷ' ? 'ㅈ' : 'ㅊ'; return ['구개음화'] }
    a.t = ''
    b.l = c
    return ['연음']
  }

  // ── 받침 ㅎ (ㄶ·ㅀ 포함) + 자음 ──
  if (c === 'ㅎ' || c === 'ㄶ' || c === 'ㅀ') {
    const base = c === 'ㅎ' ? '' : c === 'ㄶ' ? 'ㄴ' : 'ㄹ'
    if (ASPIRATE[o]) { a.t = base; b.l = ASPIRATE[o]; return ['격음화'] }
    if (o === 'ㅅ') { a.t = base; b.l = 'ㅆ'; return ['경음화'] }
    if (o === 'ㄴ') {
      if (c === 'ㅎ') { a.t = 'ㄴ'; return ['비음화'] } // 놓는 [논는]
      if (c === 'ㄶ') { a.t = 'ㄴ'; return ['ㅎ 탈락'] } // 않는 [안는]
      a.t = 'ㄹ'; b.l = 'ㄹ'; return ['ㅎ 탈락', '유음화'] // 싫네 [실레]
    }
    a.t = base || 'ㄷ'
    return base ? ['ㅎ 탈락'] : []
  }

  // ── 받침 + ㅎ ──
  if (o === 'ㅎ') {
    const r = REP[c]
    if (r === 'ㄱ' || r === 'ㄷ' || r === 'ㅂ') {
      // 겹받침은 앞 자음이 남는다: 읽히다 [일키다], 앉히다 [안치다]
      if (c === 'ㄺ' || c === 'ㄼ') { a.t = 'ㄹ'; b.l = c === 'ㄺ' ? 'ㅋ' : 'ㅍ'; return ['격음화'] }
      a.t = ''
      // 맞히다 [마치다] · 닫히다 [다치다](구개음화) · 못해 [모태]
      if (c === 'ㅈ' || c === 'ㅊ') b.l = 'ㅊ'
      else b.l = r === 'ㄷ' && b.v === 'ㅣ' ? 'ㅊ' : ASPIRATE[r]
      return ['격음화']
    }
    if (c === 'ㄵ') { a.t = 'ㄴ'; b.l = 'ㅊ'; return ['격음화'] }
    // ㄴㄹㅁ + ㅎ: 말할 때 ㅎ 이 약해져 앞 받침이 넘어간다 — 전화 [저놔], 열심히 [열시미]
    if (c === 'ㄴ' || c === 'ㄹ' || c === 'ㅁ') { a.t = ''; b.l = c; return ['ㅎ 약화'] }
    return []
  }

  const r = c === 'ㄺ' && o === 'ㄱ' ? 'ㄹ' : c === 'ㄼ' && a.l === 'ㅂ' && a.v === 'ㅏ' ? 'ㅂ' : REP[c] // 읽고 [일꼬], 밟다 [밥따]
  const rules = []
  let t = r
  let l = o

  if (NASAL[r] && (o === 'ㄴ' || o === 'ㅁ')) { t = NASAL[r]; rules.push('비음화') }
  else if (o === 'ㄹ') {
    if (r === 'ㅁ' || r === 'ㅇ') { l = 'ㄴ'; rules.push('비음화') } // 음료 [음뇨]
    else if (r === 'ㄱ' || r === 'ㅂ') { t = NASAL[r]; l = 'ㄴ'; rules.push('비음화') } // 독립 [동닙]
    else if (r === 'ㄴ') { t = 'ㄹ'; rules.push('유음화') } // 신라 [실라]
  } else if (r === 'ㄹ' && o === 'ㄴ') { l = 'ㄹ'; rules.push('유음화') } // 설날 [설랄]
  else if ((r === 'ㄱ' || r === 'ㄷ' || r === 'ㅂ') && TENSE[o]) { l = TENSE[o]; rules.push('경음화') } // 학교 [학꾜]
  else if (c === 'ㄺ' && o === 'ㄱ') { l = 'ㄲ'; rules.push('경음화') } // 읽고 [일꼬]
  else if ((c === 'ㄵ' || c === 'ㄻ') && TENSE[o] && o !== 'ㅂ') { l = TENSE[o]; rules.push('경음화') } // 앉고 [안꼬]
  else if (r === 'ㄹ' && c === 'ㄹ' && futureTense(b, next2)) { l = TENSE[o]; rules.push('경음화') } // 할게요 [할께요]

  a.t = t
  b.l = l
  return rules
}

// 같은 어절 안의 -ㄹ게요 / -ㄹ거예요(붙여 쓴 경우) / -ㄹ수록 — 관형형 ㄹ 뒤 경음화
function futureTense(b, next2) {
  const syl = join(b)
  if (syl === '게') return next2 === '요'
  if (syl === '거') return next2 != null && '예야죠든면'.includes(next2)
  if (syl === '수') return next2 === '록'
  return false
}

// 띄어 쓴 의존 명사 앞 관형형 ㄹ — 할 수 [할 쑤], 갈 거예요 [갈 꺼예요]
const BOUND_NOUNS = new Set(['수', '거', '것', '걸', '겁', '건', '게', '데', '줄', '적', '바'])

/**
 * 문장 → { pron, rulesAt }
 *   pron:    원문과 같은 길이의 발음 문자열 (어절 끝 받침은 표기 그대로 둔다 — '옷' 처럼 사소한 대표음은 무시)
 *   rulesAt: 글자 위치 → 그 글자에 걸린 규칙 이름들 (경계 규칙은 양쪽 음절에 모두 기록)
 */
export function pronounce(text) {
  const chars = [...text]
  const syl = chars.map((ch) => (isHangul(ch) ? split(ch) : null))
  const rulesAt = new Map()
  const crossAt = new Set() // 앞 어절 때문에 바뀐 어절 첫 글자 — 메모에서 앞 어절과 묶어 보여 준다
  const mark = (i, rules) => {
    if (!rules.length) return
    const set = rulesAt.get(i) || new Set()
    rules.forEach((r) => set.add(r))
    rulesAt.set(i, set)
  }

  for (let i = 0; i < chars.length - 1; i++) {
    const a = syl[i]
    if (!a) continue
    if (syl[i + 1]) {
      const n2 = chars[i + 2] && isHangul(chars[i + 2]) ? chars[i + 2] : null
      const rules = applyBoundary(a, syl[i + 1], n2)
      mark(i, rules)
      mark(i + 1, rules)
      continue
    }
    // 띄어쓰기 하나를 사이에 둔 어절 경계 — 확실한 두 경우만
    const b = chars[i + 1] === ' ' ? syl[i + 2] : null
    if (!b) continue
    const wordStart = i === 0 || !syl[i - 1]
    if (wordStart && chars[i] === '못' && b.l === 'ㅎ') {
      // 못 해요 [모 태요]
      a.t = ''
      b.l = 'ㅌ'
      mark(i, ['격음화'])
      mark(i + 2, ['격음화'])
      crossAt.add(i + 2)
    } else if (a.t === 'ㄹ' && TENSE[b.l] && BOUND_NOUNS.has(chars[i + 2])) {
      b.l = TENSE[b.l]
      mark(i, ['경음화'])
      mark(i + 2, ['경음화'])
      crossAt.add(i + 2)
    }
  }

  // 조사 '의'는 [에]로 — 한국의 [한구게]. 어절 첫 글자 '의'(의자, 의사)는 그대로 둔다
  for (let i = 1; i < chars.length; i++) {
    if (chars[i] === '의' && syl[i - 1] && (!syl[i + 1] || i + 1 >= chars.length)) {
      syl[i].v = 'ㅔ'
      mark(i, ['의→에'])
    }
  }

  const pron = chars.map((ch, i) => (syl[i] ? join(syl[i]) : ch)).join('')
  return { pron, rulesAt, crossAt }
}

/**
 * text 의 [from, to) 구간에서 발음이 표기와 다른 어절들 → "Sounds like:" 메모
 *   반환: { note: 'Sounds like: 맛있어요 → [마시써요] (liaison)' | '', rules: string[] }
 */
export function soundChangeNote(text, from = 0, to = text.length) {
  const { pron, rulesAt, crossAt } = pronounce(text)
  const chars = [...text]
  const pchars = [...pron]
  // 글자 단위 위치 — text 가 서로게이트 문자를 포함해도 어긋나지 않게 [...text] 기준으로 맞춘다
  const startIdx = [...text.slice(0, from)].length
  const endIdx = startIdx + [...text.slice(from, to)].length
  const words = []
  let i = 0
  while (i < chars.length) {
    if (chars[i] === ' ') { i++; continue }
    let j = i
    while (j < chars.length && chars[j] !== ' ') j++
    const rules = new Set()
    let differs = false
    for (let k = Math.max(i, startIdx); k < Math.min(j, endIdx); k++) {
      if (pchars[k] !== chars[k] && rulesAt.has(k)) {
        differs = true
        rulesAt.get(k).forEach((r) => rules.add(r))
      }
    }
    if (differs) {
      const strip = (s) => s.replace(/[.,!?…~"'“”‘’()]/g, '')
      const w = { start: i, end: j, rules: [...rules] }
      const prev = words[words.length - 1]
      if (crossAt.has(i) && prev && prev.end === i - 1) {
        // 할 수 [할 쑤] — 두 어절을 한 덩어리로
        prev.end = j
        prev.rules = [...new Set([...prev.rules, ...w.rules])]
      } else {
        if (crossAt.has(i) && i >= 2) w.start = chars.lastIndexOf(' ', i - 2) + 1
        words.push(w)
      }
      for (const x of words) {
        x.spelled = strip(chars.slice(x.start, x.end).join(''))
        x.sound = strip(pchars.slice(x.start, x.end).join(''))
      }
    }
    i = j
  }
  if (!words.length) return { note: '', rules: [] }
  const shown = words.slice(0, 3)
  const rules = [...new Set(words.flatMap((w) => w.rules))]
  const note =
    'Sounds like: ' +
    shown.map((w) => `${w.spelled} → [${w.sound}]`).join(', ') +
    ` (${[...new Set(shown.flatMap((w) => w.rules))].map((r) => RULE_EN[r] || r).join(', ')})`
  return { note, rules }
}

// 출제 우선순위 점수 — 명사+조사 연음(일을 [이를])은 거의 모든 문장에 있어 가볍게, 나머지 규칙은 무겁게 센다
export function soundChangeScore(rules) {
  return rules.reduce((sum, r) => sum + (r === '연음' || r === '의→에' ? 1 : 2), 0)
}
