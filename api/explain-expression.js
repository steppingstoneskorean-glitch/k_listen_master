// api/explain-expression.js
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 표현 클릭 즉석 해설 API (Vercel Serverless Function)
//
//   POST /api/explain-expression
//   Body:    { expression: string, fullSentence: string, videoId?: string, artist?: string }
//   Returns: { explanation: string }
//
//   학습자가 예능/인터뷰 영상 문장에서 모르는 표현을 클릭하면 호출된다.
//   원어민의 빠른 발화(연음/축약/탈락), 슬랭의 실제 뉘앙스, 자연스러운 억양을
//   친근한 톤으로 즉석 설명한다.
//
//   필요한 환경 변수:
//     NVIDIA_API_KEY — https://build.nvidia.com 에서 발급 (OpenAI SDK 호환 NIM 엔드포인트)
// ─────────────────────────────────────────────────────────────────────────────

export const config = { maxDuration: 60 }

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'nvidia/llama-3.3-nemotron-super-49b-v1.5'

const MAX_EXPRESSION_LEN = 60
const MAX_SENTENCE_LEN = 300

// ── 남용 방지 ────────────────────────────────────────────────────────────────
// 로그인 여부와 무관하게(비로그인 학습자도 사용하는 기능) 접근을 허용하되,
// (1) 우리 사이트가 아닌 곳에서의 브라우저發 요청과 (2) 동일 IP 의 단시간 대량 호출을
// 막아 NVIDIA 무료 크레딧이 스크립트 남용으로 소진되는 것을 방지한다.
const ALLOWED_ORIGINS = new Set([
  'https://step-korean.com',
  'https://www.step-korean.com',
  'https://k-listen-master.vercel.app',
])

function isAllowedOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true // 동일 출처 요청은 브라우저가 Origin 을 안 보낼 수 있음 — 통과
  return ALLOWED_ORIGINS.has(origin)
}

// 매우 단순한 인메모리 rate limit — 같은(warm) 서버리스 인스턴스 안에서만 유효하므로
// 완벽한 방어는 아니지만, 단일 스크립트의 연속 호출을 막는 1차 저지선 역할은 한다.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10분
const RATE_LIMIT_MAX = 20 // IP 당 10분에 20회
const rateLimitMap = new Map() // ip -> { count, windowStart }

function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim()
  return (req.socket && req.socket.remoteAddress) || 'unknown'
}

function isRateLimited(ip) {
  const now = Date.now()
  // 맵이 과도하게 커지는 것을 막기 위해 가끔 오래된 항목을 정리한다
  if (rateLimitMap.size > 5000) {
    for (const [key, v] of rateLimitMap) {
      if (now - v.windowStart > RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key)
    }
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

// ── 친근한 원어민 친구 페르소나 시스템 프롬프트 ────────────────────────────────
// "detailed thinking off": Nemotron 계열 모델의 reasoning 모드를 끄는 관례적 지시문.
// 학습자에게 노출되는 응답이므로 사고 과정 없이 바로 친근한 설명만 내놓게 한다.
const SYSTEM_PROMPT = `detailed thinking off

You are a witty, warm Korean native speaker friend who helps foreign K-pop fans understand what they *actually* just heard in a real Korean variety show / interview clip. The learner tapped on one word or phrase inside a sentence because it confused them — maybe it sounded nothing like the "textbook" pronunciation, maybe it's slang, maybe it was said so fast it blurred together.

You will receive:
- "expression": the exact word/phrase the learner tapped
- "sentence": the full sentence it came from (for context — do not explain the whole sentence, only the tapped expression)

Write a short, friendly explanation in ENGLISH (Korean only for quoted examples) covering whichever of these actually apply — skip anything irrelevant to this specific expression, never pad with boilerplate:

1. **What you actually hear**: if natives pronounce this differently than it's spelled (연음/liaison across syllables, ㅎ weakening/deletion, consonant assimilation, casual contractions like 뭐 하고 있어 → 뭐해/모해, dropped particles, etc.), spell out the real spoken-sound version and briefly say why it happens.
2. **Real meaning / nuance**: if it's slang, an idiom, a contraction, or a word whose literal meaning differs from what it actually communicates in this context (tone, register — banmal vs jondaetmal, how strong/casual it feels), explain the real meaning a textbook won't give you.
3. **Natural rhythm/intonation**: a quick, concrete note on how it's actually said out loud — where the stress falls, whether it's clipped short, drawn out, or said with a particular emotional inflection — so the learner can imitate it, not just recognize it.

Style rules:
- Talk like a friend texting a tip, not a textbook. Use "you'll hear", "natives basically say", "it's like saying...". A little casual enthusiasm is good (occasional emoji is fine, don't overdo it).
- Keep it tight: 3–6 sentences total, not an essay.
- Always give at least one short Korean example if it helps (e.g. "야, 진짜 미쳤다 = Yo, that's insane!").
- If the expression is already perfectly standard/simple with nothing special going on, say so briefly and just give a one-line confirmation + maybe one natural-usage tip — don't invent complexity that isn't there.
- Never lecture about grammar terminology unless it directly helps explain the pronunciation or nuance.`

async function callNvidia(expression, sentence) {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) throw Object.assign(new Error('NVIDIA_API_KEY env var is not set'), { code: 'missing_key' })

  const r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `expression: "${expression}"\nsentence: "${sentence}"\n\nExplain the tapped expression for a foreign K-pop fan learning Korean.`,
        },
      ],
      temperature: 0.6,
      top_p: 0.9,
      max_tokens: 500,
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
  const text = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
  if (!text || !text.trim()) throw new Error('empty response from NVIDIA API')
  return text.trim()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden origin' })
  }
  if (isRateLimited(getClientIp(req))) {
    return res.status(429).json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' })
  }

  try {
    const { expression, fullSentence } = req.body || {}

    if (!expression || typeof expression !== 'string' || !expression.trim()) {
      return res.status(400).json({ error: 'expression이 필요합니다' })
    }
    if (expression.trim().length > MAX_EXPRESSION_LEN) {
      return res.status(400).json({ error: '표현이 너무 깁니다' })
    }
    const sentence =
      typeof fullSentence === 'string' && fullSentence.trim()
        ? fullSentence.trim().slice(0, MAX_SENTENCE_LEN)
        : expression.trim()

    const explanation = await callNvidia(expression.trim(), sentence)
    return res.status(200).json({ explanation, model: NVIDIA_MODEL })
  } catch (err) {
    console.error('[explain-expression]', err)
    const msg =
      err && err.code === 'missing_key'
        ? 'NVIDIA_API_KEY 가 설정되지 않았습니다 (.env.local / Vercel 환경 변수 확인)'
        : err && err.status === 401
        ? 'NVIDIA_API_KEY 가 잘못되었습니다'
        : '설명을 가져오는 중 오류가 발생했습니다: ' + (err.message || String(err))
    return res.status(500).json({ error: msg })
  }
}
