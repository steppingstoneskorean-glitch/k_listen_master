#!/usr/bin/env node
// scripts/staff/materials.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 직원 ② 자료 담당 — 워크시트·단어장 PDF → 앱 '무료 자료'
//   1) assets/무료자료PDF/ 에 새로 들어온 *.pdf 를 찾는다 (이 폴더는 gitignore — 공개 저장소 커밋 금지)
//   2) 앞쪽 페이지 텍스트 + 파일명으로 레벨·종류·에피소드를 분류 (NVIDIA LLM, 실패 시 파일명 규칙)
//   3) Firebase Storage materials/<id>.pdf 업로드 → Firestore materials/<id> 등록 (즉시 공개)
//      · Firestore 규칙상 materials 는 로그인 유저만 읽을 수 있다 → 다운로드 링크도 로그인 뒤에만 보인다
//   4) 처리한 파일은 assets/무료자료PDF/_처리완료/ 로 옮기고 텔레그램으로 분류 결과 보고
//
//   실행: node scripts/staff/materials.mjs [--dry-run]
//   같은 내용의 PDF(해시 동일)는 다시 올리지 않는다.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { extractText, getDocumentProxy } from 'unpdf'
import { ROOT, initAdmin, report, askJson, readState, writeState } from './_shared.mjs'

const INBOX = path.join(ROOT, 'assets', '무료자료PDF')
const DONE_DIR = path.join(INBOX, '_처리완료')
const MAX_TRIES = 3
const dryRun = process.argv.includes('--dry-run')

const LEVELS = ['beginner', 'intermediate', 'advanced', 'all']
const TYPES = ['worksheet', 'vocab', 'other']
const LABEL = {
  beginner: '초급', intermediate: '중급', advanced: '고급', all: '전체',
  worksheet: '워크시트', vocab: '단어장', other: '기타',
}

const CLASSIFY_PROMPT = `You classify Korean-language learning PDFs made by a Korean teacher (Stepping Stones Korean).
Return ONLY a JSON object:
{
  "level": "beginner" | "intermediate" | "advanced" | "all",
  "type": "worksheet" | "vocab" | "other",      // vocab = word list / 단어장 / vocabulary; worksheet = exercises / 워크시트 / 학습지
  "series": string,       // e.g. "Korean Podcast" — "" if none
  "episode": number | null,  // episode number if present (EP.02 → 2)
  "titleEn": string,      // short learner-facing English title, max 60 chars (e.g. "Late-Night Snacks in Korea — Vocabulary")
  "titleKo": string,      // same in Korean, max 40 chars
  "topic": string         // 2-5 word English topic (e.g. "late-night snacks")
}
Use the file name and the text. Level words: 초급/Beginner, 중급/Intermediate, 고급/Advanced. If unsure about level use "all".`

// LLM 이 실패해도 일을 멈추지 않도록 — 파일명만으로 최소 분류
function classifyByName(name) {
  const level = /초급|beginner/i.test(name) ? 'beginner' : /중급|intermediate/i.test(name) ? 'intermediate' : /고급|advanced/i.test(name) ? 'advanced' : 'all'
  const type = /단어|어휘|vocab|word/i.test(name) ? 'vocab' : /워크시트|학습지|worksheet|exercise/i.test(name) ? 'worksheet' : 'other'
  const ep = name.match(/ep\.?\s*0*(\d+)/i) ?? name.match(/^0*(\d+)\./) // "EP.02" 또는 "02.초급_..."
  const grade = name.match(/(\d)\s*급/)
  const base = path.basename(name, path.extname(name)).replace(/[_]+/g, ' ').trim()
  return { level, type, grade: grade ? Number(grade[1]) : null, series: '', episode: ep ? Number(ep[1]) : null, titleEn: base, titleKo: base, topic: '' }
}

async function classify(fileName, pagesText) {
  const fallback = classifyByName(fileName)
  try {
    const sample = pagesText.slice(0, 3).join('\n---\n').replace(/\s+/g, ' ').slice(0, 4000)
    const r = await askJson(CLASSIFY_PROMPT, `File name: ${fileName}\n\nText (first pages):\n${sample}`, { maxTokens: 600 })
    return {
      level: LEVELS.includes(r.level) ? r.level : fallback.level,
      type: TYPES.includes(r.type) ? r.type : fallback.type,
      grade: fallback.grade, // 급수는 파일명 표기(예: 2급)만 신뢰
      series: typeof r.series === 'string' ? r.series.slice(0, 60) : '',
      episode: Number.isInteger(r.episode) ? r.episode : fallback.episode,
      titleEn: typeof r.titleEn === 'string' && r.titleEn.trim() ? r.titleEn.trim().slice(0, 80) : fallback.titleEn,
      titleKo: typeof r.titleKo === 'string' && r.titleKo.trim() ? r.titleKo.trim().slice(0, 60) : fallback.titleKo,
      topic: typeof r.topic === 'string' ? r.topic.slice(0, 60) : '',
    }
  } catch (err) {
    console.warn(`   LLM 분류 실패(${err.message}) — 파일명 규칙 사용`)
    return fallback
  }
}

function moveToDone(file) {
  const month = new Date().toISOString().slice(0, 7)
  const dir = path.join(DONE_DIR, month)
  fs.mkdirSync(dir, { recursive: true })
  let dest = path.join(dir, path.basename(file))
  if (fs.existsSync(dest)) dest = dest.replace(/\.pdf$/i, `_${Date.now()}.pdf`)
  fs.renameSync(file, dest)
}

async function main() {
  if (!fs.existsSync(INBOX)) fs.mkdirSync(INBOX, { recursive: true })
  const files = fs
    .readdirSync(INBOX, { withFileTypes: true })
    .filter((d) => d.isFile() && /\.pdf$/i.test(d.name))
    .map((d) => path.join(INBOX, d.name))
  if (!files.length) {
    console.log('새 PDF 없음')
    return
  }

  const state = readState('materials')
  const app = initAdmin()
  const db = getFirestore(app)
  const bucket = getStorage(app).bucket()
  if (!dryRun) {
    const [exists] = await bucket.exists()
    if (!exists) {
      // Storage 미활성 상태 — 파일은 그대로 두고 오너에게 한 번만 알린다
      if (!state._bucketWarned) {
        await report('⚠️ 자료 담당: Firebase Storage 가 아직 켜져 있지 않아 PDF 를 올릴 수 없어요.\nFirebase 콘솔 → Storage → 시작하기 를 눌러 주세요. 켜지면 대기 중인 PDF 를 바로 올릴게요.')
        writeState('materials', { ...state, _bucketWarned: true })
      }
      console.warn(`Storage 버킷 없음 (${bucket.name}) — ${files.length}개 대기`)
      return
    }
    delete state._bucketWarned
  }

  const uploaded = []
  for (const file of files) {
    const name = path.basename(file)
    const s = state[name] ?? {}
    if ((s.tries ?? 0) >= MAX_TRIES) continue
    console.log(`\n▶ ${name}`)
    try {
      const buf = fs.readFileSync(file)
      const id = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16)
      const ref = db.collection('materials').doc(id)
      if ((await ref.get()).exists) {
        console.log('   이미 올라간 파일과 내용이 같음 — 건너뜀')
        if (!dryRun) moveToDone(file)
        continue
      }

      const { totalPages, text } = await extractText(await getDocumentProxy(new Uint8Array(buf)), { mergePages: false })
      const meta = await classify(name, text)
      console.log(`   → ${LABEL[meta.level]} · ${LABEL[meta.type]}${meta.grade ? ` · ${meta.grade}급` : ''}${meta.episode ? ` · EP.${meta.episode}` : ''} · ${meta.titleKo}`)

      if (!dryRun) {
        // 다운로드 토큰 URL — 링크 자체는 Firestore(로그인 유저 전용)에만 저장된다
        const token = crypto.randomUUID()
        const objectPath = `materials/${id}.pdf`
        await bucket.file(objectPath).save(buf, {
          resumable: false,
          metadata: {
            contentType: 'application/pdf',
            contentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
            cacheControl: 'private, max-age=3600',
            metadata: { firebaseStorageDownloadTokens: token },
          },
        })
        const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
        await ref.set({
          ...meta,
          fileName: name,
          pages: totalPages,
          sizeBytes: buf.length,
          storagePath: objectPath,
          url,
          published: true,
          by: 'materials-clerk',
          createdAt: FieldValue.serverTimestamp(),
        })
        moveToDone(file)
        delete state[name]
      }
      uploaded.push({ name, ...meta, pages: totalPages })
    } catch (err) {
      console.error(`   ✖ 실패: ${err.message}`)
      state[name] = { tries: (s.tries ?? 0) + 1, error: err.message }
      if (state[name].tries >= MAX_TRIES && !dryRun) await report(`⚠️ 자료 담당: '${name}' 을(를) ${MAX_TRIES}번 시도했지만 올리지 못했어요.\n${err.message}`)
    }
  }
  if (!dryRun) writeState('materials', state)

  if (uploaded.length) {
    const lines = uploaded.map(
      (m) => `• [${LABEL[m.level]} · ${LABEL[m.type]}${m.grade ? ` · ${m.grade}급` : ''}${m.episode ? ` · EP.${m.episode}` : ''}] ${m.titleKo}\n  ${m.titleEn} (${m.pages}쪽)`,
    )
    const text = `📂 자료 담당 — 무료 자료 ${uploaded.length}개 ${dryRun ? '분류 테스트 (업로드 안 함)' : '공개했어요'}\n\n${lines.join('\n')}${dryRun ? '' : '\n\n분류가 틀렸으면 알려 주세요.'}`
    if (dryRun) console.log(text)
    else await report(text)
  }
}

main().catch(async (err) => {
  console.error(err)
  if (!dryRun) await report(`⚠️ 자료 담당 오류: ${err.message}`).catch(() => {})
  process.exit(1)
})
