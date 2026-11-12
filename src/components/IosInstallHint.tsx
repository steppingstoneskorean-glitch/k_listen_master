import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'
import { usePwaInstall } from '@/lib/pwaInstall'
import { isIosHintHidden, hideIosHintForDays } from '@/lib/installPrompts'

// iOS Safari 전용 "홈 화면에 추가" 힌트 (디스미스형, 라이트 테마).
//   · iOS 는 beforeinstallprompt 가 없어 Chrome/안드로이드용 설치 배너가 뜨지 않는다 →
//     웹 링크로 들어온 아이폰 방문자가 앱처럼 쓰는 법을 몰라 이탈하는 공백을 메운다.
//   · 설치(standalone) 상태거나, 한 번 닫으면 14일간 다시 뜨지 않는다(localStorage).
//   · Safari 공유 버튼이 화면 하단에 있으므로 하단에 띄우고, 바텀 탭바 위로 살짝 올린다.
export default function IosInstallHint() {
  const { t } = useLang()
  const { isIOS, isInstalled } = usePwaInstall()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isIOS || isInstalled || isIosHintHidden()) return
    // 첫 진입 직후가 아니라 잠깐 둘러본 뒤에 뜨도록 2.5초 지연 (첫 화면을 가리지 않게).
    const id = window.setTimeout(() => setShow(true), 2500)
    return () => window.clearTimeout(id)
  }, [isIOS, isInstalled])

  if (!show) return null

  const dismiss = () => {
    hideIosHintForDays(14)
    setShow(false)
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)' }}
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-sm">
        <span className="text-2xl leading-none" aria-hidden="true">📲</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">{t('install.iosBannerLead')}</p>
          <p className="mt-0.5 text-xs leading-snug text-slate-500">{t('install.iosHint')}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('install.closeBtn')}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
