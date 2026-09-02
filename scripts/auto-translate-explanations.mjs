#!/usr/bin/env node
// scripts/auto-translate-explanations.mjs
// ─────────────────────────────────────────────────────────────────────────────
// 해설 ja/es 자동 번역 — 로컬 수동 실행 러너 (cron 엔드포인트와 동일 코어 공유).
//   · 한국어(한글)는 절대 건드리지 않음 — 기계적 가드로 강제(api/_lib/explanationI18n).
//   · published + draft 두 곳 모두에 반영. 같은 영어 원문은 1회만 번역(캐시).
//
//   node scripts/auto-translate-explanations.mjs [videoId]            # DRY-RUN(미리보기)
//   node scripts/auto-translate-explanations.mjs [videoId] --commit   # 백업 후 Firestore 반영
//     · videoId 생략 시 컬렉션 전체를 대상으로 한다.
//
//   필요: serviceAccountKey.json (루트) · NVIDIA_API_KEY (.env.local)
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { LANGS, needsTranslation, fillMissingTranslations } from '../api/_lib/explanationI18n.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const COLLECTION = 'kartistQuizzes'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/)
    if (!m) continue
    let v = m[2]
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!(m[1] in process.env)) process.env[m[1]] = v
  }
}
loadEnvFile(path.join(ROOT, '.env.local'))
loadEnvFile(path.join(ROOT, '.env'))

const args = process.argv.slice(2)
const commit = args.includes('--commit')
const videoId = args.find((a) => !a.startsWith('--')) || null

const apiKey = (process.env.NVIDIA_API_KEY || '').trim()
if (!apiKey) { console.error('❌ NVIDIA_API_KEY 없음(.env.local)'); process.exit(1) }
const keyPath = path.join(ROOT, 'serviceAccountKey.json')
if (!fs.existsSync(keyPath)) { console.error('❌ serviceAccountKey.json 이 루트에 없습니다'); process.exit(1) }

initializeApp({ credential: cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))) })
const db = getFirestore()

const log = (m) => console.log(m)

;(async () => {
  console.log(`대상: ${videoId ? `영상 ${videoId}` : '컬렉션 전체'} · 언어: ${LANGS.join(', ')} · ${commit ? '🔴 COMMIT' : '🟢 DRY-RUN'}\n`)

  const snaps = videoId
    ? [await db.collection(COLLECTION).doc(videoId).get()]
    : (await db.collection(COLLECTION).get()).docs

  const cache = new Map()
  const changes = []   // { ref, next:{published?,draft?} }
  let totalFilled = 0, totalFailed = 0

  for (const snap of snaps) {
    if (!snap.exists) { console.log(`(문서 없음: ${videoId})`); continue }
    const d = snap.data()
    const next = {}
    let docChanged = false
    for (const field of ['published', 'draft']) {
      if (!Array.isArray(d[field])) continue
      // 원본을 훼손하지 않도록 깊은 복사본에서 작업
      const items = d[field].map((it) => ({ ...it }))
      const pending = items.filter((it) => it && needsTranslation(it.explanation)).length
      if (!pending) { next[field] = d[field]; continue }
      console.log(`  ${snap.id} · ${field}: 번역 필요 ${pending}개`)
      const { changed, filled, failed } = await fillMissingTranslations(items, apiKey, { cache, onLog: (m) => log('    ' + m) })
      totalFilled += filled; totalFailed += failed
      if (changed) { next[field] = items; docChanged = true } else { next[field] = d[field] }
    }
    if (docChanged) changes.push({ id: snap.id, ref: snap.ref, next })
  }

  console.log(`\n채운 슬롯: ${totalFilled}개 · 실패(재시도 대상): ${totalFailed}개 · 영향 문서: ${changes.length}개`)

  if (!commit) {
    console.log('\n🟢 DRY-RUN — Firestore 미변경.  반영: 같은 명령에 --commit 추가')
    process.exit(0)
  }
  if (!changes.length) { console.log('\n변경 없음 — 종료'); process.exit(0) }

  // 백업 후 쓰기
  fs.mkdirSync(path.join(ROOT, 'backups'), { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = {}
  for (const { id, ref } of changes) backup[id] = (await ref.get()).data()
  const bfile = path.join(ROOT, 'backups', `kartistQuizzes-i18n-${stamp}.json`)
  fs.writeFileSync(bfile, JSON.stringify(backup, null, 2))
  console.log(`\n💾 백업: ${path.relative(ROOT, bfile)}`)

  let written = 0
  for (const { ref, next } of changes) { await ref.update(next); written++ }
  console.log(`\n✅ 완료 — 문서 ${written}개 업데이트. 라이브 ja/es 에서 반영됩니다.`)
  process.exit(0)
})().catch((e) => { console.error('\n❌ 오류:', e.message); process.exit(1) })
