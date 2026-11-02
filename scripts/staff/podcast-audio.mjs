#!/usr/bin/env node
// scripts/staff/podcast-audio.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 직원 ① 퀴즈 담당의 음원 업무 — 팟캐스트 영상 파일 → 라디오 음원
//   팟캐스트 영상은 화면에 자막이 박혀 있어 퀴즈에서 영상을 보여주면 답이 보인다.
//   YouTube 플레이어를 가리는 건 YouTube API 정책 위반이라, 내 음원을 직접 올려 라디오처럼 재생한다.
//
//   1) assets/팟캐스트영상/ 에 넣은 영상(또는 음성) 파일을 찾는다 (gitignore — 커밋 금지)
//   2) 내 채널 최신 영상과 '길이'로 짝을 찾는다 (±1.5초). 퀴즈 구간(startTime/endTime)은
//      YouTube 영상 기준이라, 길이가 다른 컷(수정 전 버전 등)은 타이밍이 어긋나므로 받지 않는다.
//      파일명에 [영상ID] 를 넣으면 그 영상으로 지정 (길이 검사는 그대로 한다).
//   3) ffmpeg 로 음성만 추출 (AAC 모노 96kbps .m4a) → Storage podcast-audio/<id>.m4a
//      → kartistQuizzes/{id}.audioUrl 저장 → 앱이 그 영상 퀴즈를 라디오 모드로 재생
//   4) 처리한 파일은 assets/팟캐스트영상/_처리완료/ 로 옮기고 텔레그램 보고
//   아직 YouTube 에 안 올린 영상이면 짝이 생길 때까지 기다린다.
//
//   실행: node scripts/staff/podcast-audio.mjs [--dry-run]
//   필요: pip install imageio-ffmpeg  (ffmpeg 실행 파일 포함)
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { ROOT, loadEnv, initAdmin, report, readState, writeState } from './_shared.mjs'

const INBOX = path.join(ROOT, 'assets', '팟캐스트영상')
const DONE_DIR = path.join(INBOX, '_처리완료')
const CHANNEL_ID = loadEnv().YT_CHANNEL_ID || 'UC5892rdOXctPFBwE3LLlqMg' // @steppingstones.Korean
const MEDIA_EXT = /\.(mp4|mov|mkv|webm|m4v|m4a|mp3|wav|aac)$/i
const DURATION_TOLERANCE = 1.5 // 초
const dryRun = process.argv.includes('--dry-run')

function ffmpegPath() {
  const r = spawnSync('python', ['-I', '-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8' })
  const exe = r.stdout?.trim()
  if (r.status !== 0 || !exe) throw new Error('ffmpeg 를 찾을 수 없습니다 — pip install imageio-ffmpeg')
  return exe
}

// ffmpeg -i 의 "Duration: 00:06:43.12" 를 초로
function mediaDuration(ffmpeg, file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file], { encoding: 'utf8' })
  const m = (r.stderr || '').match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/)
  if (!m) throw new Error('파일 길이를 읽지 못했습니다 (영상/음성 파일이 맞는지 확인)')
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])
}

// 채널 '동영상' 탭 최신 15개의 길이 (yt-dlp, ~30초)
function channelVideos() {
  const r = spawnSync(
    'yt-dlp',
    ['--skip-download', '--no-warnings', '--playlist-end', '15', '--print', '%(id)s\t%(duration)s\t%(title)s',
      `https://www.youtube.com/channel/${CHANNEL_ID}/videos`],
    { encoding: 'utf8', env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, timeout: 180_000 },
  )
  if (r.status !== 0) throw new Error('채널 영상 목록을 읽지 못했습니다 (yt-dlp)')
  return r.stdout
    .split(/\r?\n/)
    .map((l) => l.split('\t'))
    .filter(([id, d]) => /^[\w-]{11}$/.test(id) && Number(d) > 0)
    .map(([videoId, d, ...title]) => ({ videoId, duration: Number(d), title: title.join('\t') }))
}

function extractAudio(ffmpeg, file, out) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', file, '-vn', '-ac', '1', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out], {
    encoding: 'utf8',
    timeout: 10 * 60_000,
  })
  if (r.status !== 0 || !fs.existsSync(out)) throw new Error(`음성 추출 실패: ${(r.stderr || '').trim().slice(-300)}`)
}

function moveToDone(file) {
  fs.mkdirSync(DONE_DIR, { recursive: true })
  let dest = path.join(DONE_DIR, path.basename(file))
  if (fs.existsSync(dest)) dest = dest.replace(/(\.[^.]+)$/, `_${Date.now()}$1`)
  fs.renameSync(file, dest)
}

async function main() {
  if (!fs.existsSync(INBOX)) fs.mkdirSync(INBOX, { recursive: true })
  const files = fs
    .readdirSync(INBOX, { withFileTypes: true })
    .filter((d) => d.isFile() && MEDIA_EXT.test(d.name))
    .map((d) => path.join(INBOX, d.name))
  if (!files.length) {
    console.log('새 영상 파일 없음')
    return
  }

  const state = readState('podcast-audio')
  const app = initAdmin()
  const db = getFirestore(app)
  const bucket = getStorage(app).bucket()
  if (!dryRun && !(await bucket.exists())[0]) {
    if (!state._bucketWarned) {
      await report('⚠️ 퀴즈 담당: Firebase Storage 가 아직 꺼져 있어 팟캐스트 음원을 올릴 수 없어요.\nFirebase 콘솔 → Storage → 시작하기 를 눌러 주세요. 켜지면 대기 중인 음원을 바로 올릴게요.')
      writeState('podcast-audio', { ...state, _bucketWarned: true })
    }
    console.warn(`Storage 버킷 없음 — ${files.length}개 대기`)
    return
  }
  delete state._bucketWarned

  const ffmpeg = ffmpegPath()
  const videos = channelVideos()
  const done = []
  const unmatched = []

  for (const file of files) {
    const name = path.basename(file)
    console.log(`\n▶ ${name}`)
    try {
      const duration = mediaDuration(ffmpeg, file)
      const pinned = name.match(/\[([\w-]{11})\]/)?.[1]
      const candidates = videos.filter(
        (v) => (!pinned || v.videoId === pinned) && Math.abs(v.duration - duration) <= DURATION_TOLERANCE,
      )
      if (candidates.length !== 1) {
        // 0개: 아직 YouTube 에 안 올렸거나 다른 컷 / 2개 이상: 길이가 같은 영상이 여럿 → 파일명에 [영상ID] 필요
        const reason = candidates.length === 0 ? 'no-match' : 'ambiguous'
        console.log(`   짝 없음 (${reason}, 길이 ${duration.toFixed(1)}초) — 대기`)
        if (state[name]?.reason !== reason) unmatched.push({ name, duration, reason, candidates })
        state[name] = { reason, duration }
        continue
      }
      const v = candidates[0]
      console.log(`   → ${v.videoId}  ${v.title}`)

      if (!dryRun) {
        const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'klisten-audio-')), `${v.videoId}.m4a`)
        try {
          extractAudio(ffmpeg, file, tmp)
          const token = crypto.randomUUID()
          const objectPath = `podcast-audio/${v.videoId}.m4a`
          await bucket.upload(tmp, {
            destination: objectPath,
            resumable: false,
            metadata: {
              contentType: 'audio/mp4',
              cacheControl: 'public, max-age=86400',
              metadata: { firebaseStorageDownloadTokens: token },
            },
          })
          const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`
          // 퀴즈 문서에 음원만 병합 — draft/published 는 건드리지 않는다
          await db.collection('kartistQuizzes').doc(v.videoId).set(
            { videoId: v.videoId, audioUrl, audioUploadedAt: FieldValue.serverTimestamp() },
            { merge: true },
          )
        } finally {
          fs.rmSync(path.dirname(tmp), { recursive: true, force: true })
        }
        moveToDone(file)
        delete state[name]
      }
      done.push({ name, ...v })
    } catch (err) {
      console.error(`   ✖ 실패: ${err.message}`)
      state[name] = { reason: 'error', error: err.message }
    }
  }
  if (!dryRun) writeState('podcast-audio', state)

  const lines = []
  if (done.length) {
    lines.push(`🎧 퀴즈 담당 — 라디오 음원 ${done.length}개 ${dryRun ? '짝 찾기 테스트 (업로드 안 함)' : '연결했어요'}`)
    for (const d of done) lines.push(`• ${d.title}\n  ← ${d.name}`)
    if (!dryRun) lines.push('\n이 영상들의 퀴즈는 이제 영상 없이 음성만 재생돼요.')
  }
  if (unmatched.length) {
    if (lines.length) lines.push('')
    lines.push('⏳ 아직 짝을 못 찾은 파일 (YouTube 에 올라오면 자동 연결해요)')
    for (const u of unmatched) {
      lines.push(
        u.reason === 'ambiguous'
          ? `• ${u.name} — 길이가 같은 영상이 여러 개예요. 파일명에 [영상ID] 를 붙여 주세요.`
          : `• ${u.name} (${Math.round(u.duration)}초) — 같은 길이의 YouTube 영상이 없어요. 최종본 파일이 맞는지 확인해 주세요.`,
      )
    }
  }
  if (!lines.length) return
  if (dryRun) console.log(lines.join('\n'))
  else await report(lines.join('\n'))
}

main().catch(async (err) => {
  console.error(err)
  if (!dryRun) await report(`⚠️ 퀴즈 담당(음원) 오류: ${err.message}`).catch(() => {})
  process.exit(1)
})
