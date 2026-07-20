#!/usr/bin/env node
// scripts/translate-explanations.cjs
// ─────────────────────────────────────────────────────────────────────────────
// src/data/hardcodedQuizzes.ts 의 HARDCODED_QUIZZES explanation 을
// { en, ja, es, zh, vi } 다국어 객체로 자동 채운다.
// pre-commit 훅(.husky/pre-commit)에서 hardcodedQuizzes.ts 가 staged 되어 있을 때 호출된다.
//
//   · 한국어(Hangul) 텍스트는 절대 번역/로마자화하지 않는다 — 시스템 프롬프트로 강제.
//   · en 텍스트가 바뀌지 않은 항목은 캐시(scripts/.i18n-cache.json)로 재번역을 건너뛴다.
//   · 이미 4개 언어가 모두 채워진 항목(예: 손으로 번역한 기존 데이터)은 API 호출 없이
//     캐시에만 기록한다 — 최초 실행 시 불필요한 비용이 들지 않는다.
//   · 번역 API 실패는 fail-open: 경고만 출력하고 커밋을 막지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const TARGET_FILE = path.join(ROOT, 'src/data/hardcodedQuizzes.ts');
const CACHE_FILE = path.join(__dirname, '.i18n-cache.json');
const LANGS = ['ja', 'es', 'zh', 'vi'];

// ── .env.local / .env 수동 로드 (dotenv 의존성 없이, git hook 환경에서도 키를 읽기 위해) ──
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

function hash(text) {
  return crypto.createHash('sha256').update(text || '').digest('hex').slice(0, 16);
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2) + '\n');
}

// ── HARDCODED_QUIZZES 배열 리터럴을 소스에서 찾아 실제 JS 배열로 파싱 ─────────────
function extractQuizList(src) {
  const startMarker = 'export const HARDCODED_QUIZZES: QuizItem[] = [';
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error('HARDCODED_QUIZZES 선언을 찾을 수 없습니다');
  const arrayStart = start + startMarker.length - 1; // '[' 위치
  // 종료: 컬럼 0 의 ']' — 항목 내부의 중첩 배열은 들여쓰기되므로 여기 걸리지 않는다
  const marker = '\n]';
  const markerAt = src.indexOf(marker, arrayStart);
  if (markerAt === -1) throw new Error('HARDCODED_QUIZZES 종료 지점(\\n])을 찾을 수 없습니다');
  const rangeEnd = markerAt + 2; // ']' 까지 포함
  const literalText = src.slice(arrayStart, rangeEnd); // '[' ... ']'
  // 데이터 리터럴만 담고 있음(함수 호출 없음) — Function 생성자로 안전하게 평가
  const arr = new Function(`return ${literalText};`)();
  return { arr, rangeStart: arrayStart, rangeEnd };
}

function serializeQuizList(arr) {
  return '[\n' + arr.map((item) => JSON.stringify(item, null, 2)).join(',\n') + '\n]';
}

const SYSTEM_PROMPT = `You are a professional translator for a Korean-listening app aimed at foreign K-pop fans.
You will receive an English "explanation" field (grammar/pronunciation notes for a Korean listening quiz item) that may contain Korean words or sentences mixed in.

Rules:
1. NEVER translate, romanize, or alter ANY Korean (Hangul) text. Copy every Korean substring byte-for-byte, unchanged, in the exact same position in the sentence.
2. Translate ONLY the English prose and the English glosses of Korean examples into the requested target languages.
3. Keep the literal words "Verb" / "Adjective" untranslated when they appear right before a "+" grammar formula (e.g. "Verb + -(으)ㄹ게요"), matching the source style.
4. Preserve the original line breaks (as \\n) and overall paragraph structure exactly.
5. Respond with ONLY a single JSON object, no markdown code fences, no commentary, with exactly these keys: ${LANGS.join(', ')}. Each value is the fully translated string for that language.`;

async function translate(enText) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw Object.assign(new Error('NVIDIA_API_KEY not set (.env.local)'), { code: 'missing_key' });

  const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Translate this explanation into ${LANGS.join(', ')}:\n\n${enText}` },
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 1500,
      stream: false,
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`NVIDIA API HTTP ${r.status}: ${body.slice(0, 300)}`);
  }
  const data = await r.json();
  const raw = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('번역 응답에서 JSON을 찾지 못했습니다');
  const parsed = JSON.parse(jsonMatch[0]);
  for (const l of LANGS) {
    if (typeof parsed[l] !== 'string') throw new Error(`번역 응답에 "${l}" 키가 없습니다`);
  }
  return parsed;
}

async function main() {
  if (!fs.existsSync(TARGET_FILE)) return;
  const src = fs.readFileSync(TARGET_FILE, 'utf8');
  const { arr, rangeStart, rangeEnd } = extractQuizList(src);
  const cache = loadCache();

  let changed = false;
  let warned = false;
  const warn = (msg) => {
    if (!warned) console.warn(`[i18n] ⚠️  ${msg} — 커밋은 계속 진행됩니다.`);
    warned = true;
  };

  for (const item of arr) {
    const cacheKey = `${item.id}@${item.startTime}`;
    let exp = item.explanation;

    // 레거시 문자열 explanation → en 베이스라인 객체로 승격
    if (typeof exp === 'string') {
      exp = { en: exp, ja: '', es: '', zh: '', vi: '' };
      item.explanation = exp;
      changed = true;
    }
    if (typeof exp !== 'object' || exp === null) continue;

    const enText = exp.en || '';

    if (!enText.trim()) {
      for (const l of LANGS) {
        if (exp[l] !== '') {
          exp[l] = '';
          changed = true;
        }
      }
      continue;
    }

    const enHash = hash(enText);
    const cached = cache[cacheKey];

    if (cached && cached.enHash === enHash) {
      // 캐시가 최신 — 누락된 키만 캐시에서 채운다 (API 호출 없음)
      for (const l of LANGS) {
        if (!exp[l] && cached[l]) {
          exp[l] = cached[l];
          changed = true;
        }
      }
      continue;
    }

    // "이미 다 채워져 있으니 그대로 믿는다"는 캐시 기록이 아예 없을 때만 허용한다.
    // 캐시가 있는데 해시가 다르면 en 이 수정된 것이므로, 기존 번역이 다 차 있어도
    // 최신 원문과 더 이상 일치하지 않는 stale 번역일 수 있어 반드시 재번역해야 한다.
    const alreadyFull = LANGS.every((l) => typeof exp[l] === 'string' && exp[l].trim());
    if (!cached && alreadyFull) {
      // 이미 사람이 번역해 둔 데이터(예: 최초 실행) — API 호출 없이 캐시만 기록
      cache[cacheKey] = { enHash, ja: exp.ja, es: exp.es, zh: exp.zh, vi: exp.vi };
      continue;
    }

    try {
      const translated = await translate(enText);
      for (const l of LANGS) exp[l] = translated[l];
      cache[cacheKey] = { enHash, ...translated };
      changed = true;
      console.log(`[i18n] translated "${item.id}" (${item.startTime}s)`);
    } catch (err) {
      warn(`explanation 자동 번역 실패 (${item.id}): ${err.message}`);
    }
  }

  saveCache(cache);

  if (!changed) {
    console.log('[i18n] explanation 변경 사항 없음');
    return;
  }

  const newLiteral = serializeQuizList(arr);
  const newSrc = src.slice(0, rangeStart) + newLiteral + src.slice(rangeEnd);
  fs.writeFileSync(TARGET_FILE, newSrc);
  console.log('[i18n] hardcodedQuizzes.ts explanation 다국어 갱신 완료');
}

main().catch((err) => {
  console.warn(`[i18n] ⚠️  자동 번역 스크립트 오류 — 커밋은 계속 진행됩니다: ${err.message}`);
});
