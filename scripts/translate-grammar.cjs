#!/usr/bin/env node
// scripts/translate-grammar.cjs
// ─────────────────────────────────────────────────────────────────────────────
// grammarArticles.ts 의 영어 본문을 ko/es/ja 로 번역해
// src/data/grammarTranslations.json 사전({영어원문: {ko,es,ja}})을 채운다.
// pre-commit 훅에서 grammarArticles.ts 가 staged 되어 있을 때 호출된다.
//
//   · 사전 자체가 캐시다 — 이미 번역된 (문자열, 언어) 쌍은 건너뛴다.
//   · 본문에 섞인 한국어(Hangul) 예문은 절대 변형 금지. 시스템 프롬프트로 지시하고,
//     응답에서 원문의 모든 한글 구간이 그대로 보존됐는지 **코드로 검증**한다.
//     검증 실패 시 해당 번역은 저장하지 않는다(런타임은 영어로 폴백).
//   · 번역 API 실패는 fail-open: 경고만 출력하고 커밋을 막지 않는다.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_FILE = path.join(ROOT, 'src/data/grammarArticles.ts');
const DICT_FILE = path.join(ROOT, 'src/data/grammarTranslations.json');
// 검증에 반복 실패하는 문자열을 기록해 매 커밋마다 재시도하는 것을 막는다.
// (모델이 특정 문장의 한국어 예문을 계속 변형하는 등 결정적으로 실패하는 경우가 있다)
// 강제로 다시 시도하려면: node scripts/translate-grammar.cjs --retry-failed
const FAILED_FILE = path.join(__dirname, '.grammar-i18n-failed.json');
const RETRY_FAILED = process.argv.includes('--retry-failed');
const LANGS = ['ko', 'es', 'ja'];
const LANG_NAMES = { ko: 'Korean', es: 'Spanish', ja: 'Japanese' };
const BATCH_SIZE = 12;

// ── .env.local / .env 수동 로드 ──────────────────────────────────────────────
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

// ── GRAMMAR_ARTICLES 배열 리터럴 추출 ────────────────────────────────────────
function extractArticles(src) {
  const startMarker = 'export const GRAMMAR_ARTICLES: GrammarArticle[] = [';
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error('GRAMMAR_ARTICLES 선언을 찾을 수 없습니다');
  const arrayStart = start + startMarker.length - 1;
  const markerAt = src.indexOf('\n]', arrayStart);
  if (markerAt === -1) throw new Error('GRAMMAR_ARTICLES 종료 지점(\\n])을 찾을 수 없습니다');
  return new Function(`return ${src.slice(arrayStart, markerAt + 2)};`)();
}

// ── 번역 대상 문자열 수집 ────────────────────────────────────────────────────
// 설명 산문(title/meaning/summary/heading/paragraphs)만 번역한다.
// 예문의 영어 뜻풀이(ex.en)는 **일부러 제외** — 한국어 UI 에서 번역하면 바로 위의
// 한국어 예문(ex.ko)과 똑같아져 뜻풀이가 무의미해진다. 예문은 "한국어 + 영어 뜻"
// 형태로 두는 것이 학습 자료로서도 자연스럽다. (slug/pattern/퀴즈 문장도 제외)
function collectStrings(articles) {
  const set = new Set();
  for (const a of articles) {
    set.add(a.title);
    set.add(a.meaning);
    set.add(a.summary);
    for (const sec of a.sections) {
      set.add(sec.heading);
      for (const p of sec.paragraphs || []) set.add(p);
    }
  }
  return [...set];
}

// ── 한글 보존 검증: 원문의 모든 한글 구간이 번역문에 그대로 있어야 한다 ────────
const HANGUL_RUN = /[가-힣]+(?:[ .,!?'"()~…-]*[가-힣]+)*/g;
function hangulPreserved(src, out) {
  const runs = src.match(HANGUL_RUN) || [];
  return runs.every(r => out.includes(r));
}

// 모델이 영어 원문을 그대로 되돌려준 경우를 걸러낸다.
// (한글 보존 검사만으로는 통과해 버리므로 별도 검증이 필요하다)
function isEcho(src, out) {
  return out.trim() === src.trim();
}

// ko/ja 번역문에 중국어 한자가 섞여 들어온 경우를 걸러낸다.
// (일본어는 한자를 정상 사용하므로 ja 는 검사하지 않는다)
function hasStrayHanja(out, lang) {
  return lang === 'ko' && /[一-鿿]/.test(out);
}

function validate(src, out, lang) {
  if (typeof out !== 'string' || !out.trim()) return 'empty';
  if (isEcho(src, out)) return 'echo';
  if (!hangulPreserved(src, out)) return 'hangul';
  if (hasStrayHanja(out, lang)) return 'hanja';
  return null;
}

const SYSTEM_PROMPT = `You are a professional translator for a Korean-learning website aimed at global K-pop fans.
You will receive a JSON array of English strings (grammar explanations that may contain Korean words or sentences mixed in).

Rules:
1. NEVER translate, romanize, or alter ANY Korean (Hangul) text. Copy every Korean substring byte-for-byte, unchanged, in the same position in the sentence.
2. Translate ONLY the English prose into the requested target language.
3. Keep the literal words "Verb" / "Adjective" untranslated when they appear right before a "+" grammar formula (e.g. "Verb + -자"), matching the source style.
4. Preserve line breaks and punctuation structure.
5. Respond with ONLY a JSON array of translated strings, same length and order as the input. No markdown fences, no commentary.`;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// fetch 실패/레이트리밋은 지수 백오프로 재시도한다 (이전 실행에서 es 가 전멸한 원인)
async function withRetry(fn, label, attempts = 4) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        const wait = 2000 * 2 ** i;
        console.warn(`[grammar-i18n] ${label} 재시도 ${i + 1}/${attempts - 1} (${wait / 1000}s 후): ${err.message}`);
        await sleep(wait);
      }
    }
  }
  throw lastErr;
}

async function translateBatch(strings, lang) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) throw new Error('NVIDIA_API_KEY not set (.env.local)');

  const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Translate each string in this JSON array into ${LANG_NAMES[lang]}:\n\n${JSON.stringify(strings, null, 0)}`,
        },
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 4000,
      stream: false,
    }),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => '');
    throw new Error(`NVIDIA API HTTP ${r.status}: ${body.slice(0, 200)}`);
  }
  const data = await r.json();
  const raw = data?.choices?.[0]?.message?.content || '';
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('응답에서 JSON 배열을 찾지 못했습니다');
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || parsed.length !== strings.length) {
    throw new Error(`응답 배열 길이 불일치 (기대 ${strings.length}, 실제 ${parsed.length})`);
  }
  return parsed;
}

async function main() {
  const src = fs.readFileSync(SOURCE_FILE, 'utf8');
  const articles = extractArticles(src);
  const strings = collectStrings(articles);
  const dict = fs.existsSync(DICT_FILE) ? JSON.parse(fs.readFileSync(DICT_FILE, 'utf8')) : {};

  // 원본에서 사라진 문자열은 사전에서도 정리
  const live = new Set(strings);
  for (const key of Object.keys(dict)) if (!live.has(key)) delete dict[key];

  // 이전 실행에서 잘못 저장된 값(영어 echo / 한자 혼입) 정리 — 재번역 대상이 된다
  let purged = 0;
  for (const [key, entry] of Object.entries(dict)) {
    for (const lang of LANGS) {
      if (typeof entry[lang] === 'string' && validate(key, entry[lang], lang)) {
        delete entry[lang];
        purged++;
      }
    }
    if (Object.keys(entry).length === 0) delete dict[key];
  }
  if (purged) console.log(`[grammar-i18n] 기존 사전에서 불량 항목 ${purged}건 제거 — 재번역합니다`);

  // 반복 실패 캐시 로드 — 원문이 그대로인 (문자열, 언어) 쌍은 건너뛴다
  let failedCache = {};
  if (!RETRY_FAILED && fs.existsSync(FAILED_FILE)) {
    try {
      failedCache = JSON.parse(fs.readFileSync(FAILED_FILE, 'utf8'));
    } catch {
      failedCache = {};
    }
  }
  const failKey = (s, lang) => `${lang} ${s}`;
  // 원문에서 사라진 문자열은 캐시에서도 정리
  for (const key of Object.keys(failedCache)) {
    if (!live.has(key.slice(key.indexOf(' ') + 1))) delete failedCache[key];
  }

  let ok = 0;
  const rejected = { echo: 0, hangul: 0, hanja: 0, empty: 0 };
  let failed = 0;
  let skipped = 0;

  for (const lang of LANGS) {
    const missing = strings.filter(s => {
      if (dict[s] && typeof dict[s][lang] === 'string') return false;
      if (failedCache[failKey(s, lang)]) {
        skipped++;
        return false;
      }
      return true;
    });
    for (let i = 0; i < missing.length; i += BATCH_SIZE) {
      const batch = missing.slice(i, i + BATCH_SIZE);
      const label = `${lang} batch ${Math.floor(i / BATCH_SIZE)}`;
      try {
        const out = await withRetry(() => translateBatch(batch, lang), label);
        batch.forEach((s, j) => {
          const reason = validate(s, out[j], lang);
          if (!reason) {
            dict[s] = dict[s] || {};
            dict[s][lang] = out[j];
            ok++;
          } else {
            rejected[reason]++;
            failedCache[failKey(s, lang)] = reason; // 다음 실행부터 건너뛴다
            console.warn(`[grammar-i18n] ⚠️  검증 실패[${reason}](${lang}): "${s.slice(0, 45)}..." — 영어로 폴백`);
          }
        });
        console.log(`[grammar-i18n] ${lang}: ${Math.min(i + BATCH_SIZE, missing.length)}/${missing.length}`);
      } catch (err) {
        failed += batch.length;
        console.warn(`[grammar-i18n] ⚠️  번역 실패(${label}): ${err.message} — 커밋은 계속 진행됩니다.`);
      }
      // 사전은 배치마다 저장 — 중간 실패해도 진행분은 보존
      fs.writeFileSync(DICT_FILE, JSON.stringify(dict, null, 1) + '\n');
      await sleep(600); // 레이트리밋 여유 (계정 한도 40 rpm)
    }
  }

  fs.writeFileSync(DICT_FILE, JSON.stringify(dict, null, 1) + '\n');
  fs.writeFileSync(FAILED_FILE, JSON.stringify(failedCache, null, 1) + '\n');
  const cov = LANGS.map(l => `${l} ${strings.filter(s => dict[s]?.[l]).length}/${strings.length}`).join(', ');
  console.log(
    `[grammar-i18n] 완료 — 신규 ${ok}건 / 검증거부 ${JSON.stringify(rejected)} / API실패 ${failed}건 / 실패캐시로 건너뜀 ${skipped}건`,
  );
  console.log(`[grammar-i18n] 커버리지: ${cov}`);
  if (skipped || Object.keys(failedCache).length) {
    console.log(`[grammar-i18n] 반복 실패 ${Object.keys(failedCache).length}건은 영어로 표시됩니다 — 다시 시도하려면: npm run i18n:grammar -- --retry-failed`);
  }
}

main().catch(err => {
  console.warn(`[grammar-i18n] ⚠️  스크립트 오류 — 커밋은 계속 진행됩니다: ${err.message}`);
});
