// src/data/listening/strings.ts
// ─────────────────────────────────────────────────────────────────────────────
// 리스닝 설명 텍스트(StringId) → 학습자 언어 해석기.
//   · question/note 는 StringId 로 저장되고, 실제 텍스트는 strings.json 에 언어별로.
//   · 실서비스는 번역 xlsx → strings.json 생성(기존 i18n 파이프라인과 동일 방식).
//   · KO 는 소스, 화면에는 학습자 언어(en/es/ja…)로 표시 — 없으면 en → ko 폴백.
// ─────────────────────────────────────────────────────────────────────────────

import STRINGS from './strings.json'

type Entry = Record<string, string> // lang → text
const table = STRINGS as Record<string, Entry>

/**
 * StringId(또는 원문 문자열)를 학습자 언어로 해석한다.
 *   · 키가 번역셋에 있으면 lang → (기본 lang) → en → ko 순 폴백.
 *   · 키가 없으면(목/원문 문자열) 그대로 반환(passthrough) — 데모 데이터 호환.
 */
export function resolveString(idOrText: string | undefined, lang: string): string {
  if (!idOrText) return ''
  const e = table[idOrText]
  if (!e) return idOrText
  return e[lang] ?? e[lang.split('-')[0]] ?? e.en ?? e.ko ?? idOrText
}
