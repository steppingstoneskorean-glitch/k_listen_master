// api/translate-explanations.js
// ─────────────────────────────────────────────────────────────────────────────
// 해설(explanation) ja/es 번역기 (Serverless Function)
//   · 운영자가 스튜디오에서 퀴즈를 "배포"하면 스튜디오가 이 엔드포인트를 곧바로
//     호출해(videoId 지정) 그 영상의 ja/es 누락 해설만 번역·저장한다.
//     (예전 GitHub Actions 주기 호출은 폐지 — 배포 시점에만 동작)
//   · 한국어(한글)는 절대 손대지 않음 — 기계적 가드로 강제(api/_lib/explanationI18n).
//     가드를 통과 못한 언어는 저장하지 않고, 다음 배포 때 다시 시도한다.
//   · published + draft 두 곳 모두 반영. 같은 영어 원문은 1회만 번역(문서 내 캐시).
//   · Hobby 60초 상한에 맞춰 "시간 예산" 안에서 문서 단위로 즉시 저장한다.
//     다 못 끝내면 remaining > 0 을 돌려주고, 스튜디오가 이어서 재호출한다.
//
//   POST /api/translate-explanations   body: { videoId?: string }
//   인증(둘 중 하나):
//     Authorization: Bearer <관리자 Firebase ID Token>  — 스튜디오
//     Authorization: Bearer <CRON_SECRET>                — 수동 호출(curl 등), 설정된 경우만
//   videoId 생략 시 컬렉션 전체를 훑는다.
//
//   필요한 Vercel 환경 변수:
//     FIREBASE_SERVICE_ACCOUNT — 서비스 계정 키 JSON 전체(문자열)
//     NVIDIA_API_KEY           — NVIDIA build.nvidia.com 발급 키
//     FIREBASE_API_KEY         — 관리자 ID 토큰 검증용
//   (선택) CRON_SECRET, NVIDIA_TRANSLATE_MODEL
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { LANGS, needsTranslation, fillMissingTranslations } from './_lib/explanationI18n.mjs'
import { verifyAdmin } from './_lib/verifyAdmin.mjs'

export const config = { maxDuration: 60 }

const COLLECTION = 'kartistQuizzes'
// 60초 상한 안에서 안전하게 끝내고 응답까지 반환하도록, 새 번역 시작은 이 시간까지만.
const SOFT_BUDGET_MS = 45_000

function initAdmin() {
  if (getApps().length) return
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is missing')
  const sa = JSON.parse(raw)
  if (sa.private_key && sa.private_key.includes('\\n')) sa.private_key = sa.private_key.replace(/\\n/g, '\n')
  initializeApp({ credential: cert(sa) })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  // ── 인증 (fail-closed): 관리자 ID 토큰 또는 CRON_SECRET ──
  const token = (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'unauthorized' })
  const secret = process.env.CRON_SECRET
  let authorized = Boolean(secret) && token === secret
  if (!authorized) {
    try { authorized = Boolean(await verifyAdmin(token)) } catch (err) {
      console.error('[translate-explanations] admin verify failed:', err.message)
      return res.status(500).json({ error: 'server_misconfigured' })
    }
  }
  if (!authorized) return res.status(401).json({ error: 'unauthorized' })

  const videoId = req.body && typeof req.body.videoId === 'string' ? req.body.videoId.trim() : ''

  const apiKey = (process.env.NVIDIA_API_KEY || '').trim()
  if (!apiKey) return res.status(500).json({ error: 'missing_nvidia_key' })

  try { initAdmin() } catch (err) {
    console.error('[translate-explanations] admin init failed:', err.message)
    return res.status(500).json({ error: 'init_failed', message: err.message })
  }
  const db = getFirestore()

  const startedAt = Date.now()
  let docsScanned = 0, docsUpdated = 0, filled = 0, failed = 0, remaining = 0
  let budgetHit = false

  try {
    const col = db.collection(COLLECTION)
    let docs
    if (videoId) {
      const one = await col.doc(videoId).get()
      docs = one.exists ? [one] : []
    } else {
      docs = (await col.get()).docs
    }
    for (const doc of docs) {
      docsScanned++
      const d = doc.data()

      // 이 문서에 번역할 게 남았는지 먼저 확인(불필요한 처리/쓰기 방지)
      const pending = ['published', 'draft'].reduce((n, f) =>
        n + (Array.isArray(d[f]) ? d[f].filter((it) => it && needsTranslation(it.explanation)).length : 0), 0)
      if (!pending) continue

      // 시간 예산 초과 시: 남은 문서는 다음 실행으로 미룸
      if (Date.now() - startedAt > SOFT_BUDGET_MS) { budgetHit = true; remaining += pending; continue }

      const cache = new Map()
      const next = {}
      let docChanged = false
      for (const field of ['published', 'draft']) {
        if (!Array.isArray(d[field])) continue
        const items = d[field].map((it) => ({ ...it }))
        const r = await fillMissingTranslations(items, apiKey, {
          cache,
          deadline: startedAt + SOFT_BUDGET_MS,
          onLog: (m) => console.log(`[translate-explanations] ${doc.id}/${field} ${m}`),
        })
        filled += r.filled; failed += r.failed
        next[field] = r.changed ? items : d[field]
        if (r.changed) docChanged = true
        if (r.timedOut) budgetHit = true
        remaining += items.filter((it) => it && needsTranslation(it.explanation)).length
      }

      if (docChanged) {
        await doc.ref.update(next)   // 문서 단위 즉시 저장 → 이후 타임아웃돼도 진행분 보존
        docsUpdated++
      }
    }
  } catch (err) {
    console.error('[translate-explanations] failed:', err)
    return res.status(500).json({ error: 'run_failed', message: err.message, filled, docsUpdated })
  }

  const elapsedMs = Date.now() - startedAt
  console.log(`[translate-explanations] done — filled ${filled}, docsUpdated ${docsUpdated}, failed ${failed}, budgetHit ${budgetHit}, ${elapsedMs}ms`)
  return res.status(200).json({ ok: true, langs: LANGS, docsScanned, docsUpdated, filled, failed, remaining, budgetHit, elapsedMs })
}
