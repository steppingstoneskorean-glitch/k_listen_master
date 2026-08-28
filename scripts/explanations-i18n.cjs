#!/usr/bin/env node
/* eslint-disable no-console */
// scripts/explanations-i18n.cjs
// ─────────────────────────────────────────────────────────────────────────────
// K-Stars(kartistQuizzes) 해설 explanation 의 ja/es 번역을 "검수 시트" 방식으로 처리한다.
// 자동 번역은 한국어 예문을 자주 훼손해 신뢰도가 낮으므로(직접 확인됨), 자동은 "초안"만
// 만들고 사람(교사)이 검수·수정한 뒤 반영한다. 사이트가 쓰는 ja/es 만 대상으로 한다.
//
//   node scripts/explanations-i18n.cjs export
//     → 번역 필요한 고유 영어 노트를 모아 자동 초안(한국어 보존 검증 통과분)을 채워
//        i18n-review/explanations-review.txt (편집용) + .map.json (매칭용) 생성.
//
//   node scripts/explanations-i18n.cjs import           # DRY-RUN: 파싱/미리보기만
//   node scripts/explanations-i18n.cjs import --commit  # 검수 완료본을 Firestore 에 반영(백업 후)
//
// 필요: serviceAccountKey.json (루트), NVIDIA_API_KEY (.env.local — export 시에만)
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const COLLECTION = 'kartistQuizzes';
const LANGS = ['ja', 'es']; // 사이트가 실제로 노출하는 언어만
const REVIEW_DIR = path.join(ROOT, 'i18n-review');
const TXT_FILE = path.join(REVIEW_DIR, 'explanations-review.txt');
const MAP_FILE = path.join(REVIEW_DIR, 'explanations-review.map.json');
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
// 이전 모델(llama-3.3-nemotron-super-49b-v1.5)은 NVIDIA 측에서 폐기(HTTP 410)됨.
const NVIDIA_MODEL = process.env.NVIDIA_TRANSLATE_MODEL || 'nvidia/nemotron-3-super-120b-a12b';

// ── env ──────────────────────────────────────────────────────────────────────
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}
loadEnvFile(path.join(ROOT, '.env.local'));
loadEnvFile(path.join(ROOT, '.env'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HANGUL_RE = /[가-힣㄰-㆏ᄀ-ᇿ]/g;
const hangulSeq = (s) => (String(s || '').match(HANGUL_RE) || []).join('');
const stripThinking = (raw) => {
  const i = raw.lastIndexOf('</think>');
  return i === -1 ? raw : raw.slice(i + '</think>'.length);
};
const enOf = (exp) => (typeof exp === 'string' ? exp : (exp && exp.en) || '');
function needsTranslation(exp) {
  const en = enOf(exp);
  if (!en.trim()) return false;
  if (typeof exp === 'string') return true;
  return LANGS.some((l) => !((exp[l] || '').toString().trim()));
}

// ── Firestore ────────────────────────────────────────────────────────────────
function initDb() {
  const keyPath = path.join(ROOT, 'serviceAccountKey.json');
  if (!fs.existsSync(keyPath)) {
    console.error('❌ serviceAccountKey.json 이 루트에 없습니다 (Firebase 콘솔 → 서비스 계정 → 새 비공개 키).');
    process.exit(1);
  }
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  initializeApp({ credential: cert(require(keyPath)) });
  return getFirestore();
}

async function collectUniqueEns(db) {
  const snap = await db.collection(COLLECTION).get();
  const set = new Set();
  snap.forEach((doc) => {
    const d = doc.data();
    for (const field of ['published', 'draft']) {
      const arr = Array.isArray(d[field]) ? d[field] : [];
      for (const it of arr) if (it && needsTranslation(it.explanation)) set.add(enOf(it.explanation));
    }
  });
  return { snap, ens: [...set] };
}

// ── 번역 (ja/es, 한국어 보존 검증) ───────────────────────────────────────────
const SYS = `detailed thinking off

You are a professional translator for a Korean-listening app aimed at foreign K-pop fans.
You will receive one English "explanation" (grammar/pronunciation notes) that may contain Korean words or sentences mixed in.

Rules:
1. NEVER translate, romanize, or alter ANY Korean (Hangul) text. Copy every Korean substring character-for-character, unchanged, in the exact same position.
2. Translate ONLY the English prose and the English glosses of Korean examples into the target languages.
3. Keep the literal words "Verb" / "Adjective" untranslated when they appear right before a "+" grammar formula.
4. Preserve the original line breaks (as \\n) and paragraph structure exactly.
5. Respond with ONLY a single JSON object, no markdown fences, with exactly these keys: ${LANGS.join(', ')}.`;

async function translateOne(en, apiKey, attempt = 0) {
  let r;
  try {
    r = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: NVIDIA_MODEL,
        messages: [
          { role: 'system', content: SYS },
          { role: 'user', content: `Translate this explanation into ${LANGS.join(', ')}:\n\n${en}` },
        ],
        temperature: 0.2, top_p: 0.9, max_tokens: 2000, stream: false,
      }),
    });
  } catch (e) {
    if (attempt < 3) { await sleep(1500 * (attempt + 1)); return translateOne(en, apiKey, attempt + 1); }
    throw e;
  }
  if ((r.status === 429 || r.status >= 500) && attempt < 3) { await sleep(2000 * (attempt + 1)); return translateOne(en, apiKey, attempt + 1); }
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  const raw = stripThinking(data?.choices?.[0]?.message?.content || '');
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('JSON 없음');
  const p = JSON.parse(m[0]);
  const out = {};
  const src = hangulSeq(en);
  for (const l of LANGS) {
    if (typeof p[l] !== 'string' || !p[l].trim()) throw new Error(`${l} 누락`);
    if (hangulSeq(p[l]) !== src) throw new Error(`한국어 훼손(${l})`);
    out[l] = p[l];
  }
  return out;
}

// ── EXPORT ───────────────────────────────────────────────────────────────────
async function cmdExport() {
  const apiKey = (process.env.NVIDIA_API_KEY || '').trim();
  if (!apiKey) { console.error('❌ NVIDIA_API_KEY 없음(.env.local)'); process.exit(1); }
  const db = initDb();
  const { ens } = await collectUniqueEns(db);
  console.log(`번역 필요한 고유 노트: ${ens.length}개 (대상 언어: ${LANGS.join(', ')})\n`);

  const drafts = {}; // en → {ja,es} (검증 통과분만)
  let ok = 0;
  for (let i = 0; i < ens.length; i++) {
    process.stdout.write(`[${i + 1}/${ens.length}] `);
    try {
      drafts[ens[i]] = await translateOne(ens[i], apiKey);
      ok++;
      console.log(`✓ 자동 초안`);
    } catch (e) {
      console.log(`· 초안 실패(${e.message}) → 빈칸(직접 작성)`);
    }
    await sleep(400);
  }

  fs.mkdirSync(REVIEW_DIR, { recursive: true });
  const map = {};
  const blocks = [
    '# ─────────────────────────────────────────────────────────────',
    '# K-Stars 해설 ja/es 검수 파일',
    '# · [JA] / [ES] 칸을 채우거나 수정하세요. [EN] 은 참고용 — 수정하지 마세요.',
    '# · 규칙: 한국어(한글)는 그대로 두고, 영어 설명만 번역. 비워두면 그 언어는 건너뜁니다.',
    '# · 자동 초안이 채워진 칸은 반드시 검수하세요(오역 가능). 편집 후 저장하고 알려주세요.',
    `# · 대상: ${ens.length}개 노트 (자동 초안 ${ok}개 / 빈칸 ${ens.length - ok}개)`,
    '# ─────────────────────────────────────────────────────────────',
    '',
  ];
  ens.forEach((en, idx) => {
    map[idx] = en;
    const d = drafts[en] || {};
    blocks.push(`===== [${idx}] =====`);
    blocks.push('[EN] (참고용 · 수정 금지)');
    blocks.push(en);
    blocks.push('');
    blocks.push('[JA]');
    blocks.push(d.ja || '');
    blocks.push('');
    blocks.push('[ES]');
    blocks.push(d.es || '');
    blocks.push('');
  });
  fs.writeFileSync(TXT_FILE, blocks.join('\n'));
  fs.writeFileSync(MAP_FILE, JSON.stringify(map, null, 2));
  console.log(`\n✅ 검수 파일 생성:`);
  console.log(`   ${path.relative(ROOT, TXT_FILE)}   (편집)`);
  console.log(`   ${path.relative(ROOT, MAP_FILE)}   (매칭용 — 수정 금지)`);
  console.log(`\n자동 초안 ${ok}개는 검수, 빈칸 ${ens.length - ok}개는 직접 작성 후, import 로 반영하세요.`);
}

// ── 검수 파일 파싱 ───────────────────────────────────────────────────────────
function parseReview() {
  if (!fs.existsSync(TXT_FILE) || !fs.existsSync(MAP_FILE)) {
    console.error(`❌ 검수 파일이 없습니다. 먼저 export 를 실행하세요.`);
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8'));
  const txt = fs.readFileSync(TXT_FILE, 'utf8');
  const parts = txt.split(/^===== \[(\d+)\] =====$/m);
  // parts: [preamble, idx, body, idx, body, ...]
  const byIdx = {};
  for (let i = 1; i < parts.length; i += 2) {
    const idx = parts[i];
    const body = parts[i + 1] || '';
    byIdx[idx] = extractSections(body);
  }
  return { map, byIdx };
}
function extractSections(body) {
  const lines = body.split('\n');
  const sec = { EN: [], JA: [], ES: [] };
  let cur = null;
  for (const line of lines) {
    const h = line.match(/^\[(EN|JA|ES)\]/);
    if (h) { cur = h[1]; continue; }
    if (cur) sec[cur].push(line);
  }
  const clean = (a) => a.join('\n').replace(/^\n+/, '').replace(/\n+$/, '');
  return { ja: clean(sec.JA), es: clean(sec.ES) };
}

// ── IMPORT ───────────────────────────────────────────────────────────────────
async function cmdImport(commit) {
  const { map, byIdx } = parseReview();
  const db = initDb();
  const snap = await db.collection(COLLECTION).get();

  // en 오류 수정(선택): i18n-review/en-fixes.json = { "idx": [[find, replace], ...] }
  // 원본 en(map)에 정밀 치환을 적용해 Firestore 에 쓸 en 을 만든다. 매칭 키는 원본 en 유지.
  const fixPath = path.join(REVIEW_DIR, 'en-fixes.json');
  const enFixes = fs.existsSync(fixPath) ? JSON.parse(fs.readFileSync(fixPath, 'utf8')) : {};
  function correctEn(idx, en) {
    const rules = enFixes[idx];
    if (!Array.isArray(rules)) return en;
    let out = en;
    for (const [find, replace] of rules) {
      if (!out.includes(find)) {
        console.log(`⚠️  [${idx}] en 수정 실패: 원문에서 "${String(find).slice(0, 30)}…" 를 찾지 못함`);
        continue;
      }
      out = out.split(find).join(replace);
    }
    return out;
  }

  // originalEn → { en: correctedEn, ja?, es? }  (매칭은 originalEn, 기록은 correctedEn)
  const trans = new Map();
  let filled = 0, enFixed = 0;
  for (const idx of Object.keys(map)) {
    const en = map[idx];
    const s = byIdx[idx] || { ja: '', es: '' };
    const corrected = correctEn(idx, en);
    if (corrected !== en) enFixed++;
    const v = { en: corrected };
    if (s.ja && s.ja.trim()) v.ja = s.ja;
    if (s.es && s.es.trim()) v.es = s.es;
    if (v.ja || v.es || corrected !== en) { trans.set(en, v); filled++; }
    // 한국어 보존 경고(사람이 편집했으므로 차단은 안 함)
    for (const l of LANGS) {
      if (v[l] && hangulSeq(v[l]) !== hangulSeq(en)) {
        console.log(`⚠️  [${idx}] ${l}: 한국어가 원문과 다릅니다 — 의도한 편집인지 확인하세요.`);
      }
    }
  }
  console.log(`\n검수본 채워진 노트: ${filled}/${Object.keys(map).length}  (en 수정 ${enFixed}개)\n`);

  // 문서별 적용
  const changes = new Map();
  let slots = 0;
  snap.forEach((doc) => {
    const d = doc.data();
    let touched = false;
    const next = {};
    for (const field of ['published', 'draft']) {
      if (!Array.isArray(d[field])) continue;
      next[field] = d[field].map((it) => {
        if (!it || !needsTranslation(it.explanation)) return it;
        const en = enOf(it.explanation);
        const v = trans.get(en);
        if (!v) return it;
        const prev = typeof it.explanation === 'object' && it.explanation ? it.explanation : {};
        touched = true; slots++;
        // v = { en: correctedEn, ja?, es? } — corrected en 이 원본 en 을 덮어쓴다
        return { ...it, explanation: { ...pruneEmpty(prev), ...v } };
      });
    }
    if (touched) changes.set(doc.id, { ref: doc.ref, next });
  });

  console.log(`적용될 슬롯: ${slots}개, 영향 문서: ${changes.size}개`);
  if (!commit) {
    console.log('\n🟢 DRY-RUN — Firestore 미변경.  반영: node scripts/explanations-i18n.cjs import --commit');
    return;
  }

  // 백업 후 쓰기
  fs.mkdirSync(path.join(ROOT, 'backups'), { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = {};
  snap.forEach((d) => { backup[d.id] = d.data(); });
  const bfile = path.join(ROOT, 'backups', `kartistQuizzes-${stamp}.json`);
  fs.writeFileSync(bfile, JSON.stringify(backup, null, 2));
  console.log(`\n💾 백업: ${path.relative(ROOT, bfile)}`);

  let written = 0;
  for (const { ref, next } of changes.values()) { await ref.update(next); written++; }
  console.log(`\n✅ 완료 — 문서 ${written}개 업데이트. 라이브 ja/es 에서 반영됩니다.`);
}
function pruneEmpty(o) {
  const out = {};
  for (const k of Object.keys(o)) if (typeof o[k] === 'string' && o[k].trim()) out[k] = o[k];
  return out;
}

// ── main ─────────────────────────────────────────────────────────────────────
const cmd = process.argv[2];
const commit = process.argv.includes('--commit');
(async () => {
  if (cmd === 'export') await cmdExport();
  else if (cmd === 'import') await cmdImport(commit);
  else {
    console.log('사용법:\n  node scripts/explanations-i18n.cjs export\n  node scripts/explanations-i18n.cjs import [--commit]');
    process.exit(1);
  }
})().catch((e) => { console.error('\n❌ 오류:', e.message); process.exit(1); });
