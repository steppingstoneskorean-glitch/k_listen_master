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
  const brand = `<div class="brand"><span class="dot"></span>${esc(post.brand ?? 'K-Listen')}</div>`;
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

// ── Step Korean 브랜드 테마 ("design": "stepkorean") ─────────────────────────────
// 마케팅 OS 01_brand/brand_guide.md: 흰 배경, Step Blue/Purple/Red, 오른쪽 위 레벨 배지(ㄱ·ㄴ·ㄷ·ㄱㄴㄷ),
// 왼쪽 아래 로고(circle=계단: 수업·랜딩 / headphone=듣기: K-Listen·팟캐스트), 한국어 크게·번역 작게.
const SK_LEVEL = { 'ㄱ': ['Beginner', '#1E4BCD'], 'ㄴ': ['Intermediate', '#703785'], 'ㄷ': ['Advanced', '#DB1E21'], 'ㄱㄴㄷ': ['All levels', null] };
const SK_LOGO = {
  circle: path.join('marketing', 'os', '01_brand', 'logos', 'StepKorean_logo_circle.png'),
  headphone: path.join('marketing', 'os', '01_brand', 'logos', 'StepKorean_logo_color.png'),
};

function skBody(s, i, n) {
  const level = s.level ?? post.level ?? 'ㄱㄴㄷ';
  const [levelName, levelColor] = SK_LEVEL[level] ?? SK_LEVEL['ㄱㄴㄷ'];
  const badge = `<div class="lv" style="${levelColor ? `background:${levelColor}` : ''}"><b>${esc(level)}</b><span>${levelName}</span></div>`;
  const logo = `<img class="logo" src="${img(SK_LOGO[post.logo] ?? SK_LOGO.headphone)}">`;
  const pager = n > 1 && s.type !== 'hook' ? `<div class="pg">${i + 1} / ${n}</div>` : ''; // 표지는 Swipe → 자리
  const frame = inner => `${badge}${inner}${logo}${pager}<div class="bar"></div>`;
  if (s.type === 'hook') return frame(`<div class="c">${s.kicker ? `<div class="kick">${esc(s.kicker)}</div>` : ''}<h1>${s.title}</h1>${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''}</div>${n > 1 ? '<div class="swipe">Swipe →</div>' : ''}`);
  if (s.type === 'scene') return frame(`<div class="c"><div class="kick">${esc(s.kicker ?? 'The scene')}</div><p class="scene">${s.text}</p></div>`);
  if (s.type === 'phrase') return frame(`<div class="c">${s.label ? `<div class="kick">${esc(s.label)}</div>` : ''}
    <div class="tile"><div class="ko">${esc(s.ko)}</div><div class="mean">${esc(s.meaning)}</div></div>
    ${s.example ? `<div class="ex"><div class="exko">${esc(s.example)}</div><div class="exen">${esc(s.exampleEn ?? '')}</div></div>` : ''}
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>`);
  if (s.type === 'compare') return frame(`<div class="c"><h2>${s.title ?? ''}</h2>
    <div class="cmp"><div class="side old"><div class="cap">${esc(s.leftLabel ?? 'Textbook')}</div><div class="say">${esc(s.left)}</div>${s.leftEn ? `<div class="en">${esc(s.leftEn)}</div>` : ''}</div>
    <div class="side new"><div class="cap">${esc(s.rightLabel ?? 'Real life')}</div><div class="say">${esc(s.right)}</div>${s.rightEn ? `<div class="en">${esc(s.rightEn)}</div>` : ''}</div></div>
    ${s.note ? `<p class="note">${esc(s.note)}</p>` : ''}</div>`);
  if (s.type === 'blank') return frame(`<div class="c">${s.kicker ? `<div class="kick">${esc(s.kicker)}</div>` : ''}<h2>${s.title ?? ''}</h2>
    <div class="tile"><div class="ko blank">${esc(s.sentence).replace('___', '<u>&nbsp;?&nbsp;</u>')}</div>${s.meaning ? `<div class="mean">${esc(s.meaning)}</div>` : ''}</div>
    ${s.hint ? `<p class="note">${esc(s.hint)}</p>` : ''}</div>`);
  if (s.type === 'ladder') return frame(`<div class="c"><h2>${s.title ?? ''}</h2><div class="ladder">${(s.steps ?? []).map((st, k) => {
      const [nm, col] = SK_LEVEL[st.level] ?? SK_LEVEL['ㄱㄴㄷ'];
      return `<div class="step" style="margin-left:${k * 90}px;border-color:${col}"><b style="background:${col}">${esc(st.level)}</b><div><div class="sn">${nm}</div><div class="st">${esc(st.title)}</div></div></div>`;
    }).join('')}</div>${s.sub ? `<p class="sub">${esc(s.sub)}</p>` : ''}</div>`);
  if (s.type === 'shot') return frame(`<div class="shotwrap"><h2>${esc(s.title)}</h2><div class="phone"><img src="${img(s.image)}" style="object-position:0 ${s.offsetY ?? 0}%"></div>${s.sub ? `<p class="sub small">${esc(s.sub)}</p>` : ''}</div>`);
  if (s.type === 'cta') return frame(`<div class="c end"><h1>${s.title}</h1>${s.sub ? `<p class="sub light">${esc(s.sub)}</p>` : ''}<div class="pill">${esc(s.button)}</div></div>`);
  throw new Error('unknown slide type ' + s.type);
}

const skCss = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap');
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:Poppins,Pretendard,sans-serif;color:#555555;background:#FFFFFF;overflow:hidden;position:relative}
.bar{position:absolute;left:0;right:0;bottom:0;height:14px;background:linear-gradient(90deg,#1E4BCD,#703785,#DB1E21)}
.lv{position:absolute;z-index:2;top:56px;right:64px;display:flex;align-items:center;gap:14px;padding:12px 26px 12px 14px;border-radius:999px;color:#fff;background:linear-gradient(90deg,#1E4BCD,#703785,#DB1E21)}
.lv b{font-family:Pretendard;font-size:44px;font-weight:900;background:#fff3;border-radius:16px;padding:0 12px;line-height:62px}
.lv span{font-size:28px;font-weight:700;letter-spacing:.5px}
.logo{position:absolute;z-index:2;left:56px;bottom:52px;height:120px;background:#fff;border-radius:22px;padding:8px}
.pg{position:absolute;z-index:2;right:64px;bottom:62px;font-size:28px;font-weight:600;color:#9aa0a6}
.c{position:absolute;inset:180px 84px 210px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center}
.c.end{inset:0 0 0 0;padding:0 84px;background:linear-gradient(160deg,#1E4BCD,#703785 55%,#DB1E21);color:#fff}
.kick{font-size:34px;font-weight:700;color:#1E4BCD;text-transform:uppercase;letter-spacing:3px;margin-bottom:36px}
h1{font-size:96px;line-height:1.1;font-weight:800;letter-spacing:-2px;color:#222}
h1 em{font-style:normal;color:#1E4BCD}
h1 strong{color:#DB1E21}
.end h1{color:#fff}
h2{font-size:62px;line-height:1.15;font-weight:800;color:#222;margin-bottom:48px;letter-spacing:-1px}
h2 em{font-style:normal;color:#1E4BCD}
.sub{font-size:40px;line-height:1.4;margin-top:40px;font-weight:500}
.sub.small{font-size:32px;margin-top:28px}
.sub.light{color:#ffffffd9}
.swipe{position:absolute;right:64px;bottom:62px;font-size:30px;font-weight:700;color:#1E4BCD}
.scene{font-size:58px;line-height:1.35;font-weight:600;color:#333}
.scene em{font-style:normal;color:#DB1E21}
.tile{background:#EDEEF0;border-radius:36px;padding:56px 64px;width:100%}
.ko{font-family:Pretendard;font-size:112px;font-weight:900;color:#1E4BCD;letter-spacing:-2px;line-height:1.15}
.ko.blank{font-size:84px;color:#222}
.ko.blank u{text-decoration:none;display:inline-block;min-width:220px;border-bottom:8px solid #DB1E21;color:#DB1E21}
.mean{font-size:36px;margin-top:22px;font-weight:600}
.ex{margin-top:44px}
.exko{font-family:Pretendard;font-size:52px;font-weight:800;color:#222}
.exen{font-size:32px;margin-top:12px}
.note{font-size:34px;line-height:1.45;margin-top:40px;max-width:880px}
.cmp{display:flex;flex-direction:column;gap:28px;width:100%}
.side{border-radius:32px;padding:40px 48px;text-align:left}
.side.old{background:#EDEEF0}
.side.new{background:#1E4BCD;color:#fff}
.cap{font-size:28px;font-weight:700;text-transform:uppercase;letter-spacing:3px;opacity:.75}
.say{font-family:Pretendard;font-size:72px;font-weight:900;margin-top:10px;letter-spacing:-1px}
.side.old .say{color:#555;text-decoration:line-through;text-decoration-color:#DB1E21;text-decoration-thickness:6px}
.en{font-size:30px;margin-top:8px}
.ladder{display:flex;flex-direction:column-reverse;gap:26px;width:100%;align-items:flex-start}
.step{display:flex;align-items:center;gap:26px;border:5px solid;border-radius:28px;padding:22px 34px 22px 22px;background:#fff;text-align:left}
.step b{font-family:Pretendard;color:#fff;font-size:52px;font-weight:900;border-radius:18px;width:84px;height:84px;display:flex;align-items:center;justify-content:center}
.sn{font-size:26px;font-weight:700;text-transform:uppercase;letter-spacing:2px;opacity:.7}
.st{font-size:38px;font-weight:700;color:#222}
.shotwrap{position:absolute;inset:170px 84px 200px;display:flex;flex-direction:column;align-items:center;text-align:center}
.phone{width:620px;flex:1;border-radius:44px;border:12px solid #222;overflow:hidden;box-shadow:0 30px 80px #0003;background:#fff}
.phone img{width:100%;height:100%;object-fit:cover}
.pill{margin-top:56px;padding:28px 64px;border-radius:999px;background:#fff;color:#DB1E21;font-size:42px;font-weight:800}
`;

const brand = post.design === 'stepkorean';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
const slides = post.instagram.slides;
for (const [i, s] of slides.entries()) {
  const html = brand ? skBody(s, i, slides.length) : body(s, i, slides.length);
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${brand ? skCss : css}</style></head><body>${html}</body></html>`, { waitUntil: 'networkidle' });
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
