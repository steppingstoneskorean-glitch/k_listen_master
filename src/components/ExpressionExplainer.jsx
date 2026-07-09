// src/components/ExpressionExplainer.jsx
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 문장 속 표현 클릭 즉석 해설
//   ClickableKorean : 한국어 문장을 단어 단위 버튼으로 렌더링
//   useExpressionExplainer : /api/explain-expression 호출 + 세션 캐시 관리
//   ExpressionModal : 로딩/결과/에러를 보여주는 바텀시트 모달
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useRef, useState } from 'react';
import { useLang } from '@/lib/i18n';

// 같은 표현을 여러 번 클릭해도 재요청하지 않도록 모듈 스코프 캐시 (컴포넌트 재마운트에도 유지)
const explainCache = new Map();

// 문장부호를 떼어낸 클릭 가능한 표현만 추출 (물음표/쉼표 등은 해설 대상이 아님)
function stripPunctuation(word) {
  return word.replace(/^[.,!?~…"'“”()[\]]+|[.,!?~…"'“”()[\]]+$/g, '').trim();
}

/** 한국어 텍스트를 공백 기준으로 쪼개 각 어절을 클릭 가능한 버튼으로 렌더링 */
export function ClickableKorean({ text, onWordClick, className = '' }) {
  if (!text) return null;
  const tokens = text.split(/(\s+)/);
  return (
    <span className={className}>
      {tokens.map((tok, i) => {
        if (/^\s*$/.test(tok)) return <span key={i}>{tok}</span>;
        const clean = stripPunctuation(tok);
        if (!clean) return <span key={i}>{tok}</span>;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onWordClick(clean)}
            className="rounded px-0.5 underline decoration-dotted decoration-1 underline-offset-2 transition-colors hover:bg-fuchsia-100 hover:text-fuchsia-700 focus:outline-none focus:ring-1 focus:ring-fuchsia-400"
          >
            {tok}
          </button>
        );
      })}
    </span>
  );
}

/** 표현 해설 요청/상태를 관리하는 훅. KpopQuiz 최상단에서 한 번 생성해 하위로 내려준다. */
export function useExpressionExplainer({ videoId, artist } = {}) {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState('');
  const reqIdRef = useRef(0);

  const explain = useCallback(
    async (word, fullSentence) => {
      const clean = stripPunctuation(word);
      if (!clean) return;

      setExpression(clean);
      setOpen(true);
      setError('');

      const cacheKey = `${fullSentence || ''}::${clean}`;
      if (explainCache.has(cacheKey)) {
        setExplanation(explainCache.get(cacheKey));
        setLoading(false);
        return;
      }

      setLoading(true);
      setExplanation('');
      const myId = ++reqIdRef.current; // 연타 클릭 시 마지막 요청만 반영

      try {
        const r = await fetch('/api/explain-expression', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ expression: clean, fullSentence, videoId, artist }),
        });
        // 서버가 항상 JSON을 준다고 가정하지 않는다 (타임아웃/네트워크 오류 시 HTML/빈 본문이 올 수 있음)
        const data = await r.json().catch(() => null);
        if (myId !== reqIdRef.current) return;
        if (!r.ok || !data) throw new Error((data && data.error) || `HTTP ${r.status}`);
        explainCache.set(cacheKey, data.explanation);
        setExplanation(data.explanation);
      } catch (err) {
        if (myId !== reqIdRef.current) return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (myId === reqIdRef.current) setLoading(false);
      }
    },
    [videoId, artist],
  );

  const close = useCallback(() => setOpen(false), []);

  return { open, expression, loading, explanation, error, explain, close };
}

/** 표현 해설 결과를 보여주는 바텀시트 모달 */
export function ExpressionModal({ open, expression, loading, explanation, error, onClose }) {
  const { t } = useLang();
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="kq-pop max-h-[75vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-fuchsia-500">
            {t('expl.tag')}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('expl.close')}
            className="shrink-0 rounded-full px-1.5 text-lg leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <p translate="no" className="notranslate mt-1 text-xl font-extrabold text-slate-900">
          “{expression}”
        </p>

        {loading && (
          <div className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400" />
            </span>
            {t('expl.loading')}
          </div>
        )}

        {!loading && error && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</p>
        )}

        {!loading && !error && explanation && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
