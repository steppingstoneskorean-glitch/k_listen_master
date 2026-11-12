// api/_lib/titleGen.mjs
// ─────────────────────────────────────────────────────────────────────────────
// K-content(팟캐스트가 아닌 영상) 퀴즈 카드 제목 제안 — 유튜브 원제 → 카드 제목(en/ko/es/ja) + 아티스트 태그
//   · scripts/staff/quiz-writer.mjs 가 제목 없는 퀴즈 문서에 titleSuggestion 으로 저장하고 오너에게 승인을 요청한다.
//     오너가 스튜디오에서 승인해야 title 이 되어 카드에 보인다 — 여기서는 절대 title 을 쓰지 않는다.
//   · 문체는 코드에 등록된 카드(src/data/kArtistLive.ts)에 맞춘다.
// ─────────────────────────────────────────────────────────────────────────────

import { callNvidia, stripThinking, NVIDIA_MODEL } from './quizGen.mjs'

const SYSTEM_PROMPT = `You name listening-quiz cards in a Korean-learning app for global K-pop / K-drama fans.
Given a YouTube video's original title and channel, write ONE short, catchy card title that tells fans what the clip is.

Style (match these existing cards):
- en "RunSeokJin Interview" / ko "런석진 인터뷰"
- en "Busan's Prince I.N and his 7 chaotic hyungs" / ko "부산의 왕자 아이엔과 통제 불능 7명의 형들"
- en "Manager Kim Episodes 1–2 Summary" / ko "김부장 1~2화 정리"
- en "BTS Everyday Talk · Healing(?) Trip" / ko "BTS 일상 대화 · 방탄이가 방에 들어가신다"

Rules:
- At most ~45 characters in English. No hashtags, no emoji, no clickbait ("SHOCKING"), no episode codes unless they help.
- Keep artist / show / member names as fans know them. Translate the same meaning into Korean, Spanish and Japanese (natural, not word-for-word).
- "artist": the group or show tag shown on the card — e.g. "BTS", "SKZ", "Ateez", "Blackpink", "BIGBANG", "K-Drama", "K-Variety". Short.
- Only use facts from the given title/channel. Do not invent events.

Respond with ONLY one JSON object: {"en": string, "ko": string, "es": string, "ja": string, "artist": string}`

/** 유튜브 oEmbed (키 불필요) → { title, channel } | null */
export async function fetchYouTubeInfo(videoId) {
  const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`
  const r = await fetch(url)
  if (!r.ok) return null
  const j = await r.json()
  return { title: String(j.title || ''), channel: String(j.author_name || '') }
}

/** 유튜브 원제 → { en, ko, es, ja, artist, sourceTitle, channel } (실패 시 throw) */
export async function suggestTitle({ videoId, apiKey }) {
  const info = await fetchYouTubeInfo(videoId)
  if (!info || !info.title) throw new Error(`유튜브 정보를 찾지 못했습니다 (${videoId})`)
  const r = await callNvidia(
    {
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `YouTube title: ${info.title}\nChannel: ${info.channel}` },
      ],
      temperature: 0.5,
      chat_template_kwargs: { thinking: false },
      response_format: { type: 'json_object' },
      max_tokens: 600,
      stream: false,
    },
    apiKey,
  )
  if (!r.ok) throw new Error(`NVIDIA API HTTP ${r.status}`)
  const data = await r.json()
  const raw = stripThinking(data?.choices?.[0]?.message?.content || '')
  const m = raw.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('제목 제안 응답에서 JSON 을 찾지 못했습니다')
  const j = JSON.parse(m[0])
  const pick = (k) => (typeof j[k] === 'string' ? j[k].trim() : '')
  if (!pick('en') || !pick('ko')) throw new Error('제목 제안이 비어 있습니다')
  return {
    en: pick('en'),
    ko: pick('ko'),
    es: pick('es'),
    ja: pick('ja'),
    artist: pick('artist') || 'K-Content',
    sourceTitle: info.title,
    channel: info.channel,
  }
}
