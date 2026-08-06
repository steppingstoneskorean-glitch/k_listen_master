// src/lib/exclusivePlayer.ts
// 페이지 전체에서 한 번에 하나의 오디오만 재생되도록 조정한다.
// 새 오디오를 재생하면 직전에 재생 중이던 것을 자동으로 멈춘다.

let current: HTMLAudioElement | null = null

export function playExclusive(a: HTMLAudioElement): void {
  if (current && current !== a) current.pause()
  current = a
  a.play().catch(() => {})
}

export function stopExclusive(): void {
  current?.pause()
  current = null
}
