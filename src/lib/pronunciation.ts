// src/lib/pronunciation.ts
// ─────────────────────────────────────────────────────────────────────────────
// Azure Speech "발음 평가(Pronunciation Assessment)" 래퍼 — 섀도잉 AI 채점.
//   · 원어민 대비 발음 정확도를 음소 단위로 실측한다(예전 음성인식 점수와 다름).
//   · 한국어(ko-KR): 정확도·유창성·완성도·총점 지원. (톤/억양=Prosody 는 en-US 전용이라 미사용)
//   · 보안: Azure 키는 서버(/api/speech-token)에만. 클라이언트는 10분짜리 토큰만 받는다.
//   · 프라이버시: 실시간 채점이라 Azure 가 오디오를 저장하지 않는다.
//   · SDK(~1MB)는 채점 시점에만 동적 import 하여 초기 번들에 넣지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from './firebase'

export interface WordScore {
  word: string
  accuracy: number
  errorType: string // 'None' | 'Mispronunciation' | 'Omission' | 'Insertion' | ...
}

export interface PronunciationResult {
  accuracy: number // 발음 정확도 0–100
  fluency: number // 유창성 0–100
  completeness: number // 완성도 0–100
  pron: number // 종합 점수 0–100
  words: WordScore[]
  recognizedText: string // 음성인식이 알아들은 문장
}

export class PronunciationError extends Error {
  code: 'no_auth' | 'no_token' | 'no_match' | 'canceled' | 'unsupported' | 'unknown'
  constructor(code: PronunciationError['code'], message: string) {
    super(message)
    this.code = code
  }
}

/** 이 브라우저에서 마이크 캡처가 가능한지(발음 채점 전제). */
export function pronunciationSupported(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia
}

// ── 인증 정보 확보 ───────────────────────────────────────────────────────────
//   운영: /api/speech-token (Firebase 로그인 필요) → 단기 토큰(kind: 'token')
//   개발: DEV 한정 VITE_AZURE_SPEECH_KEY/REGION 직결 폴백 → 구독 키(kind: 'key')
//   ※ 값의 종류를 글자 모양으로 추측하지 않고 kind 로 명시(키↔토큰 오분류 방지).
type Auth = { value: string; region: string; kind: 'token' | 'key' }

async function getAuth(): Promise<Auth> {
  const user = auth?.currentUser
  if (user) {
    const idToken = await user.getIdToken()
    const r = await fetch('/api/speech-token', {
      method: 'POST',
      headers: { authorization: `Bearer ${idToken}` },
    })
    if (r.ok) {
      const d = (await r.json()) as { token: string; region: string }
      return { value: d.token.trim(), region: d.region.trim(), kind: 'token' }
    }
    // 401/403/500 등 — DEV 폴백을 시도할 수 있으므로 여기서 바로 던지지 않는다.
    if (!import.meta.env.DEV) {
      const data = await r.json().catch(() => ({}))
      throw new PronunciationError('no_token', data.error || `토큰 발급 실패 (HTTP ${r.status})`)
    }
  }

  // DEV 전용 직결 폴백 (vercel dev 없이 vite dev 로 품질 테스트할 때)
  if (import.meta.env.DEV) {
    const key = (import.meta.env.VITE_AZURE_SPEECH_KEY as string | undefined)?.trim()
    const region = (import.meta.env.VITE_AZURE_SPEECH_REGION as string | undefined)?.trim()
    if (key && region) return { value: key, region, kind: 'key' }
  }

  if (!user) throw new PronunciationError('no_auth', '로그인이 필요합니다')
  throw new PronunciationError('no_token', '채점 토큰을 받지 못했습니다')
}

/**
 * 마이크로 한 문장을 받아 참조 문장(referenceText) 대비 발음을 채점한다.
 * 마이크 캡처·전송은 SDK가 담당하며, 오디오는 서버(우리 쪽)를 거치지 않고 Azure 로 직행한다.
 */
export async function assessPronunciation(
  referenceText: string,
  handlers: { onStart?: () => void } = {},
): Promise<PronunciationResult> {
  if (!pronunciationSupported()) {
    throw new PronunciationError('unsupported', '이 기기에서는 마이크를 사용할 수 없습니다')
  }

  const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk')
  const { value, region, kind } = await getAuth()

  const speechConfig =
    kind === 'key'
      ? SpeechSDK.SpeechConfig.fromSubscription(value, region)
      : SpeechSDK.SpeechConfig.fromAuthorizationToken(value, region)
  speechConfig.speechRecognitionLanguage = 'ko-KR'
  // 시작 신호 후 말을 시작할 여유(기본 5초 → 15초)와, 단어 사이 쉼으로 조기 종료되지 않도록
  // 문장 끝 판정 침묵을 늘린다(기본 ~0.5초 → 1.5초). 짧은 문장에서 NoMatch 를 줄인다.
  speechConfig.setProperty(
    SpeechSDK.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
    '15000',
  )
  speechConfig.setProperty(SpeechSDK.PropertyId.Speech_SegmentationSilenceTimeoutMs, '1500')

  const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput()

  const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
    referenceText,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    false, // enableMiscue
  )
  // 주의: enableProsodyAssessment() 는 ko-KR 미지원이라 호출하지 않는다.

  const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig)
  paConfig.applyTo(recognizer)

  handlers.onStart?.()

  return await new Promise<PronunciationResult>((resolve, reject) => {
    recognizer.recognizeOnceAsync(
      (result) => {
        try {
          if (result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
            const pa = SpeechSDK.PronunciationAssessmentResult.fromResult(result)
            const words: WordScore[] = []
            try {
              const raw = result.properties.getProperty(
                SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult,
              )
              const json = JSON.parse(raw)
              const nb = json?.NBest?.[0]
              for (const w of nb?.Words ?? []) {
                words.push({
                  word: w.Word,
                  accuracy: w.PronunciationAssessment?.AccuracyScore ?? 0,
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                })
              }
            } catch {
              /* 단어별 상세 파싱 실패는 무시 — 총점만으로도 유효 */
            }
            resolve({
              accuracy: pa.accuracyScore,
              fluency: pa.fluencyScore,
              completeness: pa.completenessScore,
              pron: pa.pronunciationScore,
              words,
              recognizedText: result.text ?? '',
            })
          } else if (result.reason === SpeechSDK.ResultReason.NoMatch) {
            reject(new PronunciationError('no_match', '음성을 인식하지 못했어요. 다시 또렷하게 말해보세요.'))
          } else {
            // Canceled — 실제 사유(인증/연결/마이크)를 추출해 노출한다.
            let detail = ''
            try {
              const c = SpeechSDK.CancellationDetails.fromResult(result)
              detail = `${SpeechSDK.CancellationReason[c.reason] ?? c.reason}: ${c.errorDetails ?? ''}`.trim()
            } catch {
              /* ignore */
            }
            console.error('[pronunciation] canceled —', detail)
            reject(new PronunciationError('canceled', detail ? `채점 취소 — ${detail}` : '채점이 취소되었습니다'))
          }
        } catch (e) {
          reject(new PronunciationError('unknown', e instanceof Error ? e.message : String(e)))
        } finally {
          recognizer.close()
        }
      },
      (err) => {
        recognizer.close()
        reject(new PronunciationError('unknown', typeof err === 'string' ? err : '채점 중 오류가 발생했습니다'))
      },
    )
  })
}
