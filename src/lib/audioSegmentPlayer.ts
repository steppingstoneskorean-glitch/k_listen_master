// src/lib/audioSegmentPlayer.ts
// 라디오 모드 플레이어 — 화면 자막이 박힌 팟캐스트 영상은 영상 대신 내 음원(audioUrl)만 재생한다.
//   · KpopQuiz 가 쓰는 YouTube 플레이어 메서드 이름(seekTo/playVideo/pauseVideo/getCurrentTime/
//     setPlaybackRate/getVideoData/destroy)을 그대로 제공해 구간 반복 로직을 손대지 않고 바꿔 끼운다.
//   · YouTube 플레이어를 가리고 소리만 내는 건 YouTube API 정책 위반이라 이 방식을 쓴다.
//   · 음원은 AI 퀴즈 담당(scripts/staff/podcast-audio.mjs)이 오너의 영상 파일에서 추출해 올린다.

export class AudioSegmentPlayer {
  private audio: HTMLAudioElement

  constructor(src: string, handlers: { onReady: () => void; onPlayingChange: (playing: boolean) => void }) {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this.audio.preservesPitch = true // 느린 배속에서도 목소리 톤 유지
    this.audio.addEventListener('loadedmetadata', handlers.onReady, { once: true })
    this.audio.addEventListener('play', () => handlers.onPlayingChange(true))
    this.audio.addEventListener('pause', () => handlers.onPlayingChange(false))
    this.audio.addEventListener('ended', () => handlers.onPlayingChange(false))
    this.audio.src = src
  }

  seekTo(seconds: number) {
    this.audio.currentTime = seconds
  }

  /** 자동재생이 막히면(사용자 탭 전) 조용히 실패 — 라디오 화면의 재생 버튼으로 시작한다 */
  playVideo() {
    void this.audio.play().catch(() => {})
  }

  pauseVideo() {
    this.audio.pause()
  }

  getCurrentTime() {
    return this.audio.currentTime
  }

  isPlaying() {
    return !this.audio.paused
  }

  setPlaybackRate(rate: number) {
    this.audio.playbackRate = rate
  }

  getVideoData() {
    return {}
  }

  destroy() {
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
  }
}
