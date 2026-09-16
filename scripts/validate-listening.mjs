// scripts/validate-listening.mjs
// ─────────────────────────────────────────────────────────────────────────────
// 리스닝 태깅 데이터 검증기 (Phase 1)
//   TS 타입이 못 잡는 "의미(semantic) 오류"를 잡는다:
//     · span 범위/정렬, chunk 커버리지, change/changeType 짝, rule 코드 membership
//     · id 중복, ContrastSet.ref 무결성(firedRule 의 annotation 존재)
//     · commonErrors 는 항목 소유 + 정답 발음과 달라야, StringId/AxisId 는 레지스트리 존재
//
// 사용:
//   node scripts/validate-listening.mjs            # 기본 경로 검증
//   node scripts/validate-listening.mjs --self-test  # 스크립트 자체 동작 확인(데이터 불필요)
//   node scripts/validate-listening.mjs items.json contrast-sets.json
//
// 데이터/레지스트리(JSON): src/data/listening/{items,contrast-sets,rules,axes,strings}.json
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
const RULE_CODE_RE = /^r[0-9a-z_]+$/       // r24, r12h
const AXIS_ID_RE = /^ax\.[a-z0-9_]+$/      // ax.gyeongeumhwa
const STRING_ID_RE = /^[a-z][a-z0-9]*(\.[a-z0-9_]+)+$/ // q.gyeongeumhwa.eomi

const isStr = (v) => typeof v === 'string' && v.trim().length > 0
const isInt = (v) => Number.isInteger(v)
const stripSpace = (s) => String(s).replace(/\s/g, '')

/** annotation surface 들을 transcript 에 적용한 "정답 발음". 없으면 transcript. */
function correctSurface(item) {
  if (!Array.isArray(item.annotations)) return item.transcript
  const spans = item.annotations
    .filter((a) => Array.isArray(a.span) && a.span.length === 2 && isStr(a.surface))
    .slice()
    .sort((a, b) => b.span[0] - a.span[0])
  let out = item.transcript
  for (const a of spans) {
    const [s, e] = a.span
    if (s >= 0 && e <= out.length && s < e) out = out.slice(0, s) + a.surface + out.slice(e)
  }
  return out
}

// ── 순수 검증 로직 ───────────────────────────────────────────────────────────
/** @returns {{errors: string[], warnings: string[]}} */
export function validate(items, contrastSets, opts = {}) {
  const { rules = null, axes = null, strings = null } = opts
  const errors = []
  const warnings = []
  const E = (m) => errors.push(m)
  const W = (m) => warnings.push(m)
  const ruleOk = (c) => (rules ? rules.has(c) : RULE_CODE_RE.test(c))
  const axisOk = (c) => AXIS_ID_RE.test(c) && (!axes || axes.has(c))
  const stringOk = (c) => STRING_ID_RE.test(c) && (!strings || strings.has(c))
  // note 는 StringId(번역셋 키) 또는 초안 원문 텍스트 허용. 원문이면 경고(배포 전 추출 필요).
  const checkNote = (val, where) => {
    if (val == null) return
    if (typeof val !== 'string' || !val.trim()) { E(`${where}: note 가 비었습니다.`); return }
    if (STRING_ID_RE.test(val)) {
      if (strings && !strings.has(val)) E(`${where}: note StringId '${val}' 가 번역셋(strings)에 없습니다.`)
    } else {
      W(`${where}: note 가 원문 텍스트(초안) — 배포 전 StringId 로 추출 필요.`)
    }
  }

  if (!Array.isArray(items)) { E('items 는 배열이어야 합니다.'); items = [] }
  if (!Array.isArray(contrastSets)) { E('contrastSets 는 배열이어야 합니다.'); contrastSets = [] }

  // ── DictationItem ──
  const itemIds = new Set()
  const itemById = new Map()
  for (const [i, it] of items.entries()) {
    const at = `item[${i}]${it && it.id != null ? ` id=${it.id}` : ''}`
    if (!it || typeof it !== 'object') { E(`${at}: 객체가 아닙니다.`); continue }

    if (!isInt(it.id)) E(`${at}: id 는 정수여야 합니다.`)
    else if (itemIds.has(it.id)) E(`${at}: id 중복.`)
    else { itemIds.add(it.id); itemById.set(it.id, it) }

    if (!LEVELS.includes(it.level)) E(`${at}: level 은 ${LEVELS.join('|')} 중 하나. (받음: ${it.level})`)
    if (typeof it.audioUrl !== 'string') E(`${at}: audioUrl 은 문자열이어야 합니다.`)
    else if (!it.audioUrl.trim()) W(`${at}: audioUrl 이 비었습니다 — 오디오 미녹음(데모 TTS 재생).`)
    if (!SPEEDS.includes(it.speed)) E(`${at}: speed 는 ${SPEEDS.join('|')} 중 하나. (받음: ${it.speed})`)
    if (it.difficulty != null && typeof it.difficulty !== 'number') E(`${at}: difficulty 는 숫자여야 합니다.`)

    const tr = it.transcript
    if (!isStr(tr)) { E(`${at}: transcript 가 비었습니다.`); continue }

    if (!Array.isArray(it.chunks) || it.chunks.length === 0) {
      E(`${at}: chunks 가 비었습니다.`)
    } else {
      if (it.chunks.some((c) => !isStr(c))) E(`${at}: chunks 에 빈 항목이 있습니다.`)
      if (stripSpace(it.chunks.join('')) !== stripSpace(tr)) {
        E(`${at}: chunks 를 이으면 transcript 와 달라집니다. (chunks="${stripSpace(it.chunks.join(''))}" transcript="${stripSpace(tr)}")`)
      }
    }

    if (!Array.isArray(it.annotations)) { E(`${at}: annotations 는 배열이어야 합니다.`); continue }
    for (const [j, an] of it.annotations.entries()) {
      const aat = `${at} annotation[${j}]`
      if (!an || typeof an !== 'object') { E(`${aat}: 객체가 아닙니다.`); continue }
      if (!PHENOMENA.includes(an.phenomenon)) E(`${aat}: phenomenon 오류 (받음: ${an.phenomenon})`)
      if (an.phenomenon === 'change') {
        if (!CHANGE_TYPES.includes(an.changeType)) E(`${aat}: change 에는 changeType(${CHANGE_TYPES.join('|')}) 필요 (받음: ${an.changeType})`)
      } else if (an.changeType != null) {
        E(`${aat}: changeType 은 phenomenon='change' 일 때만.`)
      }
      if (!Array.isArray(an.span) || an.span.length !== 2 || !isInt(an.span[0]) || !isInt(an.span[1])) {
        E(`${aat}: span 은 [정수, 정수] 여야 합니다. (받음: ${JSON.stringify(an.span)})`)
      } else {
        const [s, e] = an.span
        if (s < 0 || e > tr.length || s >= e) E(`${aat}: span [${s},${e}) 이 transcript 범위(0..${tr.length}) 벗어남/빈 구간.`)
      }
      if (!isStr(an.surface)) E(`${aat}: surface 가 비었습니다.`)
      if (an.rule != null && !ruleOk(an.rule)) E(`${aat}: rule 이 rules.json 코드가 아닙니다. (받음: ${an.rule})`)
      checkNote(an.note, aat)
    }

    // commonErrors — 항목 소유, 확인된 L1 오답
    if (it.commonErrors != null) {
      if (!Array.isArray(it.commonErrors)) {
        E(`${at}: commonErrors 는 배열이어야 합니다.`)
      } else {
        const correct = correctSurface(it)
        for (const [k, ce] of it.commonErrors.entries()) {
          const cat = `${at} commonError[${k}]`
          if (!ce || typeof ce !== 'object') { E(`${cat}: 객체가 아닙니다.`); continue }
          if (!isStr(ce.surface)) E(`${cat}: surface 가 비었습니다.`)
          else if (ce.surface === correct) E(`${cat}: surface 가 정답 발음('${correct}')과 같습니다. (오개념은 정답과 달라야 함)`)
          if (ce.l1 != null && !isStr(ce.l1)) E(`${cat}: l1 은 비지 않은 문자열이어야 합니다.`)
          checkNote(ce.note, cat)
        }
      }
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

    if (!isStr(cs.axis) || !axisOk(cs.axis)) E(`${at}: axis 는 axes.json 의 AxisId(ax.*) 여야 합니다. (받음: ${cs.axis})`)
    if (!isStr(cs.question) || !stringOk(cs.question)) E(`${at}: question 은 번역셋의 StringId 여야 합니다. (받음: ${cs.question})`)
    checkNote(cs.note, at)

    if (!Array.isArray(cs.members) || cs.members.length < 2) { E(`${at}: members 는 2개 이상이어야 합니다.`); continue }
    const fired = new Set()
    for (const [j, m] of cs.members.entries()) {
      const mat = `${at} member[${j}]`
      if (!m || typeof m !== 'object') { E(`${mat}: 객체가 아닙니다.`); continue }
      if (!isInt(m.ref)) E(`${mat}: ref 는 정수(item id)여야 합니다.`)
      else if (!itemIds.has(m.ref)) E(`${mat}: ref=${m.ref} 에 해당하는 item 이 없습니다.`)

      if (m.firedRule !== null && !ruleOk(m.firedRule ?? '')) {
        E(`${mat}: firedRule 은 null 또는 rules.json 코드여야 합니다. (받음: ${JSON.stringify(m.firedRule)})`)
      } else if (m.firedRule !== null && itemById.has(m.ref)) {
        const it = itemById.get(m.ref)
        const has = Array.isArray(it.annotations) && it.annotations.some((a) => a.rule === m.firedRule)
        if (!has) E(`${mat}: firedRule=${m.firedRule} 인 annotation 이 ref=${m.ref} 항목에 없습니다.`)
      }
      fired.add(m.firedRule)
    }
    if (fired.size < 2) W(`${at}: 모든 member 의 firedRule 이 동일합니다 — 변별 대비가 아닐 수 있습니다.`)
  }

  return { errors, warnings }
}

// ── 데이터 로드 ──────────────────────────────────────────────────────────────
function loadJson(path) {
  if (!existsSync(path)) return { ok: false, data: null }
  try {
    return { ok: true, data: JSON.parse(readFileSync(path, 'utf8')) }
  } catch (e) {
    return { ok: false, data: null, parseError: e.message }
  }
}

function keySet(loaded) {
  return loaded.ok && loaded.data && typeof loaded.data === 'object' && !Array.isArray(loaded.data)
    ? new Set(Object.keys(loaded.data))
    : null
}

// ── 셀프 테스트 (데이터 없이 스크립트 동작 확인) ───────────────────────────────
function selfTest() {
  const goodItems = [
    {
      id: 101, level: 'intermediate', audioUrl: '/a', transcript: '신고', speed: 'normal', chunks: ['신고'],
      annotations: [{ phenomenon: 'pause', rule: 'r24', span: [0, 2], surface: '신꼬', note: 'note.item.singo' }],
    },
    {
      id: 102, level: 'intermediate', audioUrl: '/a', transcript: '신문', speed: 'normal', chunks: ['신문'],
      annotations: [], commonErrors: [{ surface: '싱뭉', l1: 'ja' }],
    },
  ]
  const goodCs = [{
    id: 1, axis: 'ax.gyeongeumhwa', question: 'q.geh.eomi',
    members: [{ ref: 101, firedRule: 'r24' }, { ref: 102, firedRule: null }],
  }]
  const good = validate(goodItems, goodCs)

  const badItems = [
    {
      id: 101, level: 'x', audioUrl: '', transcript: '신고', speed: 'fast', chunks: ['신'],
      annotations: [{ phenomenon: 'carry', changeType: 'soften', span: [0, 9], surface: '' }],
      commonErrors: [{ surface: '' }],
    },
    { id: 101, level: 'intermediate', audioUrl: '/a', transcript: 'ok', speed: 'normal', chunks: ['ok'], annotations: [] },
  ]
  const badCs = [{ id: 1, axis: '경음화', question: '질문', members: [{ ref: 999, firedRule: '18' }] }]
  const bad = validate(badItems, badCs)

  const pass = good.errors.length === 0 && bad.errors.length >= 6
  console.log('SELF-TEST')
  console.log(`  good errors=${good.errors.length} warnings=${good.warnings.length} (기대: errors=0)`)
  console.log(`  bad  errors=${bad.errors.length} (기대: ≥6)`)
  if (!pass) {
    console.log('  good errors:'); good.errors.forEach((m) => console.log('   - ' + m))
    console.log('  bad errors:'); bad.errors.forEach((m) => console.log('   - ' + m))
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
  const axes = loadJson(resolve(ROOT, 'src/data/listening/axes.json'))
  const strings = loadJson(resolve(ROOT, 'src/data/listening/strings.json'))

  for (const [name, r] of [['items', items], ['contrast-sets', cs], ['rules', rules], ['axes', axes], ['strings', strings]]) {
    if (r.parseError) { console.error(`❌ JSON 파싱 실패: ${name}\n   ${r.parseError}`); process.exit(1) }
  }

  if (!items.ok && !cs.ok) {
    console.log('ℹ️  아직 태깅 데이터가 없습니다.')
    console.log(`   생성 대상: ${itemsPath}\n             ${csPath}`)
    process.exit(0)
  }

  const knownRules = keySet(rules)
  const knownAxes = keySet(axes)
  const knownStrings = keySet(strings)
  if (!knownRules) console.log('  ⚠️  rules.json 없음 — 규칙 코드는 형식(r…)만 검사.')
  if (!knownAxes) console.log('  ⚠️  axes.json 없음 — axis 는 형식(ax.*)만 검사.')
  if (!knownStrings) console.log('  ⚠️  strings.json 없음 — StringId 는 형식만 검사(존재 여부 미검사).')

  const { errors, warnings } = validate(items.data ?? [], cs.data ?? [], {
    rules: knownRules, axes: knownAxes, strings: knownStrings,
  })
  console.log(`검증: items=${Array.isArray(items.data) ? items.data.length : '?'} · contrastSets=${Array.isArray(cs.data) ? cs.data.length : '?'} · rules=${knownRules?.size ?? 0} · axes=${knownAxes?.size ?? 0} · strings=${knownStrings?.size ?? 0}`)
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
