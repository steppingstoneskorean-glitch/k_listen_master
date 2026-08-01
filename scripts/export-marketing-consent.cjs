#!/usr/bin/env node
// scripts/export-marketing-consent.cjs
// ─────────────────────────────────────────────────────────────────────────────
// 마케팅(광고성) 이메일 수신 "동의(opt-in)" 한 유저 목록을 이메일까지 매칭해 CSV 로 뽑는
// 관리자 전용 스크립트.
//
//   · 동의 기록은 users/{uid}.marketingConsent === true (동의 시각: marketingConsentAt, ms).
//     체크한 유저에게만 필드가 존재한다 (src/lib/marketingConsent.ts).
//   · users 문서는 firestore.rules 상 "본인만 read" 라 클라이언트로는 전체 조회 불가하고,
//     이메일은 Firestore 가 아니라 Firebase Authentication 에 있다. 따라서 이 매칭은
//     보안 규칙을 우회하는 신뢰된 Admin SDK + 서비스 계정 키로만 가능하다.
//
//   ⚠️ 결과 CSV 에는 이메일(개인정보)이 담긴다. git 커밋 금지(.gitignore 처리됨), 안전 보관,
//      동의한 목적(뉴스레터 발송) 외 사용 금지. 서비스 계정 키도 절대 커밋 금지.
//
// 준비:
//   1) Firebase Console → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성" → JSON 다운로드
//   2) 그 파일을 scripts/serviceAccountKey.json 으로 저장
//      (또는 GOOGLE_APPLICATION_CREDENTIALS 환경변수에 경로 지정, 또는 첫 인자로 경로 전달)
//
// 사용법:
//   node scripts/export-marketing-consent.cjs
//   node scripts/export-marketing-consent.cjs C:\path\to\key.json
//   npm run consent:export
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const ROOT = path.resolve(__dirname, '..');

// ── 서비스 계정 키 위치 결정 ────────────────────────────────────────────────
function resolveKeyPath() {
  const candidates = [
    process.argv[2],
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(__dirname, 'serviceAccountKey.json'),
    path.join(ROOT, 'serviceAccountKey.json'),
  ].filter(Boolean);
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── CSV 안전 이스케이프 (쉼표/따옴표/줄바꿈 대응) ───────────────────────────
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

// ── KST 'YYYY-MM-DD HH:mm' 포맷 ─────────────────────────────────────────────
function fmtKST(ms) {
  if (!ms) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(ms));
  const g = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${g('year')}-${g('month')}-${g('day')} ${g('hour')}:${g('minute')}`;
}

// ── uid 배열 → { uid: email/displayName } (Auth 에서 최대 100개씩 배치 조회) ──
async function fetchAuthUsers(auth, uids) {
  const out = new Map();
  for (let i = 0; i < uids.length; i += 100) {
    const chunk = uids.slice(i, i + 100).map((uid) => ({ uid }));
    const res = await auth.getUsers(chunk);
    for (const u of res.users) {
      out.set(u.uid, { email: u.email || '', displayName: u.displayName || '' });
    }
    // res.notFound: Auth 계정이 삭제된 uid — email 없이 표기
  }
  return out;
}

async function main() {
  const keyPath = resolveKeyPath();
  if (!keyPath) {
    console.error('[consent-export] 서비스 계정 키를 찾을 수 없습니다.');
    console.error('  Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → JSON 다운로드');
    console.error('  → scripts/serviceAccountKey.json 으로 저장하거나, 경로를 인자로 전달하세요.');
    process.exit(1);
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  } catch (err) {
    console.error(`[consent-export] 키 파일 파싱 실패 (${keyPath}): ${err.message}`);
    process.exit(1);
  }

  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  const auth = getAuth();

  console.log(`[consent-export] 프로젝트 "${serviceAccount.project_id}" — 동의 유저 조회 중...`);

  const snap = await db.collection('users').where('marketingConsent', '==', true).get();
  if (snap.empty) {
    console.log('[consent-export] 마케팅 수신 동의한 유저가 없습니다.');
    process.exit(0);
  }

  const rows = snap.docs.map((d) => ({
    uid: d.id,
    consentAt: d.data().marketingConsentAt || null,
  }));

  // 이메일 매칭
  const authMap = await fetchAuthUsers(auth, rows.map((r) => r.uid));

  // 동의 시각 최신순 정렬
  rows.sort((a, b) => (b.consentAt || 0) - (a.consentAt || 0));

  // CSV 조립 (UTF-8 BOM 붙여 Excel 에서 한글/이메일 깨짐 방지)
  const header = ['email', 'displayName', 'uid', 'consentAt_KST', 'consentAt_ms'];
  const lines = [header.join(',')];
  let missingEmail = 0;
  for (const r of rows) {
    const info = authMap.get(r.uid) || { email: '', displayName: '' };
    if (!info.email) missingEmail += 1;
    lines.push([
      csvCell(info.email),
      csvCell(info.displayName),
      csvCell(r.uid),
      csvCell(fmtKST(r.consentAt)),
      csvCell(r.consentAt || ''),
    ].join(','));
  }
  const csv = '﻿' + lines.join('\r\n') + '\r\n';

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date());
  const outPath = path.join(ROOT, `marketing-consent-${today}.csv`);
  fs.writeFileSync(outPath, csv, 'utf8');

  console.log(`\n✅ 완료: 동의 ${rows.length}명`);
  if (missingEmail) console.log(`   (그 중 ${missingEmail}명은 Auth 계정 삭제 등으로 이메일 없음)`);
  console.log(`   → ${outPath}`);
  console.log('   ⚠️ 개인정보 파일입니다. git 커밋 금지, 안전하게 보관하고 발송 후 필요 없으면 삭제하세요.');
}

main().catch((err) => {
  console.error('[consent-export] 오류:', err.message);
  process.exit(1);
});
