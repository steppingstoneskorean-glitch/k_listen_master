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
//     ADMIN_EMAIL        — (선택) 관리자 이메일. 기본값은 api/_lib/verifyAdmin.mjs
// ─────────────────────────────────────────────────────────────────────────────

export const config = { maxDuration: 300 }

import { verifyAdmin } from './_lib/verifyAdmin.mjs'
import { generateQuiz, QuizGenError } from './_lib/quizGen.mjs'

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
      I: clamp(counts && counts.I, 12),
      A: clamp(counts ? counts.A : count || 0, 20),
    }
    if (want.B + want.I + want.A === 0) want.A = 10 // 아무 것도 지정 안 하면 기본 A 10개

    // 3) NVIDIA 호출 + 서버측 검증 → 앱 B/I/A 스키마 (api/_lib/quizGen.mjs)
    const { quizzes, generated, model } = await generateQuiz({ videoId, transcript, want })

    // 4) explanation 다국어는 여기서 처리하지 않는다(en 원문만 반환).
    //    · 배포 시 스튜디오가 호출하는 api/translate-explanations 가 ja/es 를 자동 채운다 —
    //      이쪽 경로는 한국어(한글) 보존 가드가 있어 예문 훼손 위험이 없고,
    //      두 번째 느린 LLM 호출을 없애 생성이 Hobby 60초 상한 안에서 끝난다.
    return res.status(200).json({ quizzes, generated, model })
  } catch (err) {
    console.error('[generate-quiz]', err)
    if (err instanceof QuizGenError) return res.status(err.httpStatus).json({ error: err.message })
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
