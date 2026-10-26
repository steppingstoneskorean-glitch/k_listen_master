// 매일 업로드 패키지: 승인된 초안에서 아직 안 넘긴 슬롯 하나를 골라 marketing/daily/<date>.md 를 만들고
// 텔레그램으로 보낸다. AI 없이 결정적으로 동작 — GitHub Actions(PC 꺼져 있어도) 와 로컬 모두에서 실행 가능.
//
//   node scripts/social/daily-package.mjs [--dry-run]     (--dry-run: md 만 만들고 전송·기록 안 함)
//
// 하루 한 번만 보낸다: marketing/daily/<date>.md 에 `<!-- telegram-sent -->` 가 있으면 즉시 종료.
// 넘긴 슬롯은 marketing/daily/handoffs.json 에 기록 (post.json 의 status 는 절대 바꾸지 않는다).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const POSTS = path.join('marketing', 'posts');
const DAILY = path.join('marketing', 'daily');
const HANDOFFS = path.join(DAILY, 'handoffs.json');
const MARK = '<!-- telegram-sent -->';
const dryRun = process.argv.includes('--dry-run');

const kst = d => new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10);
const today = kst(new Date());
const fmtDay = iso => { const d = new Date(iso); return `${kst(d).slice(5).replace('-', '/')}`; };
const mdFile = path.join(DAILY, `${today}.md`);

if (fs.existsSync(mdFile) && fs.readFileSync(mdFile, 'utf8').includes(MARK)) {
  console.log('오늘 전송 완료됨');
  process.exit(0);
}

const handoffs = fs.existsSync(HANDOFFS) ? JSON.parse(fs.readFileSync(HANDOFFS, 'utf8')) : {};
const posts = fs.readdirSync(POSTS).sort()
  .filter(slug => fs.existsSync(path.join(POSTS, slug, 'post.json')))
  .map(slug => JSON.parse(fs.readFileSync(path.join(POSTS, slug, 'post.json'), 'utf8')));

const isDone = (post, item) => handoffs[`${post.slug}:${item}`]
  || (item === 'instagram' ? post.published?.instagram : post.published?.threads?.[item.slice(8)]);

// 승인된 초안의 남은 슬롯 (시각 순)
const slots = posts.filter(p => p.status === 'approved')
  .flatMap(post => (post.schedule ?? []).map(s => ({ post, at: s.at, items: s.items.filter(i => !isDone(post, i)) })))
  .filter(s => s.items.length)
  .sort((a, b) => new Date(a.at) - new Date(b.at));

const block = text => ['```', text, '```'].join('\n');
const lines = [];
const media = [];

if (!slots.length) {
  const drafts = posts.filter(p => p.status === 'draft').map(p => `- ${p.slug}`);
  lines.push(`# ${today} 업로드 안내`, '', '오늘 업로드할 승인된 게시물이 없습니다.', '');
  lines.push(drafts.length
    ? ['검토/승인을 기다리는 초안:', ...drafts, '', 'Claude 앱에서 초안을 검토하고 "승인"해 주시면 다음 날부터 보내드립니다.'].join('\n')
    : '대기 중인 초안도 없습니다. 다음 초안 작업을 기다려 주세요.');
} else {
  const { post, at, items } = slots[0];
  lines.push(`# ${today} 직접 업로드용`, '', `출처: ${post.slug} (예정일 ${fmtDay(at)}) · 권장 게시 시각: 오늘 22:00`, '');
  for (const item of items) {
    if (item === 'instagram') {
      const ins = post.instagram;
      const pub = path.join('public', 'social', post.slug);
      const files = ins.type === 'reel'
        ? [ins.video, ins.cover].filter(Boolean).map(f => path.join(pub, f))
        : fs.readdirSync(pub).filter(f => /^slide-\d+\.jpg$/.test(f)).sort().map(f => path.join(pub, f));
      media.push(...files);
      lines.push(`## Instagram ${ins.type === 'reel' ? '릴스' : `캐러셀 (${files.length}장, 순서대로)`}`,
        `파일: ${files.map(f => path.basename(f)).join(', ')}`, '', '캡션:', block(ins.caption), '');
    } else {
      const t = post.threads.find(x => x.key === item.slice(8));
      const img = t.image ? path.join(POSTS, post.slug, t.image) : null;
      if (img) media.push(img);
      lines.push(`## Threads${img ? ' + 이미지' : ' (텍스트만)'} · ${t.key}`, ...(img ? [`이미지: ${path.basename(img)}`] : []), '', block(t.text), '');
      for (const r of t.replies ?? []) lines.push('첫 댓글(본인 답글):', block(r), '');
    }
  }
  const left = slots.length - 1;
  lines.push(`남은 승인 슬롯: ${left}개${left < 2 ? ' — 새 초안 승인이 필요해요' : ''}`);
}

fs.mkdirSync(DAILY, { recursive: true });
fs.writeFileSync(mdFile, lines.join('\n').trimEnd() + '\n');
console.log('wrote', mdFile, '| media', media.length);
if (dryRun) { console.log(fs.readFileSync(mdFile, 'utf8')); process.exit(0); }

execFileSync(process.execPath, [path.join('scripts', 'social', 'telegram.mjs'), 'send', mdFile, ...media], { stdio: 'inherit' });

fs.appendFileSync(mdFile, `\n${MARK}\n`);
if (slots.length) {
  for (const item of slots[0].items) handoffs[`${slots[0].post.slug}:${item}`] = today;
  fs.writeFileSync(HANDOFFS, JSON.stringify(handoffs, null, 2) + '\n');
}
console.log('telegram sent + recorded');
