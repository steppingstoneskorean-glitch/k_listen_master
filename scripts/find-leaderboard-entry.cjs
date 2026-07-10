#!/usr/bin/env node
// scripts/find-leaderboard-entry.cjs
// ─────────────────────────────────────────────────────────────────────────────
// 리더보드 컬렉션 전체에서 특정 name 값을 가진 문서를 찾아 보고하는 read-only 조회 스크립트.
//   · firestore.rules 는 leaderboard 컬렉션의 update/delete 를 전면 차단한다
//     (allow update, delete: if false) — 이 프로젝트엔 Admin SDK/서비스 계정도 없어
//     코드로 삭제가 불가능하다. 이 스크립트는 "어디에 있는지"만 찾아 알려주고,
//     실제 삭제는 Firebase Console 에서 사람이 직접 한다.
//   · read 는 누구나 허용(allow read: if true)이므로 공개 클라이언트 설정만으로 조회 가능.
//
// 사용법: node scripts/find-leaderboard-entry.cjs [찾을 이름]  (기본값: STEPKOREAN)
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const ROOT = path.resolve(__dirname, '..');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}
loadEnvFile(path.join(ROOT, '.env.local'));
loadEnvFile(path.join(ROOT, '.env'));

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const COLLECTIONS = ['gameLeaderboard', 'intLeaderboard', 'intL1', 'intL2', 'advL1', 'advL2'];

async function main() {
  const target = process.argv[2] || 'STEPKOREAN';

  if (!firebaseConfig.projectId) {
    console.error('[find-leaderboard-entry] VITE_FIREBASE_* 환경변수가 없습니다 (.env.local 확인)');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log(`[find-leaderboard-entry] "${target}" 검색 중 (컬렉션: ${COLLECTIONS.join(', ')})...\n`);

  let found = 0;
  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      const matches = snap.docs.filter((d) => (d.data().name || '') === target);
      if (matches.length === 0) continue;

      for (const d of matches) {
        found += 1;
        const data = d.data();
        console.log(`✅ 발견: collection="${colName}" docId="${d.id}"`);
        console.log(`   name=${data.name}  score=${data.score}  timestamp=${data.timestamp ? new Date(data.timestamp).toISOString() : '(없음)'}`);
        console.log(`   → Firebase Console: Firestore Database → ${colName} → ${d.id} → 문서 삭제\n`);
      }
    } catch (err) {
      console.warn(`[find-leaderboard-entry] "${colName}" 조회 실패: ${err.message}`);
    }
  }

  if (found === 0) {
    console.log(`"${target}" 이름의 문서를 어느 컬렉션에서도 찾지 못했습니다.`);
  } else {
    console.log(`총 ${found}건 발견. 위 docId 를 Firebase Console 에서 직접 삭제해 주세요 (rules 상 코드로는 삭제 불가).`);
  }
}

main().catch((err) => {
  console.error('[find-leaderboard-entry] 오류:', err.message);
  process.exit(1);
});
