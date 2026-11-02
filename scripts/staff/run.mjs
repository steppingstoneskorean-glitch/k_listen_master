#!/usr/bin/env node
// scripts/staff/run.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 직원 출근부 — Windows 작업 스케줄러가 매시간(+로그온 시) 실행한다 (register-task.ps1)
//   ① 퀴즈 담당   quiz-writer.mjs   — 새 유튜브 영상 → 퀴즈 스튜디오 초안
//   ② 자료 담당   materials.mjs     — assets/무료자료PDF → 앱 무료 자료
//   ③ 분석 담당   weekly-report.mjs — 월요일 09:00 KST 이후 그 주 첫 실행에 1회
//
//   전부 PC 에서 돈다: PDF 가 PC 에 있고, 저장소가 공개라 Actions 로그에 지표가 노출되면 안 된다.
//   PC 가 꺼져 있던 시간의 일은 다음에 켜졌을 때 따라잡는다.
//   한 직원이 실패해도 다음 직원은 계속 일한다. 로그: scripts/staff/.state/run.log
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { ROOT, readState, writeState } from './_shared.mjs'

const STAFF = path.join(ROOT, 'scripts', 'staff')
const LOG = path.join(STAFF, '.state', 'run.log')
fs.mkdirSync(path.dirname(LOG), { recursive: true })

// 로그가 무한히 커지지 않게 1MB 넘으면 뒤쪽 절반만 남긴다
if (fs.existsSync(LOG) && fs.statSync(LOG).size > 1_000_000) {
  const s = fs.readFileSync(LOG, 'utf8')
  fs.writeFileSync(LOG, s.slice(s.length / 2))
}
const log = (s) => fs.appendFileSync(LOG, s.endsWith('\n') ? s : `${s}\n`)

function work(script) {
  const started = new Date().toISOString()
  const r = spawnSync(process.execPath, [path.join(STAFF, script)], { cwd: ROOT, encoding: 'utf8', timeout: 20 * 60_000 })
  log(`\n[${started}] ${script} → exit ${r.status ?? r.signal}\n${(r.stdout ?? '').trim()}\n${(r.stderr ?? '').trim()}`)
  return r.status === 0
}

// 이번 보고 주의 월요일 날짜 — 이 값이 바뀌면 보고할 때가 된 것.
// KST 월요일 09:00 = UTC 월요일 00:00 이라 UTC 날짜 경계를 그대로 쓰면 된다.
function reportWeek() {
  const now = new Date()
  const day = (now.getUTCDay() + 6) % 7 // 월=0
  return new Date(now.getTime() - day * 86400_000).toISOString().slice(0, 10)
}

work('quiz-writer.mjs')
work('materials.mjs')

const state = readState('run')
const week = reportWeek()
if (state.lastWeeklyReport !== week && work('weekly-report.mjs')) {
  writeState('run', { ...state, lastWeeklyReport: week })
}
