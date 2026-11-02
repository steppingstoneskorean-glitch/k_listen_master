// scripts/staff/_shared.mjs
// AI 직원 공통 도구 — 환경변수, Firebase Admin, 텔레그램 보고, 작업 기록(state).
//   · 로컬: .env.local + serviceAccountKey.json 을 읽는다.
//   · GitHub Actions: 프로세스 환경변수 + FIREBASE_SERVICE_ACCOUNT(JSON 문자열)를 읽는다.
//   · 토큰/키는 절대 출력하지 않는다.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { initializeApp, cert, getApps } from 'firebase-admin/app'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const APP_URL = 'https://k-listen-master.vercel.app'

// .env.local 값을 process.env 에 채운다 (이미 있는 값은 덮어쓰지 않음 — Actions 우선)
export function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return process.env
}

export function initAdmin() {
  if (getApps().length) return getApps()[0]
  const env = loadEnv()
  const keyFile = path.join(ROOT, 'serviceAccountKey.json')
  const key = env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
    : fs.existsSync(keyFile)
      ? JSON.parse(fs.readFileSync(keyFile, 'utf8'))
      : null
  if (!key) throw new Error('Firebase 서비스 계정이 없습니다 (serviceAccountKey.json 또는 FIREBASE_SERVICE_ACCOUNT)')
  return initializeApp({
    credential: cert(key),
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${key.project_id}.firebasestorage.app`,
  })
}

/** 서비스 계정 원본 (GA Data API 인증용) */
export function serviceAccount() {
  const env = loadEnv()
  if (env.FIREBASE_SERVICE_ACCOUNT) return JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'serviceAccountKey.json'), 'utf8'))
}

/** 오너에게 텔레그램 텍스트 보고. 토큰이 없으면 콘솔에만 남긴다(직원 일 자체는 계속). */
export async function report(text) {
  const env = loadEnv()
  const token = env.TELEGRAM_BOT_TOKEN?.replace(/\s/g, '')
  const chatId = env.TELEGRAM_CHAT_ID
  console.log(`\n── 보고 ──\n${text}\n──────────`)
  if (!token || !chatId) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN/CHAT_ID 없음 — 텔레그램 전송 생략')
    return
  }
  // 텔레그램 메시지 한도 4096자
  for (let i = 0; i < text.length; i += 4000) {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: text.slice(i, i + 4000), disable_web_page_preview: true }),
    })
    const json = await res.json().catch(() => ({}))
    if (!json.ok) throw new Error(`telegram sendMessage → ${res.status} ${json.description ?? ''}`.split(token).join('<token>'))
  }
}

// 직원별 작업 기록 — 같은 일을 두 번 하지 않고, 실패는 재시도 횟수를 센다. (로컬 전용, gitignore)
const STATE_DIR = path.join(ROOT, 'scripts', 'staff', '.state')

export function readState(name) {
  const file = path.join(STATE_DIR, `${name}.json`)
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
}

export function writeState(name, data) {
  fs.mkdirSync(STATE_DIR, { recursive: true })
  fs.writeFileSync(path.join(STATE_DIR, `${name}.json`), JSON.stringify(data, null, 2))
}

/** NVIDIA LLM 단발 호출 → JSON 객체 (분류·요약용 소형 작업) */
export async function askJson(system, user, { maxTokens = 2000 } = {}) {
  const apiKey = (loadEnv().NVIDIA_API_KEY || '').trim()
  if (!apiKey) throw new Error('NVIDIA_API_KEY 가 없습니다')
  const { NVIDIA_MODEL } = await import('../../api/_lib/quizGen.mjs')
  const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
      chat_template_kwargs: { thinking: false },
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error(`NVIDIA HTTP ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  const close = raw.lastIndexOf('</think>')
  const m = (close === -1 ? raw : raw.slice(close + 8)).match(/\{[\s\S]*\}/)
  if (!m) throw new Error('LLM 응답에서 JSON 을 찾지 못함')
  return JSON.parse(m[0])
}
