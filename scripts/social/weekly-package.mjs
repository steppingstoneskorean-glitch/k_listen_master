// 주간 업로드 패키지: 앞으로 7일 동안 올릴 승인된 게시물을 한 페이지로 정리한다 (텔레그램 대신 Claude 앱에서 보여 줌).
//   node scripts/social/weekly-package.mjs [--from YYYY-MM-DD]   (기본: 내일부터 7일, 한국 시간)
// 결과: marketing/weekly/<시작일>.html — 이미지 base64 내장, 날짜순 카드(캡션·첫 댓글·링크 복사 버튼). gitignore 대상.
// 오너가 직접 업로드한다 — 이 스크립트는 아무것도 게시하거나 보내지 않는다.
import fs from 'node:fs';
import path from 'node:path';

const POSTS = path.join('marketing', 'posts');
const OUT = path.join('marketing', 'weekly');
const DAY = 864e5;

const kst = d => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const fromArg = process.argv.indexOf('--from');
const start = fromArg > 0 ? process.argv[fromArg + 1] : kst(new Date(Date.now() + DAY));
const startMs = new Date(`${start}T00:00:00+09:00`).getTime();
const days = Array.from({ length: 7 }, (_, i) => kst(new Date(startMs + i * DAY)));

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const data = f => `data:image/${path.extname(f).slice(1).replace('jpg', 'jpeg')};base64,${fs.readFileSync(f).toString('base64')}`;
const dayLabel = d => new Date(`${d}T12:00:00+09:00`).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', weekday: 'short' });
const timeLabel = at => new Date(at).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });
const copyBox = (label, text) => `<div class="box"><div class="bh"><span>${esc(label)}</span><button onclick="cp(this)">복사</button></div><pre>${esc(text)}</pre></div>`;

const posts = fs.readdirSync(POSTS).sort()
  .filter(slug => fs.existsSync(path.join(POSTS, slug, 'post.json')))
  .map(slug => JSON.parse(fs.readFileSync(path.join(POSTS, slug, 'post.json'), 'utf8')));

const slots = posts.flatMap(post => (post.schedule ?? []).map(s => ({ post, at: s.at, items: s.items, day: kst(new Date(s.at)) })))
  .filter(s => days.includes(s.day))
  .sort((a, b) => new Date(a.at) - new Date(b.at));

const itemHtml = (post, item) => {
  const pub = path.join('public', 'social', post.slug);
  if (item === 'instagram') {
    const ins = post.instagram;
    const files = ins.type === 'reel'
      ? [ins.cover].filter(Boolean).map(f => path.join(pub, f))
      : fs.readdirSync(pub).filter(f => /^slide-\d+\.jpg$/.test(f)).sort().map(f => path.join(pub, f));
    return `<h3>Instagram ${ins.type === 'reel' ? '릴스' : `캐러셀 · ${files.length}장`}</h3>
      <div class="mut">파일: ${ins.type === 'reel' ? esc(path.join(pub, ins.video)) : esc(pub)}\\slide-01…${String(files.length).padStart(2, '0')}.jpg (순서대로)</div>
      <div class="slides">${files.map(f => `<img src="${data(f)}">`).join('')}</div>
      ${copyBox('캡션', ins.caption)}`;
  }
  const t = post.threads.find(x => x.key === item.slice(8));
  const img = t.image ? path.join(pub, t.image) : null;
  return `<h3>Threads · ${esc(t.key)}${img ? ' + 이미지' : ''}</h3>
    ${img && fs.existsSync(img) ? `<img class="timg" src="${data(img)}">` : ''}
    ${copyBox('본문', t.text)}
    ${(t.replies ?? []).map(r => copyBox('첫 댓글 (본인 답글)', r)).join('')}`;
};

const slotHtml = ({ post, at, items }) => `<div class="card${post.status === 'approved' ? '' : ' wait'}">
  <div class="top"><b>${timeLabel(at)}</b>
    ${post.creative?.id ? `<span class="tag">${esc(post.creative.name ?? post.creative.id)}</span>` : ''}
    ${post.status === 'approved' ? '' : `<span class="tag warn">${esc(post.status)} — 승인 전</span>`}</div>
  ${items.map(i => itemHtml(post, i)).join('')}
  ${Object.keys(post.links ?? {}).length ? `<details><summary>프로필·스토리 링크 (UTM)</summary>${Object.entries(post.links).map(([p, u]) => copyBox(p, u)).join('')}</details>` : ''}
</div>`;

const body = days.map(d => {
  const list = slots.filter(s => s.day === d);
  return `<section><h2>${dayLabel(d)}</h2>${list.length ? list.map(slotHtml).join('') : '<div class="empty">올릴 게시물 없음</div>'}</section>`;
}).join('');

const approved = slots.filter(s => s.post.status === 'approved').length;
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>주간 SNS 업로드 ${esc(start)}</title>
<style>
:root{--bg:#f6f7fb;--card:#fff;--fg:#0f172a;--mut:#64748b;--line:#e2e8f0;--acc:#1E4BCD;--warn:#b45309}
@media (prefers-color-scheme:dark){:root{--bg:#0b1020;--card:#121a2e;--fg:#e2e8f0;--mut:#94a3b8;--line:#1e293b;--acc:#7da2ff;--warn:#fbbf24}}
body{margin:0;background:var(--bg);color:var(--fg);font-family:system-ui,'Malgun Gothic',sans-serif;padding:24px 16px}
main{max-width:900px;margin:0 auto}
h1{font-size:22px;margin:0 0 4px} h2{font-size:18px;margin:28px 0 10px} h3{font-size:15px;margin:16px 0 6px}
.mut{color:var(--mut);font-size:13px;word-break:break-all}
.card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px}
.card.wait{border-style:dashed;opacity:.75}
.top{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.tag{font-size:12px;background:var(--bg);border-radius:6px;padding:2px 8px;color:var(--mut)} .tag.warn{color:var(--warn)}
.empty{color:var(--mut);font-size:14px;padding:4px 0 8px}
.slides{display:flex;gap:10px;overflow-x:auto;padding:6px 0 8px;scroll-snap-type:x mandatory}
.slides img{width:240px;flex:none;border-radius:10px;scroll-snap-align:start}
.timg{max-width:240px;border-radius:10px;display:block;margin-bottom:8px}
.box{border:1px solid var(--line);border-radius:10px;margin-top:8px;overflow:hidden}
.bh{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--mut);padding:6px 10px;background:var(--bg)}
.bh button{font:inherit;border:1px solid var(--line);background:var(--card);color:var(--fg);border-radius:6px;padding:2px 10px;cursor:pointer}
pre{margin:0;padding:10px;white-space:pre-wrap;word-break:break-word;font:14px/1.55 system-ui,'Malgun Gothic',sans-serif}
details{margin-top:12px} summary{cursor:pointer;font-size:13px;color:var(--acc)}
</style></head><body><main>
<h1>주간 SNS 업로드 · ${dayLabel(days[0])} ~ ${dayLabel(days[6])}</h1>
<div class="mut">승인된 게시물 ${approved}개 · 권장 게시 시각 22:00 · 직접 업로드용 (자동 게시 없음)</div>
${body}
</main><script>
function cp(b){const t=b.closest('.box').querySelector('pre').innerText;
  (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>{b.textContent='복사됨';setTimeout(()=>b.textContent='복사',1500)},()=>{b.textContent='길게 눌러 복사'})}
</script></body></html>`;

fs.mkdirSync(OUT, { recursive: true });
const file = path.join(OUT, `${start}.html`);
fs.writeFileSync(file, html);
console.log('wrote', file, '| slots', slots.length, '| approved', approved);
