#!/usr/bin/env node
// scripts/marketing/utm.mjs
// 마케팅 OS 09_tracking 규칙대로 UTM 링크를 만든다 (marketing/os/09_tracking/tracking_plan.md).
//
//   node scripts/marketing/utm.mjs <소재ID_vN> <ig|fb|tiktok|yt|threads|all> [대상URL] [--campaign 2611_drop1] [--paid]
//   예) node scripts/marketing/utm.mjs C01_v1 ig
//       → https://k-listen-master.vercel.app/games?utm_source=ig&utm_medium=organic&utm_campaign=2611_drop1&utm_content=C01_v1
//
//   대상URL 기본값은 K-Listen 게임 목록(랜딩 1순위). Payhip 은 'payhip' 이라고만 써도 된다.
//   캠페인 기본값은 marketing/os/04_brief 의 최신 brief_YYMM.md → '<YYMM>_drop1'.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SOURCES = ['ig', 'fb', 'tiktok', 'yt', 'threads']
const TARGETS = {
  klisten: 'https://k-listen-master.vercel.app/games',
  payhip: 'https://payhip.com/StepKorean',
  youtube: 'https://www.youtube.com/@steppingstones.Korean',
}

const argv = process.argv.slice(2)
const flagValue = (name) => {
  const i = argv.indexOf(name)
  if (i === -1) return undefined
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}
const paid = argv.includes('--paid') && (argv.splice(argv.indexOf('--paid'), 1), true)
const campaign = flagValue('--campaign') ?? defaultCampaign()
const [content, source = 'all', target = 'klisten'] = argv

if (!content || !/^C\d{2,}_v\d+$/.test(content) || !(source === 'all' || SOURCES.includes(source))) {
  console.error('사용법: node scripts/marketing/utm.mjs <C01_v1> <ig|fb|tiktok|yt|threads|all> [klisten|payhip|youtube|URL] [--campaign 2611_drop1] [--paid]')
  process.exit(1)
}

function defaultCampaign() {
  const dir = path.join(ROOT, 'marketing', 'os', '04_brief')
  const latest = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => /^brief_\d{4}\.md$/.test(f)).sort().pop()
    : null
  return latest ? `${latest.slice(6, 10)}_drop1` : 'drop1'
}

function build(src) {
  const url = new URL(TARGETS[target] ?? target)
  url.searchParams.set('utm_source', src)
  url.searchParams.set('utm_medium', paid ? 'paid' : 'organic')
  url.searchParams.set('utm_campaign', campaign)
  url.searchParams.set('utm_content', content)
  return url.toString()
}

for (const src of source === 'all' ? SOURCES : [source]) {
  console.log(source === 'all' ? `${src.padEnd(8)} ${build(src)}` : build(src))
}
