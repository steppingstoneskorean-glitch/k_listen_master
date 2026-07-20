// src/components/ChallengeShare.tsx
// 결과 페이지 공용 '도전장 보내기' — 단일 버튼: 결과카드 이미지를 캡처해 도전장 문구·링크와
// 함께 공유한다. 모바일은 navigator.share(사진+문구 동시 첨부), 데스크톱은
// clipboard.writeText + 토스트로 폴백한다.
//   · variant='dark'(게임 결과 화면) / 'light'(밝은 배경)
//   · 마운트 시 결과카드를 한 번 캡처해 버튼 옆에 작은 미리보기로 보여주고, 공유 시 같은 이미지를 재사용한다.

import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLang } from '@/lib/i18n'
import { buildShareUrl } from '@/lib/shareUrl'

export default function ChallengeShare({
  label,
  score,
  stars,
  gamePath,
  correctCount,
  total,
  thumbnailUrl,
  variant = 'dark',
  cardRef,
  captureImage,
  shareMessage,
}: {
  /** 아티스트명(K-Artist Live) 또는 레벨 타이틀(Dictation/Game) */
  label: string
  score: number
  stars: number
  gamePath: string // 예: '/game', '/dictation?mode=advanced'
  correctCount?: number
  total?: number
  thumbnailUrl?: string
  variant?: 'dark' | 'light'
  /** 공유 시 함께 첨부할 결과카드 DOM 노드 — PNG로 캡처해 사진과 함께 공유한다 */
  cardRef?: RefObject<HTMLElement | null>
  /** DOM 캡처 대신 커스텀 방식(예: canvas 포토카드)으로 결과 이미지를 만들 때 사용 */
  captureImage?: () => Promise<Blob | null>
  /** 실제 공유될 텍스트를 기본 도전장 문구 대신 대체(링크 포함, 예: 이모지 결과 그리드) — 화면에 보이는 미리보기 문구는 그대로 유지 */
  shareMessage?: string
}) {
  const { t } = useLang()
  const [toast, setToast] = useState(false)
  const [busy, setBusy] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const capturedBlobRef = useRef<Blob | null>(null)

  const url = buildShareUrl({ path: gamePath, score, stars, label, correctCount, total, thumbnailUrl })
  const message = t('challenge.message')
    .replace('{score}', String(score))
    .replace('{name}', label)
    .replace('{stars}', String(stars))
  const shareText = shareMessage ?? `${message}\n${url}`

  // 마운트 시 결과카드를 한 번 캡처해 미리보기로 보여주고, 공유 클릭 시 재사용한다.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        let blob: Blob | null = null
        if (captureImage) {
          blob = await captureImage()
        } else if (cardRef?.current) {
          const { toPng } = await import('html-to-image')
          const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
          blob = await (await fetch(dataUrl)).blob()
        }
        if (!cancelled && blob) {
          capturedBlobRef.current = blob
          setPreviewUrl(URL.createObjectURL(blob))
        }
      } catch {
        /* 미리보기 캡처 실패 — 플레이스홀더 유지, 공유 시점에 재시도 */
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const share = async () => {
    setBusy(true)
    try {
      let file: File | undefined
      try {
        let blob: Blob | null = capturedBlobRef.current
        if (!blob) {
          if (captureImage) {
            blob = await captureImage()
          } else if (cardRef?.current) {
            const { toPng } = await import('html-to-image')
            const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true })
            blob = await (await fetch(dataUrl)).blob()
          }
        }
        if (blob) file = new File([blob], 'k-listen-result.png', { type: 'image/png' })
      } catch {
        /* 이미지 캡처 실패 — 문구·링크만 공유 */
      }

      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        try {
          if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            // 파일 첨부 시 일부 브라우저가 url 필드를 무시하므로 링크는 문구에 포함해 함께 전달
            await navigator.share({ files: [file], text: shareText })
          } else if (shareMessage) {
            await navigator.share({ text: shareMessage })
          } else {
            await navigator.share({ text: message, url })
          }
        } catch {
          /* 사용자가 공유 시트를 닫은 경우 등 — 무시 */
        }
        return
      }
      await navigator.clipboard.writeText(shareText)
      setToast(true)
      setTimeout(() => setToast(false), 2500)
    } finally {
      setBusy(false)
    }
  }

  const dark = variant === 'dark'

  return (
    <section
      className={`rounded-2xl border p-5 ${
        dark ? 'border-gray-800 bg-gray-900' : 'border-slate-200 bg-white shadow-sm'
      }`}
    >
      <style>{`
        @keyframes cs-toast-pop {
          0% { opacity: 0; transform: translateY(10px); }
          12% { opacity: 1; transform: translateY(0); }
          88% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(6px); }
        }
        .cs-toast-pop { animation: cs-toast-pop 2.5s ease forwards; }
      `}</style>

      <div className="flex items-start gap-3">
        {/* 결과카드 미리보기 — 공유 시 첨부되는 이미지와 동일 */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl shadow-md sm:h-24 sm:w-24">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl">
              🎧
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-black/40 py-0.5 text-center text-[10px] leading-none text-white">
            {'⭐'.repeat(Math.max(0, Math.min(5, stars)))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t('challenge.title')}</p>
          <p className={`mt-1 text-xs leading-relaxed ${dark ? 'text-gray-400' : 'text-slate-500'}`}>“{message}”</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={share}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${
                dark
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {busy ? '…' : t('challenge.shareBtn')}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 bottom-6 z-[90] flex justify-center px-4 pointer-events-none">
          <div className="cs-toast-pop pointer-events-auto rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-900 shadow-2xl">
            {t('challenge.toastMsg')}
          </div>
        </div>
      )}
    </section>
  )
}
