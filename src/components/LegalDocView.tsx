// src/components/LegalDocView.tsx
// 약관/개인정보처리방침 공용 렌더러 + 다국어 콘텐츠 타입.
//   · 한국어가 법적 정본(authoritative). 다른 언어는 편의 번역이며 상충 시 한국어 우선.
//   · 본문 문자열의 인라인 토큰: {email}, [텍스트](URL), **강조** 를 렌더링한다.

import { type ReactNode } from 'react'

const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'

export type LegalLang = 'ko' | 'en' | 'ja' | 'es'

export interface LegalBlock {
  p?: string
  sub?: string // 굵은 소제목
  ul?: string[]
  note?: string // 작은 회색 보조 문구
  table?: { headers: string[]; rows: string[][] }
}
export interface LegalSection {
  title: string
  blocks: LegalBlock[]
}
export interface LegalDoc {
  title: string
  convenience: string // 정본/편의 번역 고지
  intro: string
  sections: LegalSection[]
  effectiveLabel: string
  effectiveDate: string
  footer?: string
}

// {email} / [text](url) / **bold** 인라인 토큰 파서
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\{email\}/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(<strong key={k++} className="text-gray-200">{m[1]}</strong>)
    } else if (m[2] !== undefined) {
      nodes.push(
        <a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">
          {m[2]}
        </a>,
      )
    } else {
      nodes.push(<span key={k++} className="text-gray-500">{ADMIN_EMAIL}</span>)
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

function Block({ b }: { b: LegalBlock }) {
  if (b.sub) return <p className="text-sm font-semibold text-gray-300 mt-1">{renderInline(b.sub)}</p>
  if (b.p) return <p className="text-sm leading-relaxed text-gray-400">{renderInline(b.p)}</p>
  if (b.note) return <p className="text-xs leading-relaxed text-gray-500 mt-1">{renderInline(b.note)}</p>
  if (b.ul)
    return (
      <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
        {b.ul.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    )
  if (b.table)
    return (
      <div className="overflow-x-auto mt-1">
        <table className="w-full text-xs text-left text-gray-400 border-collapse">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              {b.table.headers.map((h, i) => (
                <th key={i} className="py-2 pr-3 font-semibold align-top">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map((row, r) => (
              <tr key={r} className="border-b border-gray-800/60">
                {row.map((c, i) => (
                  <td key={i} className="py-2 pr-3 align-top">{renderInline(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  return null
}

export default function LegalDocView({ doc }: { doc: LegalDoc }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-gray-300">
      <div>
        <h1 className="text-2xl font-black text-white">{doc.title}</h1>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">{renderInline(doc.intro)}</p>
        {doc.convenience && (
          <p className="mt-3 rounded-lg border border-gray-800 bg-gray-900/60 px-3 py-2 text-[11px] leading-relaxed text-gray-500">
            {renderInline(doc.convenience)}
          </p>
        )}
      </div>

      {doc.sections.map((s, i) => (
        <section key={i} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-white">{s.title}</h2>
          {s.blocks.map((b, j) => (
            <Block key={j} b={b} />
          ))}
        </section>
      ))}

      <p className="text-xs text-gray-600 pt-4 border-t border-gray-800 leading-relaxed">
        {doc.effectiveLabel}: {doc.effectiveDate}
        {doc.footer && (
          <>
            <br />
            {doc.footer}
          </>
        )}
      </p>
    </div>
  )
}
