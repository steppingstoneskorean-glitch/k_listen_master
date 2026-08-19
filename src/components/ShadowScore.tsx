// src/components/ShadowScore.tsx
// 섀도잉 AI 발음 채점 UI — Azure Pronunciation Assessment 결과를 카드로 보여준다.
//   흐름: [🤖 AI 채점] 탭 → 문장 낭독 → 종합/정확도/유창성/완성도 + 단어별 색상.
//   한국어는 톤(Prosody) 미지원이라 발음 정확도·유창성 위주. (안내 문구 노출)
//   오디오는 Azure 로 직행하며 어디에도 저장되지 않는다.

import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLang } from '@/lib/i18n'
import {
  assessPronunciation,
  pronunciationSupported,
  PronunciationError,
  type PronunciationResult,
} from '@/lib/pronunciation'
import { hasShadowConsent, setShadowConsent } from '@/lib/shadowConsent'

// 점수 → 색상 (정확도 기준: 초록 ≥80, 노랑 60–79, 빨강 <60)
function tone(score: number): { text: string; bg: string; ring: string } {
  if (score >= 80) return { text: 'text-emerald-700', bg: 'bg-emerald-50', ring: 'text-emerald-500' }
  if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', ring: 'text-amber-500' }
  return { text: 'text-rose-700', bg: 'bg-rose-50', ring: 'text-rose-500' }
}

function ScoreRing({ score }: { score: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const t = tone(score)
  return (
    <div className="relative flex items-center justify-center" style={{ width: 88, height: 88 }}>
      <svg width={88} height={88} className="-rotate-90">
        <circle cx={44} cy={44} r={r} fill="none" stroke="currentColor" strokeWidth={8} className="text-slate-200" />
        <circle
          cx={44} cy={44} r={r} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
          className={`${t.ring} transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <span className={`absolute text-2xl font-black tabular-nums ${t.text}`}>{Math.round(score)}</span>
    </div>
  )
}

function SubScore({ label, score }: { label: string; score: number }) {
  const t = tone(score)
  return (
    <div className={`flex-1 rounded-xl ${t.bg} px-2 py-2 text-center`}>
      <div className={`text-lg font-black tabular-nums ${t.text}`}>{Math.round(score)}</div>
      <div className="text-[10px] font-bold text-slate-500 leading-tight">{label}</div>
    </div>
  )
}

export default function ShadowScore({
  referenceText,
  triggerNonce,
  hideButton = false,
}: {
  referenceText: string
  triggerNonce?: number // 값이 바뀌면 자동 채점 시작 (녹음 버튼이 구동)
  hideButton?: boolean // 자체 [AI 채점] 버튼 숨김 (녹음이 트리거일 때)
}) {
  const { t } = useLang()
  const [status, setStatus] = useState<'idle' | 'consent' | 'declined' | 'consented' | 'scoring' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<PronunciationResult | null>(null)
  const [errMsg, setErrMsg] = useState<string>('')

  const supported = pronunciationSupported()

  const run = useCallback(async () => {
    // 음성이 Azure(제3자)로 전송되므로, 사전 동의가 없으면 채점 대신 동의 UI 를 띄운다.
    if (!hasShadowConsent()) { setStatus('consent'); return }
    setStatus('scoring')
    setErrMsg('')
    try {
      const r = await assessPronunciation(referenceText)
      setResult(r)
      setStatus('done')
    } catch (e) {
      const msg =
        e instanceof PronunciationError && e.code === 'no_match'
          ? t('shadowing.scoreNoMatch')
          : e instanceof PronunciationError
            ? e.message
            : t('shadowing.scoreFailed')
      setErrMsg(msg)
      setStatus('error')
    }
  }, [referenceText, t])

  // 녹음 버튼이 트리거: triggerNonce 가 바뀌면 자동 채점. (최초 렌더 0 은 무시)
  const lastNonce = useRef<number | undefined>(triggerNonce)
  useEffect(() => {
    if (triggerNonce === undefined) return
    if (triggerNonce === lastNonce.current) return
    lastNonce.current = triggerNonce
    void run()
  }, [triggerNonce, run])

  if (!supported) return null

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* 자체 버튼 (녹음이 트리거인 경우 숨김) */}
      {!hideButton && (status === 'idle' || status === 'scoring') && (
        <button
          onClick={run}
          disabled={status === 'scoring'}
          className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all ${
            status === 'scoring'
              ? 'bg-slate-400 animate-pulse cursor-wait'
              : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:opacity-90'
          }`}
        >
          {status === 'scoring' ? `🎙️ ${t('shadowing.scoring')}` : t('shadowing.aiScore')}
        </button>
      )}
      {!hideButton && status === 'idle' && (
        <p className="text-[11px] text-slate-500 text-center max-w-xs leading-snug">{t('shadowing.scoreSpeakNow')}</p>
      )}
      {status === 'scoring' && (
        <p className="text-sm font-bold text-rose-500 text-center animate-pulse">{t('shadowing.scoreSpeakLive')}</p>
      )}

      {/* 동의 UI — 음성이 Azure 로 전송되므로 사전 동의 필요 */}
      {status === 'consent' && (
        <div className="w-full rounded-2xl border border-sky-200 bg-sky-50 p-4 flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-bold text-slate-800">{t('shadowing.consentTitle')}</p>
          <p className="text-[12px] text-slate-600 leading-relaxed">{t('shadowing.consentBody')}</p>
          <Link to="/privacy" className="text-[11px] font-bold text-sky-600 underline hover:text-sky-700">
            {t('shadowing.consentPrivacy')}
          </Link>
          <div className="w-full flex items-center gap-2 pt-1">
            <button
              onClick={() => setStatus('declined')}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-600 font-bold hover:border-slate-400 text-sm"
            >
              {t('shadowing.consentCancel')}
            </button>
            <button
              onClick={() => { setShadowConsent(true); setStatus('consented') }}
              className="flex-1 py-2.5 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-500 text-sm"
            >
              {t('shadowing.consentAgree')}
            </button>
          </div>
        </div>
      )}

      {status === 'consented' && (
        <p className="text-[12px] text-emerald-600 font-bold text-center max-w-xs leading-snug">✅ {t('shadowing.consentAfter')}</p>
      )}

      {/* 취소한 뒤에도 다시 동의할 수 있는 진입점 */}
      {status === 'declined' && (
        <button
          onClick={() => setStatus('consent')}
          className="px-4 py-2 rounded-full border border-sky-300 bg-sky-50 text-sky-700 font-bold hover:bg-sky-100 text-sm"
        >
          {t('shadowing.consentReopen')}
        </button>
      )}

      {status === 'error' && (
        <div className="w-full flex flex-col items-center gap-2">
          <p className="text-[12px] text-rose-500 text-center max-w-xs leading-snug">{errMsg}</p>
          <button
            onClick={run}
            className="px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 font-bold hover:border-slate-400 text-sm"
          >
            {t('shadowing.scoreAgain')}
          </button>
        </div>
      )}

      {status === 'done' && result && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col items-center gap-4">
          {/* 종합 링 + 서브 점수 */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex flex-col items-center gap-1">
              <ScoreRing score={result.pron} />
              <span className="text-[10px] font-bold text-slate-500">{t('shadowing.scoreOverall')}</span>
            </div>
            <div className="flex-1 flex gap-2">
              <SubScore label={t('shadowing.scoreAccuracy')} score={result.accuracy} />
              <SubScore label={t('shadowing.scoreFluency')} score={result.fluency} />
              <SubScore label={t('shadowing.scoreCompleteness')} score={result.completeness} />
            </div>
          </div>

          {/* 단어별 색상 (정확도) */}
          {result.words.length > 0 && (
            <div className="w-full flex flex-wrap justify-center gap-1.5" translate="no">
              {result.words.map((w, i) => {
                const isErr = w.errorType && w.errorType !== 'None'
                const tn = tone(w.accuracy)
                return (
                  <span
                    key={`${w.word}-${i}`}
                    className={`notranslate rounded-lg px-2 py-1 text-sm font-bold ${tn.bg} ${tn.text} ${
                      isErr ? 'line-through decoration-2 opacity-80' : ''
                    }`}
                    title={`${Math.round(w.accuracy)} · ${w.errorType}`}
                  >
                    {w.word}
                  </span>
                )
              })}
            </div>
          )}

          {/* 채점 기준 안내 */}
          <p className="text-[10px] text-slate-400 text-center leading-snug">{t('shadowing.scoreToneNote')}</p>

          <button
            onClick={run}
            className="px-4 py-2 rounded-full border border-slate-300 bg-white text-slate-700 font-bold hover:border-slate-400 text-sm"
          >
            {t('shadowing.scoreAgain')}
          </button>
        </div>
      )}
    </div>
  )
}
