// api/generate-quiz.js
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — AI 퀴즈 자동 생성 파이프라인 (Vercel Serverless Function)
//   raw STT 자막 → NVIDIA LLM → B/I/A 3레벨 구조화 퀴즈 데이터
//
//   POST /api/generate-quiz
//   Headers: Authorization: Bearer <Firebase ID Token>  (관리자 계정만 허용)
//   Body:    {
//     videoId: string,
//     transcript: string,                    // 타임스탬프 포함 한국어 STT 자막
//     counts?: { B?: number, I?: number, A?: number },  // 레벨별 생성 개수 (0 = 건너뜀)
//     count?: number,                        // (레거시) A 개수만 지정하던 이전 클라이언트 호환
//   }
//   Returns: { quizzes: QuizItem[], generated: {B,I,A}, model }
//            — QuizItem 은 앱의 B/I/A 멀티 모드 스키마(mode/blocks/options/blankWord)로 매핑됨
//
//   필요한 Vercel 환경 변수:
//     NVIDIA_API_KEY     — https://build.nvidia.com 에서 발급 (OpenAI SDK 호환 NIM 엔드포인트)
//     FIREBASE_API_KEY   — Firebase Web API 키 (VITE_FIREBASE_API_KEY 와 동일 값)
//     ADMIN_EMAIL        — (선택) 관리자 이메일. 기본값 아래 상수
// ─────────────────────────────────────────────────────────────────────────────

export const config = { maxDuration: 300 }

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5'
const TRANSLATE_LANGS = ['ja', 'es', 'zh', 'vi']

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'steppingstoneskorean@gmail.com'

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

2. Intermediate Level (I) - Situational Comprehension:
- Select a continuous dialogue block lasting about 20-30 seconds (roughly 4 to 8 lines).
- Generate a "Situational Comprehension" question in Korean (e.g., "이 대화의 상황으로 가장 알맞은 것은?").
- Create 1 correct option summarizing the core situation.
- Create 3 highly plausible distractors by subtly twisting facts, mixing up past/present tenses, or misinterpreting keywords (e.g., saying they are dieting *now* instead of in the *past*).

3. Advanced Level (A) - Dictation:
- Select a longer sentence (5+ words) with natural liaisons (연음) or not easy structures.
- Identify the "Meaningful Chunk" to hear and replace it with a blank. Do not blank out just a single word; blank out the whole clause.
- Output the full sentence and the correct answer chunk for the blank.

[App Integration Rules — REQUIRED for every item]
- The transcript lines include timestamps. Every quiz item MUST include "startTime" and "endTime" in seconds, derived from those timestamps:
  · Beginner/Advanced: startTime ≈ 0.3–0.5s before the line's timestamp; endTime = next caption timestamp or startTime + 3–5s (never longer than 8s).
  · Intermediate: startTime/endTime must cover the WHOLE dialogue block (about 20–35 seconds).
- Beginner "chunks" MUST be listed in the ORIGINAL sentence order (the app jumbles them at runtime). Joining the chunks with single spaces must reproduce the target sentence exactly (same spelling; spacing may only differ at chunk boundaries).
- Advanced "blankChunk" MUST be an exact substring of "fullSentence" (same spelling, same spacing) and must be a meaningful clause of 2+ words where possible.
- Advanced items also need:
  · "hint": a short phonetic or contextual nudge (5–15 words, in English) that helps recall WITHOUT quoting the answer.
  · "explanation": a teaching-quality note written mainly in ENGLISH (Korean examples stay Korean). Start with a pattern formula line (e.g. "Verb + -(으)ㄹ게요 = I'll..."), then 1–3 sentences of nuance, then 1–3 short Korean examples. Use \\n for line breaks.
- Beginner/Intermediate items may include a short optional "explanation" (English) — or an empty string.
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
      "dialogueBlock": "자켓만 입어 봐. 너무 근데 옛날 또 옷들이... 등이 커진 거지.",
      "question": "다음 대화의 상황으로 가장 알맞은 것은?",
      "options": [
        {"text": "예전에 다이어트하며 입었던 옷이 이제는 작아서 맞지 않는다.", "isCorrect": true},
        {"text": "두 사람은 현재 새로운 작품을 위해 열심히 다이어트 중이다.", "isCorrect": false},
        {"text": "남자가 여자에게 자신의 옛날 코트를 선물하려고 한다.", "isCorrect": false},
        {"text": "캐나다 여행을 가기 위해 겨울 코트를 새로 사고 있다.", "isCorrect": false}
      ],
      "explanation": string }
  ],
  "advanced": [
    { "id": string, "startTime": number, "endTime": number,
      "fullSentence": "이제 운동을 진짜 시작해야 될 것 같아요",
      "blankChunk": "시작해야 될 것 같아요",
      "hint": string,
      "explanation": string }
  ]
}
Every "options" array MUST contain exactly 4 entries with exactly one "isCorrect": true.`

// ── Firebase ID 토큰 검증 (identitytoolkit lookup — 관리자 이메일 확인) ──────
async function verifyAdmin(idToken) {
  const key = process.env.FIREBASE_API_KEY
  if (!key) throw new Error('FIREBASE_API_KEY env var is not set on Vercel')
  const r = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ idToken }),
    },
  )
  if (!r.ok) return null
  const data = await r.json()
  const user = data.users && data.users[0]
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user.email
}

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

  // I — 상황 이해: options 4개 + 정답 1개 → options[]/correctIndex
  for (const q of Array.isArray(parsed.intermediate) ? parsed.intermediate : []) {
    if (!q || typeof q.dialogueBlock !== 'string' || !validTime(q)) continue
    const opts = Array.isArray(q.options) ? q.options : []
    if (opts.length !== 4) continue
    const texts = opts.map((o) => (o && typeof o.text === 'string' ? o.text.trim() : ''))
    if (texts.some((t) => !t)) continue
    const correctIdx = opts.findIndex((o) => o && o.isCorrect === true)
    if (correctIdx === -1 || opts.filter((o) => o && o.isCorrect === true).length !== 1) continue
    generated.I += 1
    items.push({
      id: `${vid}_i${String(generated.I).padStart(2, '0')}`,
      videoId,
      mode: 'I',
      startTime: Math.max(0, num(q.startTime)),
      endTime: num(q.endTime),
      fullSentence: q.dialogueBlock.trim(),
      question: typeof q.question === 'string' && q.question.trim() ? q.question.trim() : '다음 대화의 상황으로 가장 알맞은 것은?',
      options: texts,
      correctIndex: correctIdx,
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
      hasHardcodedSubs: true,
    })
  }

  // A — 딕테이션: blankChunk 가 fullSentence 의 부분 문자열이어야 함
  for (const q of Array.isArray(parsed.advanced) ? parsed.advanced : []) {
    if (!q || typeof q.fullSentence !== 'string' || typeof q.blankChunk !== 'string' || !validTime(q)) continue
    const fullSentence = q.fullSentence.trim()
    const blankWord = q.blankChunk.trim()
    if (!fullSentence || !blankWord || !fullSentence.includes(blankWord)) continue
    generated.A += 1
    items.push({
      id: `${vid}_a${String(generated.A).padStart(2, '0')}`,
      videoId,
      mode: 'A',
      startTime: Math.max(0, num(q.startTime)),
      endTime: num(q.endTime),
      fullSentence,
      blankWord,
      hint: typeof q.hint === 'string' ? q.hint : '',
      explanation: typeof q.explanation === 'string' ? q.explanation : '',
      hasHardcodedSubs: true,
    })
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

// ── explanation 부분 자동 번역 (partial auto-translation) ───────────────────
// scripts/translate-explanations.cjs 와 동일한 규칙을 퀴즈 생성 파이프라인에 바로 연결한다.
// 기존에는 이 로직이 git pre-commit 훅으로 KpopQuiz.jsx(하드코딩 데이터)에만 연결되어
// 있어, 스튜디오 → Firestore 로 배포되는 문항의 explanation 은 절대 번역되지 않았다.
// 번역 실패는 fail-open — 생성 자체를 막지 않고 en 단일 문자열로 남긴다.
const TRANSLATE_SYSTEM_PROMPT = `detailed thinking off

You are a professional translator for a Korean-listening app aimed at foreign K-pop fans.
You will receive a JSON array of English "explanation" strings (grammar/pronunciation notes for Korean listening quiz items) that may contain Korean words or sentences mixed in.

Rules:
1. NEVER translate, romanize, or alter ANY Korean (Hangul) text. Copy every Korean substring byte-for-byte, unchanged, in the exact same position.
2. Translate ONLY the English prose and English glosses into ${TRANSLATE_LANGS.join(', ')}.
3. Keep the literal words "Verb" / "Adjective" untranslated when they appear right before a "+" grammar formula.
4. Preserve the original line breaks (as \\n) and paragraph structure exactly.
5. Respond with ONLY a single JSON array — no markdown fences, no commentary — the SAME length and order as the input. Each element is an object with exactly these keys: ${TRANSLATE_LANGS.join(', ')}.`

async function translateExplanations(explanations, apiKey) {
  const jobs = explanations
    .map((text, i) => ({ text, i }))
    .filter((x) => typeof x.text === 'string' && x.text.trim())
  if (jobs.length === 0) return {}

  try {
    const r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: TRANSLATE_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(jobs.map((x) => x.text)) },
        ],
        temperature: 0.3,
        top_p: 0.9,
        max_tokens: 8000,
        stream: false,
      }),
    })
    if (!r.ok) {
      console.error('[generate-quiz] translateExplanations HTTP', r.status)
      return {}
    }
    const data = await r.json()
    const raw = stripThinking(
      (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '',
    )
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return {}
    const arr = JSON.parse(jsonMatch[0])
    const out = {}
    jobs.forEach((job, k) => {
      const t = arr[k]
      if (t && typeof t === 'object') out[job.i] = t
    })
    return out
  } catch (err) {
    console.error('[generate-quiz] translateExplanations failed', err)
    return {} // fail-open — 번역 실패해도 퀴즈 생성은 계속 진행
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 1) 관리자 인증
    const idToken = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!idToken) return res.status(401).json({ error: '로그인이 필요합니다 (ID token missing)' })
    const email = await verifyAdmin(idToken)
    if (!email) return res.status(403).json({ error: '관리자 계정이 아닙니다' })

    // 2) 입력 검증 — 레벨별 개수 (레거시 count 는 A 개수로 해석)
    const { videoId, transcript, counts, count } = req.body || {}
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'videoId 가 필요합니다' })
    }
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
      return res.status(400).json({ error: '자막(transcript)이 너무 짧습니다. 유튜브 스크립트를 붙여넣어 주세요.' })
    }
    const clamp = (v, max) => Math.min(Math.max(Number(v) || 0, 0), max)
    const want = {
      B: clamp(counts && counts.B, 10),
      I: clamp(counts && counts.I, 6),
      A: clamp(counts ? counts.A : count || 0, 20),
    }
    if (want.B + want.I + want.A === 0) want.A = 10 // 아무 것도 지정 안 하면 기본 A 10개
    const requestedLevels = ['B', 'I', 'A'].filter((k) => want[k] > 0)

    // 3) NVIDIA 호출 — 비스트리밍, 응답 텍스트에서 JSON 블록만 추출
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

    const r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.4,
        top_p: 0.9,
        // B10+I6+A20 처럼 레벨 합계가 크면 explanation 이 길어 16000 으로는 자주
        // 잘렸다(finish_reason: "length") — JSON 이 중간에 끊겨 파싱 실패의 원인이었다.
        // 이 모델의 실제 출력 한도(65536)에 맞춰 여유를 둔다.
        max_tokens: 32000,
        stream: false,
      }),
    })
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
      return res.status(502).json({
        error:
          'AI 응답이 max_tokens 한도에서 잘렸습니다 (요청한 문항 수가 너무 많습니다). ' +
          '레벨별 생성 개수를 줄여서 다시 시도해 주세요.',
      })
    }

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'AI 응답에서 JSON을 찾지 못했습니다. 다시 시도해 주세요.' })

    // 4) 안전 파싱 + 서버측 검증 → 앱 B/I/A 스키마로 매핑
    let parsed
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return res.status(502).json({ error: 'AI 응답 JSON 파싱에 실패했습니다. 다시 시도해 주세요.' })
    }
    const { items: quizzes, generated } = mapToQuizItems(parsed, videoId)

    if (quizzes.length === 0) {
      return res.status(422).json({ error: '유효한 퀴즈를 생성하지 못했습니다. 자막에 타임스탬프가 포함되어 있는지 확인해 주세요.' })
    }

    // 5) explanation 부분 자동 번역 — Studio → Firestore 배포 문항에도 다국어를 채운다.
    //    (기존에는 KpopQuiz.jsx 하드코딩 데이터에만 pre-commit 훅으로 연결되어 있었음)
    const translations = await translateExplanations(
      quizzes.map((q) => q.explanation),
      apiKey,
    )
    quizzes.forEach((q, i) => {
      const en = q.explanation || ''
      if (en.trim() && translations[i]) {
        q.explanation = { en, ...translations[i] }
      }
    })

    return res.status(200).json({ quizzes, generated, model: NVIDIA_MODEL })
  } catch (err) {
    console.error('[generate-quiz]', err)
    const msg =
      err && err.code === 'missing_key'
        ? 'NVIDIA_API_KEY 가 설정되지 않았습니다 (.env.local / Vercel 환경 변수 확인)'
        : err && err.code === 'invalid_key_charset'
        ? 'NVIDIA_API_KEY 값에 한글/특수문자가 섞여 있습니다. Vercel 환경 변수에서 키 값만 남기고 다시 저장한 뒤 Redeploy 해주세요.'
        : err && err.status === 429
        ? 'NVIDIA API 사용량 한도(rate limit)에 도달했습니다. 잠시 후 다시 시도해 주세요.'
        : err && err.status === 401
        ? 'NVIDIA_API_KEY 가 잘못되었습니다'
        : '퀴즈 생성 중 오류가 발생했습니다: ' + (err.message || String(err))
    return res.status(500).json({ error: msg })
  }
}
