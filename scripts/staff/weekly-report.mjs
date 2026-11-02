#!/usr/bin/env node
// scripts/staff/weekly-report.mjs
// ─────────────────────────────────────────────────────────────────────────────
// AI 직원 ③ 분석 담당 — 매주 월요일 지난 7일 요약을 텔레그램으로 보고
//   · 앱 DB(Firebase Auth + Firestore): 가입·로그인·학습한 사람·스트릭·리더보드·퀴즈/자료 현황
//   · GA4(선택): 활성 사용자·세션·기능별 이벤트(trackEvent). GA_PROPERTY_ID 가 있고
//     서비스 계정이 GA 속성에 '뷰어'로 추가돼 있을 때만 — 없으면 해당 섹션만 건너뛴다.
//   · 숫자는 코드가 계산하고, LLM 은 그 숫자로 해석 3줄 + 이번 주 할 일 1개만 쓴다.
//   · 개인정보(이메일·이름·uid)는 집계만 하고 보고서/LLM 에 절대 넣지 않는다.
//
//   실행: node scripts/staff/weekly-report.mjs [--dry-run]
// ─────────────────────────────────────────────────────────────────────────────
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { JWT } from 'google-auth-library'
import { loadEnv, initAdmin, serviceAccount, report, askJson } from './_shared.mjs'

const dryRun = process.argv.includes('--dry-run')
const DAY = 86400_000
const now = Date.now()
const weekAgo = now - 7 * DAY
const twoWeeksAgo = now - 14 * DAY
// Firestore 날짜 필드는 'YYYY-MM-DD' (KST 기준 로컬 날짜) 문자열
const kstDate = (ms) => new Date(ms + 9 * 3600_000).toISOString().slice(0, 10)

const pct = (a, b) => (b ? `${Math.round((a / b) * 100)}%` : '-')
const delta = (cur, prev) => {
  if (!prev) return cur ? ' (지난주 0)' : ''
  const d = cur - prev
  return d === 0 ? ' (지난주와 같음)' : ` (지난주 대비 ${d > 0 ? '+' : ''}${d})`
}

async function appStats(app) {
  const db = getFirestore(app)

  // Auth — 가입/로그인 (시각만 사용)
  const users = []
  let pageToken
  do {
    const page = await getAuth(app).listUsers(1000, pageToken)
    users.push(...page.users.map((u) => ({
      created: Date.parse(u.metadata.creationTime),
      // lastRefreshTime 은 앱을 열어 토큰이 갱신된 시각 — 자동 로그인 유저의 실제 방문에 가깝다
      seen: Math.max(Date.parse(u.metadata.lastSignInTime) || 0, Date.parse(u.metadata.lastRefreshTime ?? '') || 0),
    })))
    pageToken = page.pageToken
  } while (pageToken)

  const profiles = (await db.collection('users').get()).docs.map((d) => d.data())
  const since = kstDate(weekAgo)
  const learnedThisWeek = profiles.filter((p) => p.lastCompletionDate && p.lastCompletionDate > since)
  const streak3 = profiles.filter((p) => (p.currentStreak ?? 0) >= 3 && p.lastCompletionDate > since).length

  const lb = (await db.collection('gameLeaderboard').get()).docs.map((d) => d.data())
  const lbTime = (e) => (e.timestamp?.toMillis ? e.timestamp.toMillis() : Number(e.timestamp) || Date.parse(e.timestamp) || 0)
  const gamesThisWeek = lb.filter((e) => lbTime(e) >= weekAgo).length
  const gamesPrevWeek = lb.filter((e) => lbTime(e) >= twoWeeksAgo && lbTime(e) < weekAgo).length

  const quizDocs = (await db.collection('kartistQuizzes').get()).docs.map((d) => d.data())
  const awaitingReview = quizDocs.filter((q) => q.aiDraft && !(q.published ?? []).length).length

  const materials = (await db.collection('materials').get()).docs.map((d) => d.data())
  const toMs = (ts) => (ts?.toMillis ? ts.toMillis() : 0)

  return {
    totalUsers: users.length,
    newUsers: users.filter((u) => u.created >= weekAgo).length,
    newUsersPrev: users.filter((u) => u.created >= twoWeeksAgo && u.created < weekAgo).length,
    visitors: users.filter((u) => u.seen >= weekAgo).length,
    visitorsPrev: users.filter((u) => u.seen >= twoWeeksAgo && u.seen < weekAgo).length,
    learners: learnedThisWeek.length,
    streak3,
    gamesThisWeek,
    gamesPrevWeek,
    publishedQuizVideos: quizDocs.filter((q) => (q.published ?? []).length).length,
    awaitingReview,
    materialsTotal: materials.filter((m) => m.published).length,
    materialsNew: materials.filter((m) => toMs(m.createdAt) >= weekAgo).length,
  }
}

// GA4 Data API — 설정이 없거나 권한이 없으면 null (보고서에 안내만)
async function gaStats() {
  const propertyId = (loadEnv().GA_PROPERTY_ID || '').trim()
  if (!propertyId) return { skipped: 'GA_PROPERTY_ID 미설정' }
  const key = serviceAccount()
  const client = new JWT({ email: key.client_email, key: key.private_key, scopes: ['https://www.googleapis.com/auth/analytics.readonly'] })
  const run = async (body) => {
    const res = await client.request({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      method: 'POST',
      data: body,
    })
    return res.data
  }
  const ranges = [
    { startDate: '7daysAgo', endDate: 'yesterday', name: 'cur' },
    { startDate: '14daysAgo', endDate: '8daysAgo', name: 'prev' },
  ]
  try {
    const totals = await run({
      dateRanges: ranges,
      metrics: [{ name: 'activeUsers' }, { name: 'newUsers' }, { name: 'sessions' }, { name: 'userEngagementDuration' }],
    })
    const pick = (name) => {
      const row = totals.rows?.find((r) => r.dimensionValues?.[0]?.value === name)
      return (row?.metricValues ?? []).map((v) => Number(v.value))
    }
    const [au = 0, nu = 0, ss = 0, eng = 0] = pick('cur')
    const [auP = 0, , ssP = 0] = pick('prev')

    const events = await run({
      dateRanges: [ranges[0]],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 40,
    })
    // GA 자동 수집 이벤트는 빼고 앱이 직접 보내는 기능 이벤트만
    const AUTO = new Set(['page_view', 'session_start', 'first_visit', 'user_engagement', 'scroll', 'click', 'form_start', 'form_submit', 'video_start', 'video_progress', 'video_complete', 'file_download'])
    const features = (events.rows ?? [])
      .map((r) => ({ name: r.dimensionValues[0].value, count: Number(r.metricValues[0].value), users: Number(r.metricValues[1].value) }))
      .filter((e) => !AUTO.has(e.name))
      .slice(0, 8)

    return { activeUsers: au, activeUsersPrev: auP, newUsers: nu, sessions: ss, sessionsPrev: ssP, avgEngageMin: au ? eng / au / 60 : 0, features }
  } catch (err) {
    const status = err.response?.status
    return { skipped: status === 403 ? '서비스 계정에 GA 속성 권한 없음' : `GA 조회 실패 (${status ?? err.message})` }
  }
}

function formatReport(a, ga, insight) {
  const L = []
  L.push(`📊 분석 담당 — 주간 보고 (${kstDate(weekAgo)} ~ ${kstDate(now - DAY)})`)
  L.push('')
  L.push('👥 사용자 (앱 DB)')
  L.push(`• 신규 가입 ${a.newUsers}명${delta(a.newUsers, a.newUsersPrev)} · 누적 ${a.totalUsers}명`)
  L.push(`• 이번 주 앱을 연 사람 ${a.visitors}명${delta(a.visitors, a.visitorsPrev)} (전체의 ${pct(a.visitors, a.totalUsers)})`)
  L.push(`• 학습을 완료한 사람 ${a.learners}명 · 3일+ 연속 학습 ${a.streak3}명`)
  L.push(`• 게임 기록 ${a.gamesThisWeek}회${delta(a.gamesThisWeek, a.gamesPrevWeek)}`)
  L.push('')
  if (ga.skipped) {
    L.push(`📈 GA — 건너뜀 (${ga.skipped})`)
  } else {
    L.push('📈 앱 사용 (GA, 쿠키 동의한 사용자만)')
    L.push(`• 활성 사용자 ${ga.activeUsers}명${delta(ga.activeUsers, ga.activeUsersPrev)} · 신규 ${ga.newUsers}명`)
    L.push(`• 세션 ${ga.sessions}회${delta(ga.sessions, ga.sessionsPrev)} · 1인당 평균 ${ga.avgEngageMin.toFixed(1)}분`)
    if (ga.features.length) {
      L.push('• 많이 쓴 기능')
      for (const f of ga.features) L.push(`   - ${f.name}: ${f.count}회 / ${f.users}명`)
    }
  }
  L.push('')
  L.push('🗂 콘텐츠')
  L.push(`• 퀴즈 배포된 영상 ${a.publishedQuizVideos}개 · 검수 기다리는 AI 초안 ${a.awaitingReview}개`)
  L.push(`• 무료 자료 ${a.materialsTotal}개 (이번 주 +${a.materialsNew})`)
  if (insight) {
    L.push('')
    L.push('💡 해석')
    for (const s of insight.insights ?? []) L.push(`• ${s}`)
    if (insight.action) {
      L.push('')
      L.push(`✅ 이번 주 할 일: ${insight.action}`)
    }
  }
  return L.join('\n')
}

const INSIGHT_PROMPT = `You are the analytics staff member for a solo founder's Korean-listening learning app (K-Listen Master, early stage, ~dozens of users).
You get last week's aggregated numbers as JSON. Write in natural, friendly Korean using 해요체 endings (-예요/-어요, never -습니다), short. Never use English field names (say 학습 완료자, not learners).
Rules: use ONLY the given numbers — never invent data. Small numbers are normal at this stage; do not overreact to tiny changes (e.g. 1→2).
Return ONLY JSON: { "insights": [string, string, string], "action": string }
- insights: 3 observations, each one sentence, each citing a number.
- action: ONE concrete thing the founder can do this week, tied to the numbers — about the product or content (onboarding flow, content, notifications, SNS), never contacting or singling out individual users.`

async function main() {
  const app = initAdmin()
  const [a, ga] = await Promise.all([appStats(app), gaStats()])
  let insight = null
  try {
    insight = await askJson(INSIGHT_PROMPT, JSON.stringify({ app: a, ga }), { maxTokens: 800 })
  } catch (err) {
    console.warn(`해석 생성 실패(${err.message}) — 숫자만 보고`)
  }
  const text = formatReport(a, ga, insight)
  if (dryRun) console.log(text)
  else await report(text)
}

main().catch(async (err) => {
  console.error(err)
  if (!dryRun) await report(`⚠️ 분석 담당 오류: ${err.message}`).catch(() => {})
  process.exit(1)
})
