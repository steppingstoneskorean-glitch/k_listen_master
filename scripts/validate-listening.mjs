// scripts/validate-listening.mjs
// ─────────────────────────────────────────────────────────────────────────────
// 리스닝 태깅 데이터 검증기 (Phase 1)
//   TS 타입이 못 잡는 "의미(semantic) 오류"를 잡는다:
//     · span 범위/정렬, chunk 커버리지, change/changeType 짝, rule 형식,
//     · id 중복, ContrastSet.ref 참조 무결성, commonError ≠ surface 등.
//
// 사용:
//   node scripts/validate-listening.mjs            # 기본 경로 검증
//   node scripts/validate-listening.mjs --self-test  # 스크립트 자체 동작 확인(데이터 불필요)
//   node scripts/validate-listening.mjs items.json contrast-sets.json
//
// 데이터 파일(JSON):
//   src/data/listening/items.json          → DictationItem[]
//   src/data/listening/contrast-sets.json  → ContrastSet[]
// 스키마: src/data/listening/schema.ts
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

const PHENOMENA = ['pause', 'carry', 'change', 'sound-contrast']
const CHANGE_TYPES = ['soften', 'flow', 'front-shift', 'breath', 'h-weaken']
const LEVELS = ['intermediate', 'advanced']
const SPEEDS = ['slow', 'normal', 'fast']
const RULE_CODE_RE = /^r[0-9a-z_]+$/ // 내부 코드: r24, r12h … (rules.json 부재 시 폴백 검사)

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isInt = (v) => Number.isInteger(v)
const stripSpace = (s) => String(s).replace(/\s/g, '')

// ── 순수 검증 로직 ───────────────────────────────────────────────────────────
/** @returns {{errors: string[], warnings: string[]}} */
export function validate(items, contrastSets, knownRules = null) {
  const errors = []
  const warnings = []
  const E = (m) => errors.push(m)
  const W = (m) => warnings.push(m)
  // 규칙 코드는 rules.json 의 키여야 한다(있으면). 없으면 형식(r…)만 검사.
  const ruleOk = (code) => (knownRules ? knownRules.has(code) : RULE_CODE_RE.test(code))

  if (!Array.isArray(items)) { E('items 는 배열이어야 합니다.'); items = [] }
  if (!Array.isArray(contrastSets)) { E('contrastSets 는 배열이어야 합니다.'); contrastSets = [] }

  // ── DictationItem ──
  const itemIds = new Set()
  for (const [i, it] of items.entries()) {
    const at = `item[${i}]${it && it.id != null ? ` id=${it.id}` : ''}`
    if (!it || typeof it !== 'object') { E(`${at}: 객체가 아닙니다.`); continue }

    if (!isInt(it.id)) E(`${at}: id 는 정수여야 합니다.`)
    else if (itemIds.has(it.id)) E(`${at}: id 중복.`)
    else itemIds.add(it.id)

    if (!LEVELS.includes(it.level)) E(`${at}: level 은 ${LEVELS.join('|')} 중 하나. (받음: ${it.level})`)
    if (!isStr(it.audioUrl)) E(`${at}: audioUrl 이 비었습니다.`)
    if (!SPEEDS.includes(it.speed)) E(`${at}: speed 는 ${SPEEDS.join('|')} 중 하나. (받음: ${it.speed})`)
    if (it.difficulty != null && typeof it.difficulty !== 'number') E(`${at}: difficulty 는 숫자여야 합니다.`)

    const tr = it.transcript
    if (!isStr(tr)) { E(`${at}: transcript 가 비었습니다.`); continue }

    // chunks 커버리지 — 공백 제거 후 이어붙이면 transcript 와 같아야 한다.
    if (!Array.isArray(it.chunks) || it.chunks.length === 0) {
      E(`${at}: chunks 가 비었습니다.`)
    } else {
      if (it.chunks.some((c) => !isStr(c))) E(`${at}: chunks 에 빈 항목이 있습니다.`)
      const joined = stripSpace(it.chunks.join(''))
      if (joined !== stripSpace(tr)) {
        E(`${at}: chunks 를 이으면 transcript 와 달라집니다.\n    chunks="${joined}"\n    transcript="${stripSpace(tr)}"`)
      }
    }

    // annotations
    if (!Array.isArray(it.annotations)) { E(`${at}: annotations 는 배열이어야 합니다.`); continue }
    for (const [j, an] of it.annotations.entries()) {
      const aat = `${at} annotation[${j}]`
      if (!an || typeof an !== 'object') { E(`${aat}: 객체가 아닙니다.`); continue }

      if (!PHENOMENA.includes(an.phenomenon)) E(`${aat}: phenomenon 은 ${PHENOMENA.join('|')} 중 하나. (받음: ${an.phenomenon})`)

      // change ↔ changeType 짝
      if (an.phenomenon === 'change') {
        if (!CHANGE_TYPES.includes(an.changeType)) E(`${aat}: change 에는 changeType(${CHANGE_TYPES.join('|')})이 필요. (받음: ${an.changeType})`)
      } else if (an.changeType != null) {
        E(`${aat}: changeType 은 phenomenon='change' 일 때만. (phenomenon=${an.phenomenon})`)
      }

      // span
      if (!Array.isArray(an.span) || an.span.length !== 2 || !isInt(an.span[0]) || !isInt(an.span[1])) {
        E(`${aat}: span 은 [정수, 정수] 여야 합니다. (받음: ${JSON.stringify(an.span)})`)
      } else {
        const [s, e] = an.span
        if (s < 0 || e > tr.length || s >= e) {
          E(`${aat}: span [${s},${e}) 이 transcript 범위(0..${tr.length})를 벗어나거나 비었습니다.`)
        }
      }

      if (!isStr(an.surface)) E(`${aat}: surface 가 비었습니다.`)
      if (an.rule != null && !ruleOk(an.rule)) E(`${aat}: rule 이 rules.json 의 코드가 아닙니다. (받음: ${an.rule})`)
      if (an.note != null && typeof an.note !== 'string') E(`${aat}: note 는 문자열이어야 합니다.`)
    }
    if (it.annotations.length === 0 && Array.isArray(it.chunks)) {
      W(`${at}: annotation 이 없습니다. (현상이 없는 문장이면 무시)`)
    }
  }

  // ── ContrastSet ──
  const csIds = new Set()
  for (const [i, cs] of contrastSets.entries()) {
    const at = `contrastSet[${i}]${cs && cs.id != null ? ` id=${cs.id}` : ''}`
    if (!cs || typeof cs !== 'object') { E(`${at}: 객체가 아닙니다.`); continue }

    if (!isInt(cs.id)) E(`${at}: id 는 정수여야 합니다.`)
    else if (csIds.has(cs.id)) E(`${at}: id 중복.`)
    else csIds.add(cs.id)

    if (!isStr(cs.axis)) E(`${at}: axis 가 비었습니다.`)
    if (!isStr(cs.question)) E(`${at}: question(판별 질문)이 비었습니다.`)

    if (!Array.isArray(cs.members) || cs.members.length < 2) {
      E(`${at}: members 는 2개 이상이어야 합니다.`)
      continue
    }
    const firedRules = new Set()
    for (const [j, m] of cs.members.entries()) {
      const mat = `${at} member[${j}]`
      if (!m || typeof m !== 'object') { E(`${mat}: 객체가 아닙니다.`); continue }
      if (!isInt(m.ref)) E(`${mat}: ref 는 정수(item id)여야 합니다.`)
      else if (!itemIds.has(m.ref)) E(`${mat}: ref=${m.ref} 에 해당하는 item 이 없습니다.`)

      if (m.firedRule !== null && !ruleOk(m.firedRule ?? '')) {
        E(`${mat}: firedRule 은 null 또는 rules.json 의 코드여야 합니다. (받음: ${JSON.stringify(m.firedRule)})`)
      }
      firedRules.add(m.firedRule)

      if (!isStr(m.surface)) E(`${mat}: surface 가 비었습니다.`)
      // commonError 는 오개념 데이터 — 정답 표면형과 같으면 안 된다.
      if (m.commonError != null) {
        if (!isStr(m.commonError)) E(`${mat}: commonError 는 비지 않은 문자열이어야 합니다.`)
        else if (m.commonError === m.surface) E(`${mat}: commonError 가 surface 와 같습니다. (오개념은 정답과 달라야 함)`)
      }
    }
    if (firedRules.size < 2) W(`${at}: 모든 member 의 firedRule 이 동일합니다 — 변별 대비가 아닐 수 있습니다.`)
  }

  return { errors, warnings }
}

// ── 데이터 로드 ──────────────────────────────────────────────────────────────
function loadJson(path) {
  if (!existsSync(path)) return { ok: false, data: [] }
  try {
    return { ok: true, data: JSON.parse(readFileSync(path, 'utf8')) }
  } catch (e) {
    return { ok: false, data: [], parseError: e.message }
  }
}

// ── 셀프 테스트 (데이터 없이 스크립트 동작 확인) ───────────────────────────────
function selfTest() {
  const goodItems = [{
    id: 101, level: 'intermediate', audioUrl: '/audio/x.wav', transcript: '신고',
    speed: 'normal', chunks: ['신고'],
    annotations: [{ phenomenon: 'pause', rule: 'r24', span: [0, 2], surface: '신꼬' }],
  }]
  const goodCs = [{
    id: 1, axis: '경음화 적용 여부', question: '어미가 붙은 용언인가?',
    members: [
      { ref: 101, firedRule: 'r24', surface: '신꼬' },
      { ref: 101, firedRule: null, surface: '신문', commonError: '신꾼' },
    ],
  }]
  const good = validate(goodItems, goodCs)

  const badItems = [{
    id: 101, level: 'x', audioUrl: '', transcript: '신고', speed: 'fast',
    chunks: ['신'], // 커버리지 실패
    annotations: [
      { phenomenon: 'carry', changeType: 'soften', span: [0, 9], surface: '' }, // changeType 오배치 + span 초과 + surface 빈값
    ],
  }, { id: 101, level: 'intermediate', audioUrl: '/a', transcript: 'ok', speed: 'normal', chunks: ['ok'], annotations: [] }] // id 중복
  const badCs = [{
    id: 1, axis: '', question: '',
    members: [{ ref: 999, firedRule: '18', surface: '가' }], // <2 members + ref 없음 + rule형식 + (axis/question 빈값)
  }]
  const bad = validate(badItems, badCs)

  const pass = good.errors.length === 0 && bad.errors.length >= 6
  console.log('SELF-TEST')
  console.log(`  good 케이스 errors=${good.errors.length} warnings=${good.warnings.length} (기대: errors=0)`)
  console.log(`  bad  케이스 errors=${bad.errors.length} (기대: ≥6)`)
  if (!pass) {
    console.log('  bad errors:'); bad.errors.forEach((m) => console.log('   - ' + m))
    console.log('  good errors:'); good.errors.forEach((m) => console.log('   - ' + m))
  }
  console.log(pass ? '  ✅ 검증기 정상 동작' : '  ❌ 검증기 로직 이상')
  return pass ? 0 : 1
}

// ── 엔트리 ───────────────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2)
  if (args.includes('--self-test')) process.exit(selfTest())

  const itemsPath = resolve(ROOT, args[0] ?? 'src/data/listening/items.json')
  const csPath = resolve(ROOT, args[1] ?? 'src/data/listening/contrast-sets.json')

  const items = loadJson(itemsPath)
  const cs = loadJson(csPath)
  const rules = loadJson(resolve(ROOT, 'src/data/listening/rules.json'))
  const knownRules = rules.ok && rules.data && typeof rules.data === 'object' && !Array.isArray(rules.data)
    ? new Set(Object.keys(rules.data))
    : null

  if (items.parseError) { console.error(`❌ JSON 파싱 실패: ${itemsPath}\n   ${items.parseError}`); process.exit(1) }
  if (cs.parseError) { console.error(`❌ JSON 파싱 실패: ${csPath}\n   ${cs.parseError}`); process.exit(1) }
  if (rules.parseError) { console.error(`❌ JSON 파싱 실패: rules.json\n   ${rules.parseError}`); process.exit(1) }

  if (!items.ok && !cs.ok) {
    console.log('ℹ️  아직 태깅 데이터가 없습니다.')
    console.log(`   생성 대상: ${itemsPath}`)
    console.log(`             ${csPath}`)
    console.log('   (스크립트 동작 확인은 --self-test)')
    process.exit(0)
  }

  if (!knownRules) console.log('  ⚠️  rules.json 없음 — 규칙 코드는 형식(r…)만 검사합니다.')
  const { errors, warnings } = validate(items.data, cs.data, knownRules)
  console.log(`검증: items=${Array.isArray(items.data) ? items.data.length : '?'} · contrastSets=${Array.isArray(cs.data) ? cs.data.length : '?'} · rules=${knownRules ? knownRules.size : 0}`)
  warnings.forEach((w) => console.log('  ⚠️  ' + w))
  if (errors.length === 0) {
    console.log(`✅ 통과 (경고 ${warnings.length}건)`)
    process.exit(0)
  }
  console.log(`\n❌ 오류 ${errors.length}건:`)
  errors.forEach((e) => console.log('  • ' + e))
  process.exit(1)
}

// 직접 실행할 때만 main() — import 로 validate() 만 재사용할 수 있게 가드.
if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
