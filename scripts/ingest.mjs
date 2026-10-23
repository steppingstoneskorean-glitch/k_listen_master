#!/usr/bin/env node
// scripts/ingest.mjs
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — 영상 → 타임스탬프 한국어 자막 인제스트 (콘텐츠 파이프라인 앞단)
//   유튜브 URL → "[초.s] 텍스트" 형식의 STT 자막 파일 →
//   그대로 QuizStudioPage 의 자막 칸에 붙여넣어 /api/generate-quiz 로 초안 생성.
//
//   전략: 사람의 일을 "자막을 찾아 손으로 정리" → "URL 을 큐에 넣기" 로 바꾼다.
//   하루치 URL 을 큐에 넣고 돌리면 검수만 하면 되는 자막 파일이 쌓인다.
//
//   [자막 획득 2단계]
//     1) yt-dlp 로 유튜브 자막(수동 우선, 없으면 자동생성) 을 json3 로 받아 정리
//     2) 자막이 아예 없으면 → 오디오만 받아 WhisperX 로 단어 단위 타임스탬프 생성
//
//   ⭐ 기본이 "안전모드": ②(오디오 다운로드)는 --allow-download 를 명시할 때만 켜진다.
//      기본 실행은 자막만 받으므로(다운로드 없음), 제3자 영상을 실수로 내려받지 않는다.
//      오디오 다운로드는 "내 소유·허락된 콘텐츠"에만 사용하세요.
//
//   [사용하는 도구 — 전부 무료 · 상업적 사용 허용 라이선스]
//     · yt-dlp   : Unlicense(퍼블릭 도메인)      https://github.com/yt-dlp/yt-dlp
//     · WhisperX : BSD-2-Clause                  https://github.com/m-bain/whisperX
//         └ 한국어 정렬 모델 kresnik/wav2vec2-large-xlsr-korean : Apache-2.0
//     · ffmpeg   : LGPL 빌드 (yt-dlp/whisperx 가 내부적으로 사용)
//     ⚠️ 도구 라이선스는 상업적 사용이 자유롭습니다. 다만 특정 영상을 내려받아
//        이용하는 것이 그 영상의 저작권/서비스 약관에 맞는지는 운영자 책임입니다.
//        (임베드는 소유가 아님 — 자체/제휴 콘텐츠 비중을 늘리는 소싱 전략을 병행하세요.)
//
//   [설치] (Windows, 한 번만)
//     pip install -U yt-dlp whisperx
//     winget install Gyan.FFmpeg        # 또는 ffmpeg 를 PATH 에 추가
//
//   [실행]
//     node scripts/ingest.mjs "https://youtu.be/VIDEOID"     # URL 직접 지정(여러 개 가능)
//     node scripts/ingest.mjs                                 # scripts/ingest-queue.txt 읽기
//     npm run ingest -- "https://youtu.be/VIDEOID"
//
//   [옵션]
//     --allow-download     오디오 다운로드(WhisperX 폴백) 허용 — 내 소유/허락 콘텐츠 전용
//     --whisper            자막을 무시하고 무조건 WhisperX 로 생성 (--allow-download 필요)
//     --subs-only          WhisperX 폴백 없이 자막만 사용 (자막 없으면 건너뜀)
//     --lang <코드>        자막/인식 언어 (기본 ko)
//     --model <이름>       WhisperX 모델 (기본 large-v3, 빠르게: medium / small)
//     --device <cpu|cuda>  WhisperX 연산 장치 (기본 cpu. GPU 있으면 cuda)
//     --compute-type <t>   int8(기본, CPU) | float16(GPU) | float32
//     --out <폴더>         출력 폴더 (기본 scripts/ingest-out)
//     --keep-audio         WhisperX 용으로 받은 오디오를 지우지 않고 보존
//     -h, --help           도움말
//
//   출력: <out>/<videoId>.txt  (그대로 스튜디오 자막 칸에 붙여넣기)
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SCRIPTS = path.join(ROOT, 'scripts')

// ── CLI 파싱 ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2)
if (argv.includes('-h') || argv.includes('--help')) {
  printHelp()
  process.exit(0)
}

function takeFlagValue(name, fallback) {
  const i = argv.indexOf(name)
  if (i === -1 || i + 1 >= argv.length) return fallback
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}

const opts = {
  forceWhisper: pullBool('--whisper'),
  subsOnly: pullBool('--subs-only'),
  allowDownload: pullBool('--allow-download'),
  keepAudio: pullBool('--keep-audio'),
  lang: takeFlagValue('--lang', 'ko'),
  model: takeFlagValue('--model', 'large-v3'),
  device: takeFlagValue('--device', 'cpu'),
  computeType: takeFlagValue('--compute-type', 'int8'),
  outDir: path.resolve(ROOT, takeFlagValue('--out', path.join('scripts', 'ingest-out'))),
}

function pullBool(name) {
  const i = argv.indexOf(name)
  if (i === -1) return false
  argv.splice(i, 1)
  return true
}

// 남은 인자 = URL 들. 없으면 큐 파일에서 읽는다.
let urls = argv.filter((a) => !a.startsWith('--'))
if (urls.length === 0) urls = readQueue()

if (urls.length === 0) {
  console.error('❌ 처리할 URL 이 없습니다.')
  console.error('   · 인자로 주거나:  node scripts/ingest.mjs "https://youtu.be/VIDEOID"')
  console.error(`   · 또는 큐 파일에 한 줄씩:  ${path.relative(ROOT, queuePath())}`)
  process.exit(1)
}

// ── 도구 사전 점검 ───────────────────────────────────────────────────────────
if (!hasCli('yt-dlp')) {
  console.error('❌ yt-dlp 를 찾을 수 없습니다.  설치:  pip install -U yt-dlp')
  process.exit(1)
}
const whisperAvailable = hasCli('whisperx')
// 안전모드: 오디오 다운로드(WhisperX 폴백)는 --allow-download 를 명시할 때만 허용한다.
// --whisper(자막 무시하고 강제 인식)는 다운로드가 필수이므로 --allow-download 를 요구한다.
if (opts.forceWhisper && !opts.allowDownload) {
  console.error('❌ --whisper 는 오디오 다운로드가 필요합니다. 내 소유/허락된 콘텐츠에 한해 --allow-download 를 함께 지정하세요.')
  process.exit(1)
}
if (opts.forceWhisper && !whisperAvailable) {
  console.error('❌ --whisper 를 지정했지만 whisperx 가 없습니다.  설치:  pip install -U whisperx')
  process.exit(1)
}

fs.mkdirSync(opts.outDir, { recursive: true })

// ── 메인 루프 ────────────────────────────────────────────────────────────────
const summary = []
for (const url of urls) {
  const videoId = extractVideoId(url)
  if (!videoId) {
    console.error(`⚠️  videoId 추출 실패 — 건너뜀: ${url}`)
    summary.push({ url, ok: false, reason: 'bad-url' })
    continue
  }
  console.log(`\n▶  ${videoId}  (${url})`)
  try {
    const result = processOne(url, videoId)
    summary.push({ url, videoId, ok: true, ...result })
  } catch (err) {
    console.error(`   ✖ 실패: ${err.message}`)
    summary.push({ url, videoId, ok: false, reason: err.message })
  }
}

// ── 요약 ─────────────────────────────────────────────────────────────────────
console.log('\n────────────────────────────────────────')
for (const s of summary) {
  if (s.ok) console.log(`✅ ${s.videoId}  [${s.source}]  ${s.lines}줄  →  ${path.relative(ROOT, s.file)}`)
  else console.log(`❌ ${s.videoId || s.url}  (${s.reason})`)
}
const okCount = summary.filter((s) => s.ok).length
console.log(`\n완료: ${okCount}/${summary.length}`)
if (okCount > 0) {
  console.log('다음 단계 → QuizStudioPage(운영자) 자막 칸에 .txt 내용을 붙여넣고 "AI 초안 생성".')
}

// ═════════════════════════════════════════════════════════════════════════════
// 파이프라인
// ═════════════════════════════════════════════════════════════════════════════

function processOne(url, videoId) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `klisten-ingest-${videoId}-`))
  try {
    let cues = null
    let source = null

    // 1) 자막 시도 (강제 whisper 가 아니라면)
    if (!opts.forceWhisper) {
      const subFile = fetchSubtitles(url, videoId, work)
      if (subFile) {
        cues = subFile.endsWith('.json3') ? parseJson3(subFile) : parseVtt(subFile)
        if (cues && cues.length) source = 'subs'
        else console.log('   · 자막을 받았지만 유효한 줄이 없습니다.')
      } else {
        console.log(`   · ${opts.lang} 자막 없음.`)
      }
    }

    // 2) WhisperX 폴백 — 안전모드: --allow-download 없이는 다운로드하지 않는다.
    if (!cues || cues.length === 0) {
      if (opts.subsOnly) throw new Error('자막 없음 (--subs-only 이므로 건너뜀)')
      if (!opts.allowDownload) {
        throw new Error(
          '자막 없음 — 오디오 다운로드가 필요합니다(기본 안전모드에선 차단). ' +
          '내 소유/허락된 콘텐츠라면 --allow-download 를 붙여 WhisperX 폴백을 켜세요.',
        )
      }
      if (!whisperAvailable) {
        throw new Error('자막 없음 + whisperx 미설치.  설치:  pip install -U whisperx')
      }
      const audio = downloadAudio(url, videoId, work)
      const jsonPath = runWhisperX(audio, work, videoId)
      cues = parseWhisperJson(jsonPath)
      source = 'whisperx'
      if (opts.keepAudio) {
        const kept = path.join(opts.outDir, path.basename(audio))
        fs.copyFileSync(audio, kept)
        console.log(`   · 오디오 보존: ${path.relative(ROOT, kept)}`)
      }
    }

    const cleaned = cleanCues(cues)
    if (cleaned.length === 0) throw new Error('정리 후 남은 자막 줄이 없습니다.')

    const transcript = cleaned.map((c) => `[${c.start.toFixed(1)}] ${c.text}`).join('\n')
    const outFile = path.join(opts.outDir, `${videoId}.txt`)
    fs.writeFileSync(outFile, transcript + '\n', 'utf8')
    console.log(`   ✔ ${cleaned.length}줄 → ${path.relative(ROOT, outFile)}  (source: ${source})`)
    return { file: outFile, lines: cleaned.length, source }
  } finally {
    // 임시 작업 폴더 정리
    try { fs.rmSync(work, { recursive: true, force: true }) } catch { /* noop */ }
  }
}

// ── yt-dlp: 자막(수동 우선, 없으면 자동생성) 을 json3 로 받기 ──────────────────
function fetchSubtitles(url, videoId, work) {
  const outTmpl = path.join(work, '%(id)s.%(ext)s')
  // --write-subs(사람 자막) + --write-auto-subs(자동생성) → yt-dlp 가 있는 쪽을 저장.
  // json3: 유튜브가 주는 세그먼트 포맷(중복 롤링 없음) → 파싱이 깨끗함.
  run('yt-dlp', [
    '--skip-download',
    '--write-subs', '--write-auto-subs',
    '--sub-langs', opts.lang,
    '--sub-format', 'json3/vtt',
    '--no-warnings',
    '-o', outTmpl,
    url,
  ], { allowFail: true })

  // work 폴더에서 <videoId>.<lang>.(json3|vtt) 를 찾는다.
  const files = fs.readdirSync(work).filter((f) => f.startsWith(videoId + '.'))
  const json3 = files.find((f) => f.endsWith('.json3'))
  if (json3) return path.join(work, json3)
  const vtt = files.find((f) => f.endsWith('.vtt'))
  if (vtt) return path.join(work, vtt)
  return null
}

// ── yt-dlp: 오디오만 받기 (WhisperX 입력용) ──────────────────────────────────
function downloadAudio(url, videoId, work) {
  const outTmpl = path.join(work, `${videoId}.%(ext)s`)
  console.log('   · 오디오 다운로드 중…')
  const r = run('yt-dlp', [
    '-f', 'bestaudio/best',
    '--no-playlist',
    '--no-warnings',
    '-o', outTmpl,
    url,
  ], { allowFail: true, inherit: true })
  if (r.status !== 0) throw new Error('오디오 다운로드 실패 (yt-dlp)')
  const audio = fs.readdirSync(work)
    .filter((f) => f.startsWith(videoId + '.') && !f.endsWith('.json3') && !f.endsWith('.vtt'))
    .map((f) => path.join(work, f))[0]
  if (!audio) throw new Error('다운로드된 오디오 파일을 찾지 못했습니다.')
  return audio
}

// ── WhisperX: 오디오 → 단어 단위 타임스탬프 (json 출력) ───────────────────────
function runWhisperX(audio, work, videoId) {
  console.log(`   · WhisperX 인식 중… (model=${opts.model}, device=${opts.device}, ${opts.computeType})`)
  const r = run('whisperx', [
    audio,
    '--language', opts.lang,
    '--model', opts.model,
    '--device', opts.device,
    '--compute_type', opts.computeType,
    '--output_format', 'json',
    '--output_dir', work,
    '--print_progress', 'True',
  ], { inherit: true, allowFail: true })
  if (r.status !== 0) {
    throw new Error('WhisperX 실행 실패 — GPU 없으면 `--device cpu --compute-type int8`(기본) 확인, ' +
      '메모리 부족 시 `--model medium` 로 재시도.')
  }
  // whisperx 는 입력 파일 basename 으로 <videoId>.json 을 남긴다.
  const base = path.basename(audio, path.extname(audio))
  const jsonPath = path.join(work, `${base}.json`)
  if (!fs.existsSync(jsonPath)) {
    // 혹시 다른 이름이면 work 에서 .json 하나를 찾는다.
    const any = fs.readdirSync(work).find((f) => f.endsWith('.json'))
    if (any) return path.join(work, any)
    throw new Error('WhisperX 출력 json 을 찾지 못했습니다.')
  }
  return jsonPath
}

// ═════════════════════════════════════════════════════════════════════════════
// 파서 & 정리
// ═════════════════════════════════════════════════════════════════════════════

// yt-dlp json3: { events: [{ tStartMs, segs: [{ utf8 }] }] }
function parseJson3(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const events = Array.isArray(data.events) ? data.events : []
  const cues = []
  for (const ev of events) {
    if (!ev || !Array.isArray(ev.segs)) continue
    const text = ev.segs.map((s) => (s && typeof s.utf8 === 'string' ? s.utf8 : '')).join('')
    const start = Number(ev.tStartMs) / 1000
    if (Number.isFinite(start)) cues.push({ start, text })
  }
  return cues
}

// WhisperX json: { segments: [{ start, end, text }] }
function parseWhisperJson(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  const segs = Array.isArray(data.segments) ? data.segments : []
  return segs
    .filter((s) => s && Number.isFinite(Number(s.start)) && typeof s.text === 'string')
    .map((s) => ({ start: Number(s.start), text: s.text }))
}

// 폴백용 VTT 파서 (+ 유튜브 자동자막 롤링 중복 완화)
function parseVtt(file) {
  const raw = fs.readFileSync(file, 'utf8').replace(/\r/g, '')
  const blocks = raw.split('\n\n')
  const cues = []
  for (const block of blocks) {
    const lines = block.split('\n')
    const timing = lines.find((l) => l.includes('-->'))
    if (!timing) continue
    const m = timing.match(/(\d{1,2}:)?\d{1,2}:\d{2}[.,]\d{1,3}/)
    if (!m) continue
    const start = vttTimeToSec(m[0])
    const text = lines.slice(lines.indexOf(timing) + 1).join(' ')
    if (Number.isFinite(start)) cues.push({ start, text })
  }
  return cues
}

function vttTimeToSec(t) {
  const parts = t.replace(',', '.').split(':').map(Number)
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return NaN
}

// 태그/노이즈 제거 + 시간순 정렬 + 연속 중복 줄 제거
function cleanCues(cues) {
  const out = []
  let prev = ''
  for (const c of [...cues].sort((a, b) => a.start - b.start)) {
    const text = cleanText(c.text)
    if (!text) continue
    if (text === prev) continue          // 연속 완전 중복
    if (prev && prev.endsWith(text)) continue // 롤링 자막의 꼬리 조각
    out.push({ start: Math.max(0, c.start), text })
    prev = text
  }
  return out
}

function cleanText(s) {
  let t = String(s)
    .replace(/<[^>]*>/g, '')           // <c>, <00:00:00.000> 등 인라인 태그
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  // [음악] [박수] (Music) 같은 비발화 표시만 있는 줄은 버린다.
  if (/^[[(][^\])]*[\])]$/.test(t)) return ''
  return t
}

// ═════════════════════════════════════════════════════════════════════════════
// 유틸
// ═════════════════════════════════════════════════════════════════════════════

// QuizStudioPage 와 동일한 규칙으로 11자 videoId 추출
function extractVideoId(url) {
  const s = String(url).trim()
  if (/^[\w-]{11}$/.test(s)) return s // 이미 순수 videoId
  const patterns = [
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:v=)([\w-]{11})/,
    /(?:embed\/)([\w-]{11})/,
    /(?:shorts\/)([\w-]{11})/,
    /(?:live\/)([\w-]{11})/,
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) return m[1]
  }
  return ''
}

function run(cmd, args, { allowFail = false, inherit = false } = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    stdio: inherit ? 'inherit' : 'pipe',
    windowsHide: true,
  })
  if (r.error && r.error.code === 'ENOENT') {
    throw new Error(`${cmd} 를 찾을 수 없습니다 (PATH 확인).`)
  }
  if (!allowFail && r.status !== 0) {
    const detail = (r.stderr || '').toString().trim().split('\n').slice(-3).join(' ')
    throw new Error(`${cmd} 실패(code ${r.status}): ${detail}`)
  }
  return r
}

function hasCli(cmd) {
  const r = spawnSync(cmd, ['--version'], { encoding: 'utf8', stdio: 'pipe', windowsHide: true })
  return !r.error && r.status === 0
}

function queuePath() {
  return path.join(SCRIPTS, 'ingest-queue.txt')
}

function readQueue() {
  const p = queuePath()
  if (!fs.existsSync(p)) return []
  return fs.readFileSync(p, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
}

function printHelp() {
  const p = path.relative(process.cwd(), fileURLToPath(import.meta.url))
  console.log(`
K-Listen 영상 자막 인제스트 — 유튜브 URL → 타임스탬프 한국어 자막(.txt)

사용:
  node ${p} "https://youtu.be/VIDEOID"        URL 직접 지정 (여러 개 가능)
  node ${p}                                     scripts/ingest-queue.txt 읽기
  npm run ingest -- "https://youtu.be/VIDEOID"

기본이 안전모드입니다: 오디오 다운로드는 --allow-download 를 줄 때만 켜집니다.

옵션:
  --allow-download     오디오 다운로드(WhisperX 폴백) 허용 — 내 소유/허락 콘텐츠 전용
  --whisper            자막 무시하고 무조건 WhisperX 로 생성 (--allow-download 필요)
  --subs-only          WhisperX 폴백 없이 자막만 사용
  --lang <코드>        언어 (기본 ko)
  --model <이름>       WhisperX 모델 (기본 large-v3 / 빠르게: medium, small)
  --device <cpu|cuda>  연산 장치 (기본 cpu)
  --compute-type <t>   int8(기본) | float16(GPU) | float32
  --out <폴더>         출력 폴더 (기본 scripts/ingest-out)
  --keep-audio         WhisperX 용 오디오 보존
  -h, --help           도움말

선행 설치(한 번):
  pip install -U yt-dlp whisperx
  winget install Gyan.FFmpeg
`)
}
