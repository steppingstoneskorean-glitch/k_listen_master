// src/lib/speak.ts
// ─────────────────────────────────────────────────────────────────────────────
// 브라우저 음성합성(Web Speech API)으로 한국어 문장을 읽어준다.
//   · 개인 복습(Personal Review)에서 오답 문장을 다시 들려주는 데 쓴다.
//   · K-Stars(유튜브 구간 재생)·Shadowing 오답 레코드에는 저장된 오디오 파일이
//     없어서 TTS 가 모든 소스에 통하는 유일한 재생 수단이다.
//   · Catch the Sound 는 녹음된 /audio/{word}.wav 가 있으므로 호출부에서 파일을
//     우선 재생하고, 없거나 실패하면 이 TTS 로 폴백한다.
// ─────────────────────────────────────────────────────────────────────────────

let cachedKoVoice: SpeechSynthesisVoice | null = null

/** 이 브라우저가 음성합성을 지원하는지. */
export function speechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  )
}

function koVoice(): SpeechSynthesisVoice | undefined {
  if (!speechSupported()) return undefined
  if (cachedKoVoice) return cachedKoVoice
  const voices = window.speechSynthesis.getVoices()
  cachedKoVoice =
    voices.find(v => v.lang === 'ko-KR') ??
    voices.find(v => v.lang?.toLowerCase().startsWith('ko')) ??
    null
  return cachedKoVoice ?? undefined
}

// 음성 목록은 비동기로 로드된다 — 준비되면 캐시를 비워 다음 호출에서 다시 잡히게 한다.
if (speechSupported()) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedKoVoice = null
  }
}

export interface SpeakHandlers {
  onstart?: () => void
  onend?: () => void
  onerror?: () => void
}

/**
 * 한국어 텍스트를 읽어준다(한 번에 하나만 — 이전 발화는 중단).
 * 발화를 시작하면 true, 지원하지 않거나 텍스트가 비면 false 를 반환한다.
 */
export function speakKorean(text: string, handlers: SpeakHandlers = {}): boolean {
  if (!speechSupported() || !text.trim()) {
    handlers.onerror?.()
    return false
  }
  const synth = window.speechSynthesis
  synth.cancel() // 재생 중이던 발화 중단
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'ko-KR'
  const v = koVoice()
  if (v) u.voice = v
  u.rate = 0.95
  if (handlers.onstart) u.onstart = handlers.onstart
  u.onend = () => handlers.onend?.()
  u.onerror = () => handlers.onerror?.()
  synth.speak(u)
  return true
}

/** 진행 중인 발화를 멈춘다. */
export function cancelSpeech(): void {
  if (speechSupported()) window.speechSynthesis.cancel()
}
