// api/_lib/quizGen.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 퀴즈 생성 코어 — raw STT 자막 → NVIDIA LLM → B/I/A QuizItem[]
//   · api/generate-quiz.js(스튜디오 버튼)와 scripts/staff/quiz-writer.mjs(AI 직원)가 공유한다.
//   · 프롬프트/검증 규칙을 한 곳에서만 고치도록 분리.
// ─────────────────────────────────────────────────────────────────────────────

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
// 이전 모델(llama-3.3-nemotron-super-49b-v1.5)은 NVIDIA 측에서 폐기(HTTP 410, 2026-08-26 EOL)됨.
// 그 후속인 nemotron-3-super-120b-a12b 도 2026-11 기준 목록엔 있지만 호출 시 404(Function not found).
// 같은 급의 3.5 세대로 교체. NVIDIA_QUIZ_MODEL 로 오버라이드 가능.
export const NVIDIA_MODEL = process.env.NVIDIA_QUIZ_MODEL || 'nvidia/nemotron-3.5-super-vl-120b-a12b'

// ── NVIDIA Master System Prompt ──────────────────────────────────────────────
// "detailed thinking off": Nemotron 계열 모델의 reasoning 모드를 끄는 관례적 지시문 —
// 응답을 순수 JSON 하나로만 받기 위해 사고 과정을 끈다.
const SYSTEM_PROMPT = `detailed thinking off

[Role]
You are a strict and expert Korean Language Curriculum Director for global K-pop fans. Your job is to analyze raw, messy STT transcripts from live broadcasts, filter out unusable filler noises (e.g., "어.. 막.. 그니까.."), and generate perfect quiz data in strict JSON format.

[Level Criteria & Output Rules]
1. Beginner Level (B) - Word Order:
- Select a very short, simple sentence (2 to 5 words, everyday conversation).
- Split it into 3 to 4 "Meaningful Chunks".
- Output the original sentence and its chunks.

2. Intermediate Level (I) - Easy Dictation:
- Select a short-to-medium everyday sentence (3 to 6 words) spoken clearly, with common vocabulary and basic grammar.
- Blank out ONE short "Meaningful Chunk" (1 to 2 words) — e.g. a common verb/adjective with its ending (먹었어요, 좋아해요) or a frequent expression (진짜 맛있다). Avoid heavy liaisons or rare words; it must be easier to hear than the Advanced items.
- Output the full sentence and the correct answer chunk for the blank. Do not reuse the same sentence as an Advanced item.

3. Advanced Level (A) - Dictation:
- Select a longer sentence (5+ words) with natural liaisons (연음) or not easy structures.
- Identify the "Meaningful Chunk" to hear and replace it with a blank. Do not blank out just a single word; blank out the whole clause.
- Output the full sentence and the correct answer chunk for the blank.

[App Integration Rules — REQUIRED for every item]
- The transcript lines include timestamps. Every quiz item MUST include "startTime" and "endTime" in seconds, derived from those timestamps:
  · All levels: startTime ≈ 0.3–0.5s before the line's timestamp; endTime = next caption timestamp or startTime + 3–5s (never longer than 8s).
- Beginner "chunks" MUST be listed in the ORIGINAL sentence order (the app jumbles them at runtime). Joining the chunks with single spaces must reproduce the target sentence exactly (same spelling; spacing may only differ at chunk boundaries).
- Intermediate/Advanced "blankChunk" MUST be an exact substring of "fullSentence" (same spelling, same spacing). Advanced blanks should be a meaningful clause of 2+ words where possible; Intermediate blanks stay short (1–2 words).
- Intermediate/Advanced items also need:
  · "hint": a short phonetic or contextual nudge (5–15 words, in English) that helps recall WITHOUT quoting the answer.
  · "explanation": a teaching-quality note written mainly in ENGLISH (Korean examples stay Korean). Start with a pattern formula line (e.g. "Verb + -(으)ㄹ게요 = I'll..."), then 1–3 sentences of nuance, then 1–3 short Korean examples. Use \\n for line breaks. Keep Intermediate explanations simpler (TOPIK 2–3 level).
- Beginner items may include a short optional "explanation" (English) — or an empty string.
- Fix obvious STT errors using context; transcribe in natural Korean orthography. Never invent sentences that are not in the transcript. Spread selections across the whole video.
- Generate exactly the requested number of items per level (see the user message). If the transcript genuinely cannot support the requested count for a level, generate as many valid items as possible for that level.

[Strict JSON Output Format]
Respond with ONLY one JSON object — no markdown fences, no commentary — of this exact shape:
{
  "beginner": [
    { "id": string, "startTime": number, "endTime": number,
      "targetSentence": "오늘 진짜 피곤하네요",
      "chunks": ["오늘", "진짜", "피곤하네요"],
      "explanation": string }
  ],
  "intermediate": [
    { "id": string, "startTime": number, "endTime": number,
      "fullSentence": "이거 진짜 맛있어요",
      "blankChunk": "맛있어요",
      "hint": string,
      "explanation": string }
  ],
  "advanced": [
    { "id": string, "startTime": number, "endTime": number,
      "fullSentence": "이제 운동을 진짜 시작해야 될 것 같아요",
      "blankChunk": "시작해야 될 것 같아요",
      "hint": string,
      "explanation": string }
  ]
}`

// ── B 모드: 청크를 원문 순서로 정렬/검증 ─────────────────────────────────────
// 모델이 순서를 섞어 보내도 targetSentence 를 앞에서부터 걸어가며 재정렬한다.
// 문장 전체를 정확히 덮지 못하면 null (해당 문항 폐기).
function orderChunks(sentence, chunks) {
  if (!Array.isArray(chunks) || chunks.length < 2) return null
  const remaining = chunks.map((c) => String(c).trim()).filter(Boolean)
  if (remaining.length < 2) return null
  const ordered = []
  let rest = sentence.trim()
  while (rest.length > 0) {
    const idx = remaining.findIndex((c) => rest.startsWith(c))
    if (idx === -1) return null
    ordered.push(remaining[idx])
    rest = rest.slice(remaining[idx].length).trimStart()
    remaining.splice(idx, 1)
  }
  return remaining.length === 0 ? ordered : null
}

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : NaN)
const validTime = (q) => num(q.endTime) > num(q.startTime) && num(q.startTime) >= 0

// ── NVIDIA 호출 (503/429 일시 오류 재시도) ───────────────────────────────────
// NVIDIA 공용 NIM 엔드포인트는 혼잡 시 "Service temporarily overloaded"(503)를
// 즉시(≈0.2s) 돌려주므로 짧은 백오프로 몇 번 재시도하면 대부분 통과한다.
async function callNvidia(body, apiKey, tries = 3) {
  let last = null
  for (let attempt = 1; attempt <= tries; attempt++) {
    last = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    })
    if (last.ok) return last
    if ((last.status === 503 || last.status === 429) && attempt < tries) {
      await new Promise((res) => setTimeout(res, 1200 * attempt))
      continue
    }
    return last // 최종 응답은 호출부에서 상태코드별 처리
  }
  return last
}

// ── 레벨별 응답 → 앱 QuizItem(B/I/A 멀티 모드 스키마) 매핑 ───────────────────
function mapToQuizItems(parsed, videoId) {
  const vid = videoId.slice(0, 6).toLowerCase()
  const items = []
  const generated = { B: 0, I: 0, A: 0 }

  // B — 어순 맞히기: blocks = 원문 순서의 절 블록 (게임에서 셔플)
  for (const q of Array.isArray(parsed.beginner) ? parsed.beginner : []) {
    if (!q || typeof q.targetSentence !== 'string' || !validTime(q)) continue
    const sentence = q.targetSentence.trim()
    const blocks = orderChunks(sentence, q.chunks)
    if (!sentence || !blocks) continue
    generated.B += 1
    items.push({
      id: `${vid}_b${String(generated.B).padStart(2, '0')}`,
      videoId,
      mode: 'B',
      startTime: Math.max(0, num(q.startTime)),
      endTime: num(q.endTime),
      fullSentence: blocks.join(' '),
      blocks,
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
      hasHardcodedSubs: true, // 대부분의 K-콘텐츠에 자막이 박혀 있음 — 스튜디오에서 수정 가능
    })
  }

  // I(쉬운 빈칸) · A(딕테이션) — 같은 스키마: blankChunk 가 fullSentence 의 부분 문자열이어야 함
  //   (2026-11 이전 I 는 상황 이해 4지선다였다 — 배포분은 그대로 두고 신규 생성만 딕테이션)
  for (const [mode, list] of [['I', parsed.intermediate], ['A', parsed.advanced]]) {
    for (const q of Array.isArray(list) ? list : []) {
      if (!q || typeof q.fullSentence !== 'string' || typeof q.blankChunk !== 'string' || !validTime(q)) continue
      const fullSentence = q.fullSentence.trim()
      const blankWord = q.blankChunk.trim()
      if (!fullSentence || !blankWord || !fullSentence.includes(blankWord)) continue
      generated[mode] += 1
      items.push({
        id: `${vid}_${mode.toLowerCase()}${String(generated[mode]).padStart(2, '0')}`,
        videoId,
        mode,
        startTime: Math.max(0, num(q.startTime)),
        endTime: num(q.endTime),
        fullSentence,
        blankWord,
        hint: typeof q.hint === 'string' ? q.hint : '',
        explanation: typeof q.explanation === 'string' ? q.explanation : '',
        hasHardcodedSubs: true,
      })
    }
  }

  return { items, generated }
}

// ── 사고 과정(reasoning) 흔적 제거 ────────────────────────────────────────────
// "detailed thinking off" 지시에도 Nemotron 계열은 가끔 <think>...</think> 블록을
// 남긴다. 그 안에 의사코드용 중괄호가 섞여 있으면 아래의 순진한 JSON 추출 정규식이
// 엉뚱한 시작 지점을 잡아 파싱에 실패하므로, 매칭 전에 먼저 잘라낸다.
function stripThinking(raw) {
  const closeIdx = raw.lastIndexOf('</think>')
  return closeIdx === -1 ? raw : raw.slice(closeIdx + '</think>'.length)
}

// explanation 다국어(ja/es)는 이 파이프라인에서 처리하지 않는다 —
// 배포 시 스튜디오가 호출하는 api/translate-explanations 가 한글 보존 가드와 함께 채운다.
// 여기서 두 번째 LLM 번역 호출을 없애 Hobby 60초 상한 초과(504)를 방지한다.

/** 사용자에게 그대로 보여줄 수 있는 생성 실패 — httpStatus 는 API 응답 코드로 쓰인다 */
export class QuizGenError extends Error {
  constructor(httpStatus, message) {
    super(message)
    this.httpStatus = httpStatus
  }
}

/**
 * 자막 → 검증된 QuizItem[] (en explanation 만 — 다국어는 배포 시 처리)
 *   want: { B, I, A } 레벨별 개수 (호출부에서 범위 검증 완료된 값)
 *   실패 시 QuizGenError(사용자 메시지) 또는 code/status 가 붙은 Error 를 던진다.
 */
export async function generateQuiz({ videoId, transcript, want }) {
  const requestedLevels = ['B', 'I', 'A'].filter((k) => want[k] > 0)

  // 앞뒤 공백/줄바꿈 제거 + ASCII 범위 검증: Vercel 환경 변수 값에 실수로
  // 한글 설명 텍스트나 개행이 섞여 들어가면 fetch() 가 "Cannot convert argument
  // to a ByteString..." 같은 알아보기 힘든 에러를 던지므로, 여기서 먼저 걸러
  // 원인을 바로 알 수 있는 메시지로 바꿔준다.
  const apiKey = (process.env.NVIDIA_API_KEY || '').trim()
  if (!apiKey) throw Object.assign(new Error('NVIDIA_API_KEY env var is not set'), { code: 'missing_key' })
  // eslint-disable-next-line no-control-regex
  if (!/^[\x00-\xFF]*$/.test(apiKey)) {
    throw Object.assign(
      new Error('NVIDIA_API_KEY contains non-ASCII characters — check the Vercel env var for stray text/newlines'),
      { code: 'invalid_key_charset' },
    )
  }

  const userMessage =
    `videoId: ${videoId}\n` +
    `Generate quiz items per level: Beginner(B)=${want.B}, Intermediate(I)=${want.I}, Advanced(A)=${want.A}. ` +
    `Levels requested: ${requestedLevels.join(', ')}. For levels with 0, return an empty array.\n` +
    `Use ids like "${videoId.slice(0, 6).toLowerCase()}_b01" / "_i01" / "_a01", ordered by startTime within each level.\n\n` +
    `=== TRANSCRIPT (timestamp + text lines) ===\n${transcript.slice(0, 60000)}`

  // 비스트리밍, 응답 텍스트에서 JSON 블록만 추출
  const r = await callNvidia(
    {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      top_p: 0.9,
      // ⚠️ nemotron-3 계열은 시스템 프롬프트의 "detailed thinking off"(구 모델용 관례)를
      // 무시하고 reasoning_content 로 수천 토큰의 사고 과정을 생성한다 — 이 때문에
      // B+I 소량 생성도 ~89s 가 걸려 Hobby 60초 상한을 넘겼고, Vercel 이 함수를 죽이며
      // 반환한 텍스트("An error occurred...")를 프런트가 JSON.parse 하다
      // "Unexpected token 'A'" 로 깨졌다. 아래 스위치로 추론을 실제로 끄면 ~9s 로 단축된다.
      chat_template_kwargs: { thinking: false },
      // json_object 강제 — 마크다운/설명 없이 JSON 만 출력해 파싱을 안정화.
      response_format: { type: 'json_object' },
      // B10+I6+A20 처럼 레벨 합계가 크면 explanation 이 길어 16000 으로는 자주
      // 잘렸다(finish_reason: "length") — JSON 이 중간에 끊겨 파싱 실패의 원인이었다.
      // 이 모델의 실제 출력 한도(65536)에 맞춰 여유를 둔다.
      max_tokens: 32000,
      stream: false,
    },
    apiKey,
  )
  if (r.status === 429) {
    const bodyText = await r.text().catch(() => '')
    const err = new Error(`NVIDIA API rate limit (429): ${bodyText.slice(0, 200)}`)
    err.status = 429
    throw err
  }
  if (!r.ok) {
    const bodyText = await r.text().catch(() => '')
    const err = new Error(`NVIDIA API HTTP ${r.status}: ${bodyText.slice(0, 300)}`)
    err.status = r.status
    throw err
  }
  const data = await r.json()
  const choice = data && data.choices && data.choices[0]
  const raw = stripThinking((choice && choice.message && choice.message.content) || '')

  if (choice && choice.finish_reason === 'length') {
    throw new QuizGenError(
      502,
      'AI 응답이 max_tokens 한도에서 잘렸습니다 (요청한 문항 수가 너무 많습니다). ' +
        '레벨별 생성 개수를 줄여서 다시 시도해 주세요.',
    )
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new QuizGenError(502, 'AI 응답에서 JSON을 찾지 못했습니다. 다시 시도해 주세요.')

  // 안전 파싱 + 서버측 검증 → 앱 B/I/A 스키마로 매핑
  let parsed
  try {
    parsed = JSON.parse(jsonMatch[0])
  } catch {
    throw new QuizGenError(502, 'AI 응답 JSON 파싱에 실패했습니다. 다시 시도해 주세요.')
  }
  const { items: quizzes, generated } = mapToQuizItems(parsed, videoId)

  if (quizzes.length === 0) {
    throw new QuizGenError(422, '유효한 퀴즈를 생성하지 못했습니다. 자막에 타임스탬프가 포함되어 있는지 확인해 주세요.')
  }
  return { quizzes, generated, model: NVIDIA_MODEL }
}
