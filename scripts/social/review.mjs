// 검토용 미리보기 HTML 생성 (이미지는 base64 로 내장 — 파일 하나로 열람 가능).
// 사용: node scripts/social/review.mjs marketing/posts/<slug>  →  marketing/posts/<slug>/review.html
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: review.mjs <post-dir>'); process.exit(1); }
const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
const pub = path.join('public', 'social', post.slug);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const data = f => {
  const ext = path.extname(f).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(f).toString('base64')}`;
};

const threads = (post.threads ?? []).map((t, i) => `
  <div class="card">
    <div class="label">Threads ${i + 1} · ${esc(t.key)}</div>
    <div class="text">${esc(t.text)}</div>
    ${t.image ? `<img class="timg" src="${data(path.join(pub, t.image))}">` : ''}
    ${(t.replies ?? []).map(r => `<div class="reply">↳ 내 댓글: ${esc(r)}</div>`).join('')}
  </div>`).join('');

const slides = (post.instagram?.slides ?? []).map((_, i) =>
  `<img class="slide" src="${data(path.join(pub, `slide-${String(i + 1).padStart(2, '0')}.jpg`))}">`).join('');

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SNS 초안 검토 · ${esc(post.slug)}</title>
<style>
:root{--bg:#f6f7fb;--card:#fff;--fg:#0f172a;--mut:#64748b;--line:#e2e8f0}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#121a2e;--fg:#e2e8f0;--mut:#94a3b8;--line:#1e293b}}
body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,'Malgun Gothic',sans-serif;padding:24px 16px}
main{max-width:900px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px} h2{font-size:18px;margin:32px 0 12px}
.mut{color:var(--mut);font-size:14px}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.label{font-size:12px;font-weight:700;color:var(--mut);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
.text,.cap{white-space:pre-wrap;line-height:1.55;font-size:15px}
.reply{margin-top:10px;padding-left:12px;border-left:3px solid var(--line);color:var(--mut);font-size:14px;word-break:break-all}
.timg{margin-top:12px;max-width:260px;border-radius:10px;display:block}
.slides{display:flex;gap:10px;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x mandatory}
.slide{width:300px;flex:none;border-radius:10px;scroll-snap-align:start}
</style></head><body><main>
<h1>SNS 초안 검토</h1>
<div class="mut">${esc(post.slug)} · 주제: ${esc(post.theme)} · 상태: ${esc(post.status)}</div>
<h2>Threads (${(post.threads ?? []).length}개)</h2>${threads}
<h2>Instagram ${esc(post.instagram?.type ?? '')}</h2>
<div class="slides">${slides}</div>
<div class="card" style="margin-top:12px"><div class="label">캡션</div><div class="cap">${esc(post.instagram?.caption)}</div></div>
</main></body></html>`;

fs.writeFileSync(path.join(dir, 'review.html'), html);
console.log('wrote', path.join(dir, 'review.html'));
