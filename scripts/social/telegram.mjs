// 오너에게 매일 업로드 패키지를 텔레그램으로 보내는 도구 (Telegram Bot API). 토큰은 .env.local 에서 읽고 절대 출력하지 않는다.
//
//   node scripts/social/telegram.mjs chatid                     봇에게 보낸 메시지에서 chat id 확인 → TELEGRAM_CHAT_ID 로 저장
//   node scripts/social/telegram.mjs send <daily.md> [media...] 패키지 전송: 설명 → 코드블록마다 따로(복사용) → 미디어(원본 화질 파일)
//
// .env.local: TELEGRAM_BOT_TOKEN=<BotFather 토큰>, TELEGRAM_CHAT_ID=<chatid 결과>
import fs from 'node:fs';
import path from 'node:path';

const ENV_FILE = '.env.local';

function loadEnv() {
  return Object.fromEntries(fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)
    .map(l => l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)).filter(Boolean)
    .map(m => [m[1], m[2].replace(/^["']|["']$/g, '')]));
}
function setEnv(key, value) {
  const src = fs.readFileSync(ENV_FILE, 'utf8');
  const re = new RegExp(`^${key}=.*$`, 'm');
  fs.writeFileSync(ENV_FILE, re.test(src) ? src.replace(re, `${key}=${value}`) : `${src.trimEnd()}\n${key}=${value}\n`);
}
const env = loadEnv();
const TOKEN = env.TELEGRAM_BOT_TOKEN?.replace(/\s/g, ''); // 폰→PC 복사 시 끼는 공백 제거
if (!TOKEN) { console.error('ERROR .env.local 에 TELEGRAM_BOT_TOKEN 이 없습니다'); process.exit(1); }
const API = `https://api.telegram.org/bot${TOKEN}`;
const redact = s => String(s).split(TOKEN).join('<token>');

async function call(method, body) {
  const res = await fetch(`${API}/${method}`, body instanceof FormData
    ? { method: 'POST', body }
    : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  const json = await res.json().catch(() => ({}));
  if (!json.ok) throw new Error(redact(`${method} → ${res.status} ${json.description ?? ''}`));
  return json.result;
}

// md 를 [설명 텍스트, 코드블록 내용, ...] 메시지 목록으로 나눈다. 코드블록은 한 메시지 = 그대로 복사해 붙여넣을 글.
function splitMarkdown(md) {
  const out = [];
  let buf = [], inCode = false;
  const flush = () => { const t = buf.join('\n').trim(); if (t) out.push(t); buf = []; };
  for (const line of md.split(/\r?\n/)) {
    if (/^```/.test(line)) { flush(); inCode = !inCode; continue; }
    buf.push(line);
  }
  flush();
  return out;
}

const MEDIA_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp4': 'video/mp4', '.mov': 'video/quicktime' };

async function sendMedia(chatId, files) {
  // 원본 화질 유지를 위해 document 로 보낸다 (sendMediaGroup 은 최대 10개)
  for (let i = 0; i < files.length; i += 10) {
    const chunk = files.slice(i, i + 10);
    const form = new FormData();
    form.append('chat_id', chatId);
    if (chunk.length === 1) {
      const f = chunk[0];
      form.append('document', new Blob([fs.readFileSync(f)], { type: MEDIA_EXT[path.extname(f).toLowerCase()] }), path.basename(f));
      await call('sendDocument', form);
      continue;
    }
    form.append('media', JSON.stringify(chunk.map((f, j) => ({ type: 'document', media: `attach://f${j}` }))));
    chunk.forEach((f, j) => form.append(`f${j}`, new Blob([fs.readFileSync(f)], { type: MEDIA_EXT[path.extname(f).toLowerCase()] }), path.basename(f)));
    await call('sendMediaGroup', form);
  }
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === 'chatid') {
    const updates = await call('getUpdates');
    const chats = [...new Map(updates.map(u => u.message?.chat).filter(Boolean).map(c => [c.id, c])).values()];
    if (!chats.length) { console.log('봇에게 아무 메시지(/start)를 먼저 보낸 뒤 다시 실행하세요.'); process.exit(1); }
    for (const c of chats) console.log(`chat ${c.id} ${c.type} ${c.username ?? c.first_name ?? ''}`);
    if (chats.length === 1) { setEnv('TELEGRAM_CHAT_ID', chats[0].id); console.log('TELEGRAM_CHAT_ID 저장됨'); }
  } else if (cmd === 'send') {
    const [mdFile, ...media] = args;
    const chatId = env.TELEGRAM_CHAT_ID;
    if (!chatId) throw new Error('.env.local 에 TELEGRAM_CHAT_ID 가 없습니다 (chatid 먼저 실행)');
    const missing = media.filter(f => !fs.existsSync(f) || !MEDIA_EXT[path.extname(f).toLowerCase()]);
    if (missing.length) throw new Error(`미디어 파일 없음/미지원: ${missing.join(', ')}`);
    const parts = splitMarkdown(fs.readFileSync(mdFile, 'utf8'));
    for (const text of parts) {
      for (let i = 0; i < text.length; i += 4000) await call('sendMessage', { chat_id: chatId, text: text.slice(i, i + 4000), disable_web_page_preview: true });
    }
    if (media.length) await sendMedia(chatId, media);
    console.log(`sent ${parts.length} messages + ${media.length} media`);
  } else {
    console.log('usage: telegram.mjs chatid | send <daily.md> [media...]');
    process.exit(1);
  }
} catch (e) {
  console.error('ERROR', redact(e.message));
  process.exit(1);
}
