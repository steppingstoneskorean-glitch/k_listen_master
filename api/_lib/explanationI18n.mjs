// api/_lib/explanationI18n.mjs
// ─────────────────────────────────────────────────────────────────────────────
// 해설(explanation) 다국어 자동 번역 코어 — cron 엔드포인트와 로컬 러너가 공유한다.
//   · 대상 언어: 사이트가 실제 노출하는 ja / es 만 (en 은 원문, ko 는 손대지 않음).
//   · 한국어(한글) 보존은 "기계적 가드"로 강제한다: 번역문의 한글 시퀀스가 원문과
//     한 글자라도 다르면 그 언어는 폐기한다(부분 훼손도 절대 반영하지 않음).
//   · 자동 번역은 영어 산문/영어 뜻풀이만 번역하고 한국어 예문·문법 토큰은 원형 유지.
//
//   NVIDIA(무료 티어) 챗 모델을 사용. scripts/explanations-i18n.cjs 와 동일한
//   프롬프트/가드를 ESM 으로 옮긴 것 — 두 경로(cron·수동)가 같은 규칙을 쓴다.
// ─────────────────────────────────────────────────────────────────────────────

export const LANGS = ['ja', 'es'] // 사이트가 실제로 노출하는 언어만

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
// 이전 모델(llama-3.3-nemotron-super-49b-v1.5)은 NVIDIA 측에서 폐기(HTTP 410)됨.
// 현재 제공되는 지시형 모델로 교체. NVIDIA_TRANSLATE_MODEL 로 오버라이드 가능.
const NVIDIA_MODEL = (typeof process !== 'undefined' && process.env && process.env.NVIDIA_TRANSLATE_MODEL)
  || 'nvidia/nemotron-3-super-120b-a12b'

const HANGUL_RE = /[가-힣㄰-㆏ᄀ-ᇿ]/g
/** 문자열에서 한글만 뽑아 이어붙인 시퀀스(가드 비교용) */
export const hangulSeq = (s) => (String(s || '').match(HANGUL_RE) || []).join('')

/** explanation(문자열 | {en,..}) 에서 영어 원문 추출 */
export const enOf = (exp) => (typeof exp === 'string' ? exp : (exp && exp.en) || '')

/** ja/es 중 하나라도 비어 있으면 번역 필요 */
export function needsTranslation(exp) {
  const en = enOf(exp)
  if (!en.trim()) return false
  if (typeof exp === 'string') return true
  return LANGS.some((l) => !((exp[l] || '').toString().trim()))
}

/** 순수 문자열/부분 객체를 {en, ja?, es?} 형태로 정규화(빈 값 제거) */
export function toExplanationObject(exp) {
  if (typeof exp === 'string') return { en: exp }
  const out = {}
  for (const k of Object.keys(exp || {})) {
    const v = exp[k]
    if (typeof v === 'string' && v.trim()) out[k] = v
  }
  if (!out.en) out.en = enOf(exp)
  return out
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const stripThinking = (raw) => {
  const i = raw.lastIndexOf('</think>')
  return i === -1 ? raw : raw.slice(i + '</think>'.length)
}

const SYS = `detailed thinking off

You are a professional translator for a Korean-listening app aimed at foreign K-pop fans.
You will receive one English "explanation" (grammar/pronunciation notes) that may contain Korean words or sentences mixed in.

Rules:
1. NEVER translate, romanize, or alter ANY Korean (Hangul) text. Copy every Korean substring character-for-character, unchanged, in the exact same position.
2. Translate ONLY the English prose and the English glosses of Korean examples into the target languages.
3. Keep the literal words "Verb" / "Adjective" untranslated when they appear right before a "+" grammar formula.
4. Preserve the original line breaks (as \\n) and paragraph structure exactly.
5. Respond with ONLY a single JSON object, no markdown fences, with exactly these keys: ${LANGS.join(', ')}.`

const MAX_ATTEMPTS = 5 // 네트워크·JSON 파싱·가드 실패를 통틀어 재시도하는 횟수

/** NVIDIA 챗 1회 호출 → 파싱된 { ja?, es? } (가드 통과분만). 실패 시 throw. */
async function callOnce(en, apiKey) {
  const r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: SYS },
        { role: 'user', content: `Translate this explanation into ${LANGS.join(', ')}:\n\n${en}` },
      ],
      // 추론형(nemotron-3) 모델은 이 지시가 없으면 JSON 대신 사고 과정을 출력한다.
      // json_object 로 강제하지만, 그래도 가끔 산문을 섞으므로 파싱 실패는 상위에서 재시도한다.
      response_format: { type: 'json_object' },
      // 추론형 모델이 사고 과정을 길게 쏟아낼 때 JSON 이 잘리지 않도록 넉넉히 확보.
      // 2000 에서는 finish_reason=length 로 JSON 이 통째로 잘려 실패했다(검증됨).
      temperature: 0.2, top_p: 0.9, max_tokens: 6000, stream: false,
    }),
  })
  if (r.status === 429 || r.status >= 500) { const e = new Error(`HTTP ${r.status}`); e.retryable = true; throw e }
  if (!r.ok) throw new Error(`HTTP ${r.status}`) // 4xx(모델 없음 등)는 재시도 무의미
  const data = await r.json()
  const raw = stripThinking(data?.choices?.[0]?.message?.content || '')
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) { const e = new Error('JSON 없음'); e.retryable = true; throw e }
  let p
  try { p = JSON.parse(m[0]) } catch { const e = new Error('JSON 파싱 실패'); e.retryable = true; throw e }
  const src = hangulSeq(en)
  const out = {}
  for (const l of LANGS) {
    const v = p[l]
    if (typeof v !== 'string' || !v.trim()) continue      // 누락
    if (hangulSeq(v) !== src) continue                    // 한국어 훼손 → 폐기
    out[l] = v
  }
  return out
}

/**
 * 영어 원문 하나를 ja/es 로 번역. 한국어 보존 가드를 통과한 언어만 반환한다.
 * 반환: { ja?, es? }. 추론형 모델의 산발적 파싱 실패/누락은 재시도로 흡수한다.
 *   · 두 언어가 다 채워지면 즉시 반환.
 *   · 재시도 소진 시 그때까지 확보한 언어(부분)라도 반환 — 나머지는 다음 실행에서 재시도됨.
 *   · 한 언어도 못 건지면 throw(호출부에서 failed 로 집계 후 다음 실행 재시도).
 */
export async function translateExplanation(en, apiKey) {
  const best = {}
  let lastErr
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const got = await callOnce(en, apiKey)
      for (const l of LANGS) if (got[l] && !best[l]) best[l] = got[l]
      if (LANGS.every((l) => best[l])) return best   // 전부 확보 → 종료
    } catch (e) {
      lastErr = e
      if (!e.retryable) break                         // 4xx 등 → 재시도 무의미
    }
    if (attempt < MAX_ATTEMPTS - 1) await sleep(800 * (attempt + 1))
  }
  if (Object.keys(best).length) return best           // 부분 성공이라도 반환
  throw lastErr || new Error('번역 실패')
}

/**
 * 문서 배열(published/draft)의 항목들을 훑어 ja/es 누락 해설을 채운다.
 * 같은 영어 원문은 한 번만 번역해 캐시로 재사용(문서 간 중복 절감).
 * 반환: { changed: boolean, filled: number, failed: number }
 * onLog(msg) 로 진행 로그를 흘려보낸다(선택).
 */
export async function fillMissingTranslations(items, apiKey, { cache = new Map(), max = Infinity, onLog } = {}) {
  let filled = 0, failed = 0, changed = false
  for (const it of items) {
    if (!it || !needsTranslation(it.explanation)) continue
    if (filled >= max) break
    const en = enOf(it.explanation)
    let tr = cache.get(en)
    if (!tr) {
      try {
        tr = await translateExplanation(en, apiKey)
        // 완전한 결과(ja+es)만 캐시 → 부분 결과는 같은 원문의 다음 항목에서 재시도되어
        // 한 번의 실행 안에서도 누락 언어를 채울 기회를 준다.
        if (LANGS.every((l) => tr[l])) cache.set(en, tr)
      } catch (e) {
        failed++
        onLog?.(`· 실패(${e.message}) — ${en.slice(0, 30).replace(/\n/g, ' ')}…`)
        continue
      }
    }
    const obj = toExplanationObject(it.explanation)
    let touched = false
    for (const l of LANGS) {
      if (tr[l] && !((obj[l] || '').trim())) { obj[l] = tr[l]; touched = true }
    }
    if (touched) { it.explanation = obj; filled++; changed = true; onLog?.(`✓ ${Object.keys(tr).join('+')} — ${en.slice(0, 30).replace(/\n/g, ' ')}…`) }
  }
  return { changed, filled, failed }
}
