// src/lib/resultCardImage.ts
// ResultCard DOM 노드를 PNG 로 캡처해 모바일은 OS 공유 시트, 데스크톱은 다운로드로 내보낸다.
//   · KpopQuiz.jsx 의 canvas 기반 shareCard() 와 동일한 분기 전략을 html-to-image 캡처로 일반화한 버전.

import { toPng } from 'html-to-image'

export type CaptureResult = 'shared' | 'downloaded' | 'failed'

export async function captureAndShare(
  node: HTMLElement,
  filename: string,
  shareText?: string,
): Promise<CaptureResult> {
  try {
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], filename, { type: 'image/png' })

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: shareText })
      return 'shared'
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return 'downloaded'
  } catch {
    return 'failed'
  }
}
