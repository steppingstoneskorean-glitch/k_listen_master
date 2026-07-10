// api/generate-quiz.js
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — AI 퀴즈 초안 생성 API (Vercel Serverless Function)
//
//   POST /api/generate-quiz
//   Headers: Authorization: Bearer <Firebase ID Token>  (관리자 계정만 허용)
//   Body:    { videoId: string, transcript: string, count?: number }
//   Returns: { quizzes: QuizItem[] }
//
//   필요한 Vercel 환경 변수:
//     NVIDIA_API_KEY     — https://build.nvidia.com 에서 발급 (OpenAI SDK 호환 NIM 엔드포인트)
//     FIREBASE_API_KEY   — Firebase Web API 키 (VITE_FIREBASE_API_KEY 와 동일 값)
//     ADMIN_EMAIL        — (선택) 관리자 이메일. 기본값 아래 상수
// ─────────────────────────────────────────────────────────────────────────────

export const config = { maxDuration: 300 }

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'steppingstoneskorean@gmail.com'

// ── 20년차 베테랑 한국어 교사 페르소나 시스템 프롬프트 ───────────────────────
// "detailed thinking off": Nemotron 계열 모델의 reasoning 모드를 끄는 관례적 지시문 —
// 이 엔드포인트는 Claude 의 output_config.json_schema 같은 구조화 출력이 없으므로,
// 응답을 순수 JSON 하나로만 받기 위해 사고 과정을 끈다 (explain-expression.js 와 동일 관례).
const SYSTEM_PROMPT = `detailed thinking off

You are an expert Korean language curriculum designer with 20 years of experience teaching Korean to foreign learners (English, Spanish, and Japanese speakers). You design listening-dictation (cloze) quizzes from real K-content videos: the learner listens to a short segment on loop and types the missing part of the sentence.

Extract exactly the requested number of sentences from the transcript that have clear audio for dictation and contain essential grammar, expressions, or natural phonetic linking rules. Replace key target words with blanks. Provide detailed English explanations for the grammar/nuance and a helpful phonetic or contextual hint for each blank.

You will receive a YouTube transcript with timestamps. Your job is to select the pedagogically BEST segments and turn each into one quiz item.

## How to select segments (your teaching instincts)
- Choose lines that contain exactly ONE clear teachable point: a high-frequency grammar pattern (-자, -(으)ㄹ게요, -았/었으면 좋겠다, -는 것 같다...), a natural colloquial contraction, a pronunciation phenomenon (ㅎ weakening, 연음, particle omission), or a very common everyday expression.
- Prefer sentences that are short (roughly 3–12 words), clearly audible, and spoken as a complete thought. Avoid overlapping speech, shouting, songs, and fragments that make no sense out of context.
- Spread selections across the whole video rather than clustering at the beginning.
- Vary the difficulty across the set: some easy items (common single expressions) and some harder items (longer chunks, faster speech).

## How to choose the blank (blankWord)
- The blank must be the teachable chunk itself — 1 to 4 words, and it MUST be an exact substring of fullSentence (same spelling, same spacing).
- Blank the pattern, not random words: for "피자 같이 먹자" blank "같이 먹자" (the -자 pattern), not "피자".
- Never blank proper nouns or filler.

## How to write fullSentence
- Transcribe exactly what is spoken, in natural Korean orthography with correct spacing and punctuation. Fix obvious auto-caption errors using context.
- Keep it to ONE sentence (or one short utterance exchange if inseparable).

## How to write the explanation (this is where your 20 years show)
- Write mainly in ENGLISH (the learners are non-Korean). Korean example sentences stay in Korean.
- Format: start with the pattern formula line like "Verb + -(으)ㄹ게요 = I'll...", then 1–3 sentences explaining nuance/usage/register (banmal vs jondaetmal, when natives actually use it), then 2–3 short Korean example sentences.
- For pronunciation points, explain what actually happens in fast natural speech.
- Add a vocabulary note with * for any non-obvious word or cultural item (e.g. "*깍두기 = ...").
- Use \\n for line breaks inside the explanation. If an item genuinely needs no explanation (pure listening practice), use an empty string.

## How to write the hint
- A short (roughly 5–15 words) phonetic or contextual nudge that helps the learner recall the blank WITHOUT giving away the exact answer — never quote the blankWord itself.
- Prefer whichever is more useful for this specific blank: a phonetic cue ("starts with a soft h-sound, almost silent"), a grammatical cue ("verb stem + the '-자' pattern"), or a contextual/meaning cue ("what you'd say inviting a friend to eat").
- Every item must have a non-empty hint.

## Timing rules
- startTime: about 0.3–0.5 seconds BEFORE the line's transcript timestamp.
- endTime: the next caption's timestamp, or startTime + 3~5 seconds — long enough to hear the full sentence, short enough to loop comfortably. Never longer than 8 seconds.

## Quality bar
Every item must survive this check: "Would a learner who masters this blank actually sound more natural in Korea tomorrow?" If not, pick a different segment. Never invent sentences that are not in the transcript.

## Output format
Respond with ONLY a single JSON object, no markdown code fences, no commentary, of the exact shape:
{"quizzes": [{"id": string, "startTime": number, "endTime": number, "fullSentence": string, "blankWord": string, "explanation": string, "hint": string}, ...]}
"blankWord" MUST be an exact substring of "fullSentence" (same spelling, same spacing). "endTime" MUST be greater than "startTime".`

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

    // 2) 입력 검증
    const { videoId, transcript, count = 20 } = req.body || {}
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'videoId 가 필요합니다' })
    }
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length < 50) {
      return res.status(400).json({ error: '자막(transcript)이 너무 짧습니다. 유튜브 스크립트를 붙여넣어 주세요.' })
    }
    const quizCount = Math.min(Math.max(Number(count) || 20, 1), 20)

    // 3) NVIDIA 호출 — 비스트리밍, 응답 텍스트에서 JSON 블록만 추출
    const apiKey = process.env.NVIDIA_API_KEY
    if (!apiKey) throw Object.assign(new Error('NVIDIA_API_KEY env var is not set'), { code: 'missing_key' })

    const r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content:
              `videoId: ${videoId}\n` +
              `Create exactly ${quizCount} quiz items from this transcript. ` +
              `Use ids like "${videoId.slice(0, 6).toLowerCase()}_01", "..._02" in order of startTime.\n\n` +
              `=== TRANSCRIPT (timestamp + text lines) ===\n${transcript.slice(0, 60000)}`,
          },
        ],
        temperature: 0.4,
        top_p: 0.9,
        max_tokens: 16000,
        stream: false,
      }),
    })
    if (!r.ok) {
      const bodyText = await r.text().catch(() => '')
      const err = new Error(`NVIDIA API HTTP ${r.status}: ${bodyText.slice(0, 300)}`)
      err.status = r.status
      throw err
    }
    const data = await r.json()
    const raw = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return res.status(502).json({ error: 'AI 응답에서 JSON을 찾지 못했습니다. 다시 시도해 주세요.' })

    // 4) 서버측 검증: blankWord 가 fullSentence 의 부분 문자열인지, 시간이 유효한지
    const parsed = JSON.parse(jsonMatch[0])
    const quizzes = (parsed.quizzes || [])
      .filter(
        (q) =>
          q.fullSentence &&
          q.blankWord &&
          q.fullSentence.includes(q.blankWord) &&
          Number(q.endTime) > Number(q.startTime),
      )
      .map((q, i) => ({
        id: q.id || `${videoId.slice(0, 6).toLowerCase()}_${String(i + 1).padStart(2, '0')}`,
        videoId,
        startTime: Math.max(0, Number(q.startTime)),
        endTime: Number(q.endTime),
        fullSentence: q.fullSentence.trim(),
        blankWord: q.blankWord.trim(),
        explanation: q.explanation || '',
        hint: q.hint || '',
        hasHardcodedSubs: true, // 대부분의 K-콘텐츠에 자막이 박혀 있음 — 스튜디오에서 수정 가능
      }))

    if (quizzes.length === 0) {
      return res.status(422).json({ error: '유효한 퀴즈를 생성하지 못했습니다. 자막에 타임스탬프가 포함되어 있는지 확인해 주세요.' })
    }

    return res.status(200).json({ quizzes, model: NVIDIA_MODEL })
  } catch (err) {
    console.error('[generate-quiz]', err)
    const msg =
      err && err.code === 'missing_key'
        ? 'NVIDIA_API_KEY 가 설정되지 않았습니다 (.env.local / Vercel 환경 변수 확인)'
        : err && err.status === 401
        ? 'NVIDIA_API_KEY 가 잘못되었습니다'
        : '퀴즈 생성 중 오류가 발생했습니다: ' + (err.message || String(err))
    return res.status(500).json({ error: msg })
  }
}
