#!/usr/bin/env node
// scripts/staff/quiz-writer.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 직원 ① 퀴즈 담당 — 내 유튜브 채널의 새 영상 → 퀴즈 스튜디오 초안
//   1) 채널 RSS(키 불필요)에서 최근 영상을 확인
//   2) scripts/ingest.mjs --subs-only 로 타임스탬프 자막 확보 (다운로드 없음)
//   3) api/_lib/quizGen.mjs(스튜디오 "AI 초안 생성"과 같은 코어)로 B/I/A 초안 생성
//   4) kartistQuizzes/{videoId}.draft 에만 저장 — ⭐ 배포(published)는 절대 하지 않는다.
//      오너가 스튜디오에서 검수 후 직접 배포한다. 이미 초안이 있는 영상은 건드리지 않는다.
//   5) 텔레그램으로 검수 링크 보고
//
//   실행: node scripts/staff/quiz-writer.mjs [--dry-run] [--since-days 30] [--max 3] [VIDEOID...]
//         --redo VIDEOID...  손대지 않은 미배포 AI 초안을 지금 규칙으로 다시 만든다
//   자막은 업로드 직후엔 아직 없을 수 있다 → 다음 실행에서 재시도 (최대 MAX_TRIES 회).
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { ROOT, APP_URL, loadEnv, initAdmin, report, readState, writeState } from './_shared.mjs'

const CHANNEL_ID = loadEnv().YT_CHANNEL_ID || 'UC5892rdOXctPFBwE3LLlqMg' // @steppingstones.Korean
const MAX_TRIES = 6

// 제목의 레벨 표기 → 레벨별 문항 수.
// ⭐ 오너 방침(2026-11-02): 그 급수의 영상은 그 급수 모드 문제만 만든다 (초급→B, 중급→I, 고급→A).
//    레벨 표기가 없는 영상만 세 모드를 섞는다.
const COUNTS_BY_LEVEL = {
  beginner: { B: 8, I: 0, A: 0 },
  // I 는 2026-11 부터 쉬운 빈칸 받아쓰기
  intermediate: { B: 0, I: 8, A: 0 },
  advanced: { B: 0, I: 0, A: 10 },
  unknown: { B: 4, I: 4, A: 5 },
}

const argv = process.argv.slice(2)
const flag = (name) => argv.includes(name)
const flagValue = (name, fallback) => {
  const i = argv.indexOf(name)
  return i === -1 ? fallback : argv[i + 1]
}
const dryRun = flag('--dry-run')
const redo = flag('--redo')

// 퀴즈 담당이 저장한 뒤 스튜디오에서 저장·배포된 적 없는 초안 — 같은 쓰기의 serverTimestamp 라 두 시각이 같다
function isUntouchedAiDraft(d) {
  return (
    d.aiDraft?.by === 'quiz-writer' &&
    !(d.published ?? []).length &&
    d.updatedAt?.isEqual?.(d.aiDraft.generatedAt) === true
  )
}
const sinceDays = Number(flagValue('--since-days', 30))
const maxPerRun = Number(flagValue('--max', 3))
// 값을 받는 옵션(--since-days N, --max N) 뒤의 값만 제외 — --redo 같은 스위치 뒤 ID 는 그대로 ID
const explicitIds = argv.filter((a, i) => /^[\w-]{11}$/.test(a) && !['--since-days', '--max'].includes(argv[i - 1]))

function levelOf(title) {
  if (/beginner|초급/i.test(title)) return 'beginner'
  if (/intermediate|중급/i.test(title)) return 'intermediate'
  if (/advanced|고급/i.test(title)) return 'advanced'
  return 'unknown'
}

// YouTube RSS 는 간헐적으로 404/5xx 를 낸다 — 몇 번 재시도하고, 그래도 안 되면 null(이번 실행은 건너뜀)
async function fetchChannelVideos() {
  let xml = null
  for (let i = 0; i < 3 && xml === null; i++) {
    if (i) await new Promise((r) => setTimeout(r, 3000 * i))
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`).catch(() => null)
    if (res?.ok) xml = await res.text()
  }
  if (xml === null) return fetchChannelVideosYtDlp()
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    videoId: e.match(/<yt:videoId>([^<]+)/)?.[1],
    title: decodeXml(e.match(/<title>([^<]*)/)?.[1] ?? ''),
    published: e.match(/<published>([^<]+)/)?.[1],
    isShort: /\/shorts\//.test(e),
  }))
}

// RSS 예비 경로 — yt-dlp 로 '동영상' 탭 최신 5개 (업로드 날짜 포함, ~10초). 실패하면 null.
function fetchChannelVideosYtDlp() {
  const r = spawnSync(
    'yt-dlp',
    ['--skip-download', '--no-warnings', '--playlist-end', '5', '--print', '%(id)s\t%(upload_date)s\t%(title)s',
      `https://www.youtube.com/channel/${CHANNEL_ID}/videos`],
    { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 120_000 },
  )
  if (r.status !== 0) return null
  const videos = r.stdout
    .split(/\r?\n/)
    .map((l) => l.split('\t'))
    .filter(([id, date]) => /^[\w-]{11}$/.test(id) && /^\d{8}$/.test(date))
    .map(([videoId, d, ...title]) => ({
      videoId,
      title: title.join('\t'),
      published: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`,
      isShort: false, // '동영상' 탭에는 쇼츠가 없다
    }))
  return videos.length ? videos : null
}

function decodeXml(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
}

// ingest.mjs 를 그대로 재사용 — 안전모드(--subs-only, 다운로드 없음)
function fetchTranscript(videoId) {
  const out = path.join(ROOT, 'scripts', 'ingest-out')
  const r = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'ingest.mjs'), `https://youtu.be/${videoId}`, '--subs-only', '--out', out], {
    cwd: ROOT,
    encoding: 'utf8',
  })
  const file = path.join(out, `${videoId}.txt`)
  if (r.status !== 0 || !fs.existsSync(file)) return null
  return fs.readFileSync(file, 'utf8')
}

async function main() {
  const state = readState('quiz-writer')
  const db = getFirestore(initAdmin())
  const { generateQuiz } = await import('../../api/_lib/quizGen.mjs')

  let videos = await fetchChannelVideos()
  if (videos === null) {
    // 일시 장애는 조용히 넘기고, 하루(시간당 실행 기준 24회) 연속 실패할 때만 보고
    state._rssFailures = (state._rssFailures ?? 0) + 1
    if (!dryRun) writeState('quiz-writer', state)
    console.warn(`채널 RSS 응답 없음 (연속 ${state._rssFailures}회) — 이번 실행 건너뜀`)
    if (state._rssFailures === 24 && !dryRun) await report('⚠️ 퀴즈 담당: 하루 동안 유튜브 채널 RSS 를 못 읽었어요. 채널 ID 를 확인해 주세요.')
    return
  }
  delete state._rssFailures
  if (explicitIds.length) {
    videos = explicitIds.map((id) => videos.find((v) => v.videoId === id) ?? { videoId: id, title: id, published: new Date().toISOString() })
  } else {
    const cutoff = Date.now() - sinceDays * 86400_000
    videos = videos.filter((v) => !v.isShort && Date.parse(v.published) >= cutoff)
  }

  const done = []
  const waiting = []
  let attempts = 0 // 생성 시도 수 상한 — 실패가 이어져도 한 번에 LLM 을 과하게 부르지 않게
  for (const v of videos) {
    if (attempts >= maxPerRun) break
    const s = state[v.videoId] ?? {}
    // 영상 ID 를 직접 지정하면(재작업) 작업 기록과 상관없이 다시 본다
    if (!explicitIds.length && (s.status === 'done' || s.status === 'skipped' || (s.tries ?? 0) >= MAX_TRIES)) continue

    // 이미 초안/배포본이 있는 영상은 오너 작업물 — 덮어쓰지 않는다
    // (--redo: 퀴즈 담당이 만든 뒤 아무도 손대지 않은 미배포 AI 초안만 새 규칙으로 다시 만든다)
    const snap = await db.collection('kartistQuizzes').doc(v.videoId).get()
    if (snap.exists && ((snap.data().draft ?? []).length || (snap.data().published ?? []).length) && !(redo && isUntouchedAiDraft(snap.data()))) {
      state[v.videoId] = { status: 'skipped', reason: 'existing-draft', title: v.title }
      continue
    }

    console.log(`\n▶ ${v.videoId}  ${v.title}`)
    const transcript = fetchTranscript(v.videoId)
    if (!transcript || transcript.trim().length < 50) {
      state[v.videoId] = { ...s, status: 'waiting', tries: (s.tries ?? 0) + 1, title: v.title }
      waiting.push(v)
      console.log('   자막 아직 없음 — 다음 실행에서 재시도')
      continue
    }

    const level = levelOf(v.title)
    attempts += 1
    try {
      const { quizzes, generated, model } = await generateQuiz({ videoId: v.videoId, transcript, want: COUNTS_BY_LEVEL[level] })
      console.log(`   ✔ 초안 B${generated.B} I${generated.I} A${generated.A}`)
      if (!dryRun) {
        await db.collection('kartistQuizzes').doc(v.videoId).set(
          {
            videoId: v.videoId,
            draft: quizzes,
            updatedAt: FieldValue.serverTimestamp(),
            aiDraft: { by: 'quiz-writer', title: v.title, level, model, generatedAt: FieldValue.serverTimestamp() },
          },
          { merge: true },
        )
        state[v.videoId] = { status: 'done', title: v.title, generated, at: new Date().toISOString() }
      }
      done.push({ ...v, level, generated })
    } catch (err) {
      console.error(`   ✖ 생성 실패: ${err.message}`)
      state[v.videoId] = { ...s, status: 'error', tries: (s.tries ?? 0) + 1, title: v.title, error: err.message }
    }
  }
  if (!dryRun) writeState('quiz-writer', state)

  if (done.length) {
    const lines = done.map(
      (v) =>
        `• ${v.title}\n  B ${v.generated.B} · I ${v.generated.I} · A ${v.generated.A}\n  검수: ${APP_URL}/quiz-studio?v=${v.videoId}`,
    )
    const text =
      `🧩 퀴즈 담당 — 새 영상 초안 ${done.length}개 준비했어요${dryRun ? ' (테스트, 저장 안 함)' : ''}\n\n${lines.join('\n\n')}\n\n초안만 저장했어요. 스튜디오에서 검수하고 배포해 주세요.`
    if (dryRun) console.log(text)
    else await report(text)
  } else {
    console.log(`새로 만든 초안 없음${waiting.length ? ` (자막 대기 ${waiting.length}개)` : ''}`)
  }
}

main().catch(async (err) => {
  console.error(err)
  if (!dryRun) await report(`⚠️ 퀴즈 담당 오류: ${err.message}`).catch(() => {})
  process.exit(1)
})
