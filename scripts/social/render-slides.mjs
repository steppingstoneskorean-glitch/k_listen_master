// post.json 의 instagram.slides 를 1080×1350 JPEG 로 렌더링해 public/social/<slug>/ 에 저장한다.
// 사용: node scripts/social/render-slides.mjs marketing/posts/<slug>
// (Instagram API 는 JPEG 만 받으므로 JPEG 로 출력)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const dir = process.argv[2];
if (!dir) { console.error('usage: render-slides.mjs <post-dir>'); process.exit(1); }
const post = JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
const outDir = path.join('public', 'social', post.slug);
fs.mkdirSync(outDir, { recursive: true });

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const img = p => `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;

const BADGE = { pause: ['Pause', '#f59e0b'], carry: ['Carry', '#22d3ee'], change: ['Change', '#a78bfa'], reading: ['Reading', '#34d399'] };

function body(s, i, n) {
  const pager = `<div class="pager">${i + 1} / ${n}</div>`;
  const brand = `<div class="brand"><span class="dot"></span>K-Listen</div>`;
  if (s.type === 'hook') return `${brand}
    <div class="center"><div class="kicker">${esc(s.kicker)}</div><h1>${s.title}</h1><p class="sub">${esc(s.sub)}</p></div>
    <div class="swipe">Swipe →</div>`;
  if (s.type === 'word') {
    const [label, color] = BADGE[s.badge] ?? ['', '#999'];
    // 대괄호 포함 글자 수에 맞춰 크기 축소 (한 줄 유지)
    const len = Math.max([...s.written].length, [...s.heard].length + 1);
    const size = len <= 3 ? 150 : len <= 4 ? 118 : 96;
    return `${brand}${pager}
    <div class="center">
      <div class="meaning">${esc(s.meaning)}</div>
      <div class="row"><div class="col"><div class="cap">Written</div><div class="ko" style="font-size:${size}px">${esc(s.written)}</div></div>
        <div class="arrow">→</div>
        <div class="col"><div class="cap hl">Heard</div><div class="ko heard" style="font-size:${size}px">[${esc(s.heard)}]</div></div></div>
      <div class="badge" style="--c:${color}">${label}</div>
      <p class="why">${esc(s.why)}</p>
    </div>`;
  }
  if (s.type === 'shot') return `${brand}${pager}
    <div class="shotwrap"><h2>${esc(s.title)}</h2><div class="phone"><img src="${img(s.image)}" style="object-position:0 ${s.offsetY ?? 0}%"></div><p class="sub small">${esc(s.sub)}</p></div>`;
  if (s.type === 'cta') return `${brand}
    <div class="center"><h1 class="cta">${s.title}</h1><p class="sub">${esc(s.sub)}</p><div class="pill">${esc(s.button)}</div></div>`;
  throw new Error('unknown slide type ' + s.type);
}

const css = `
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:Pretendard,sans-serif;color:#f1f5f9;overflow:hidden;
 background:radial-gradient(1200px 800px at 85% -10%,#1e3a8a55,transparent 60%),radial-gradient(900px 700px at -10% 110%,#6d28d955,transparent 60%),#050816;
 position:relative;padding:90px 84px}
.brand{position:absolute;top:64px;left:84px;font-weight:800;font-size:34px;letter-spacing:.5px;display:flex;align-items:center;gap:14px}
.dot{width:22px;height:22px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#06b6d4)}
.pager{position:absolute;top:66px;right:84px;font-size:30px;color:#64748b;font-weight:600}
.center{position:absolute;inset:170px 84px 150px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.kicker{font-size:38px;color:#67e8f9;font-weight:700;margin-bottom:34px}
h1{font-size:92px;line-height:1.12;font-weight:900;letter-spacing:-2px}
h1 em{font-style:normal;background:linear-gradient(90deg,#3b82f6,#06b6d4);-webkit-background-clip:text;color:transparent}
h1.cta{font-size:84px}
.sub{font-size:40px;color:#cbd5e1;margin-top:40px;line-height:1.4;font-weight:500}
.sub.small{font-size:34px;margin-top:34px}
.swipe{position:absolute;bottom:80px;right:84px;font-size:34px;color:#94a3b8;font-weight:700}
.meaning{font-size:38px;color:#94a3b8;margin-bottom:46px;font-weight:600}
.row{display:flex;align-items:center;gap:40px}
.col{display:flex;flex-direction:column;align-items:center;gap:18px}
.cap{font-size:30px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:3px}
.cap.hl{color:#67e8f9}
.ko{font-size:150px;font-weight:900;letter-spacing:-3px;white-space:nowrap}
.ko.heard{color:#4ade80}
.arrow{font-size:90px;color:#475569;margin-top:40px}
.badge{margin-top:64px;padding:12px 34px;border-radius:999px;border:3px solid var(--c);color:var(--c);font-size:34px;font-weight:800}
.why{margin-top:34px;font-size:40px;line-height:1.45;color:#e2e8f0;max-width:860px;font-weight:500}
.shotwrap{position:absolute;inset:150px 84px 70px;display:flex;flex-direction:column;align-items:center;text-align:center}
h2{font-size:60px;font-weight:900;line-height:1.15;letter-spacing:-1px;margin-bottom:40px}
.phone{width:720px;height:806px;border-radius:44px;border:12px solid #1e293b;overflow:hidden;box-shadow:0 30px 80px #0008;background:#030712}
.phone img{width:100%;height:100%;object-fit:cover}
.pill{margin-top:60px;padding:28px 60px;border-radius:999px;background:linear-gradient(90deg,#6366f1,#a855f7);font-size:42px;font-weight:800}
`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const slides = post.instagram.slides;
for (const [i, s] of slides.entries()) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body(s, i, slides.length)}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 90 });
  console.log('rendered', file);
}
await browser.close();

// Threads 글에 붙일 이미지도 같은 공개 폴더로 복사
for (const t of post.threads ?? []) {
  if (!t.image) continue;
  fs.copyFileSync(path.join(dir, t.image), path.join(outDir, t.image));
  console.log('copied', path.join(outDir, t.image));
}
