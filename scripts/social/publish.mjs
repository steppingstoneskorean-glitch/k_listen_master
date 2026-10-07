// Threads / Instagram 게시 도구 (Meta 공식 API). 토큰은 .env.local 에서 읽고 절대 출력하지 않는다.
//
//   node scripts/social/publish.mjs check                      토큰·계정 확인 (읽기 전용)
//   node scripts/social/publish.mjs refresh                    두 토큰 갱신 → .env.local 갱신
//   node scripts/social/publish.mjs due [--dry-run]            승인된 초안의 schedule 중 시각이 지난 슬롯 게시
//   node scripts/social/publish.mjs publish <post-dir> [--only threads|instagram] [--dry-run]
//   node scripts/social/publish.mjs insights <post-dir>        게시물 반응 지표 → post.json 에 기록
//
// publish 는 post.json 의 status 가 "approved" 일 때만 동작한다 (사용자 검토 후 승인 시에만 변경).
// 미디어는 https://<SITE>/social/<slug>/<file> 공개 URL 로 넘기므로 먼저 배포돼 있어야 한다.
import fs from 'node:fs';
import path from 'node:path';

const ENV_FILE = '.env.local';
const SITE = 'https://k-listen-master.vercel.app';
const TH = 'https://graph.threads.net/v1.0';
const IG = 'https://graph.instagram.com/v23.0';

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
const sleep = ms => new Promise(r => setTimeout(r, ms));
const redact = s => String(s).replace(/access_token=[^&\s"]+/g, 'access_token=***');

async function api(method, url, params = {}) {
  const body = new URLSearchParams(params);
  const full = method === 'GET' ? `${url}?${body}` : url;
  const res = await fetch(full, { method, body: method === 'GET' ? undefined : body, signal: AbortSignal.timeout(60000) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`${method} ${redact(url)} → ${res.status} ${redact(JSON.stringify(json.error ?? json))}`);
  return json;
}

// ── Threads ───────────────────────────────────────────────
const th = {
  tok: () => ({ access_token: env.THREADS_ACCESS_TOKEN }),
  async container(params) {
    const { id } = await api('POST', `${TH}/${env.THREADS_USER_ID}/threads`, { ...params, ...this.tok() });
    for (let i = 0; i < 30; i++) {
      const { status, error_message } = await api('GET', `${TH}/${id}`, { fields: 'status,error_message', ...this.tok() });
      if (status === 'FINISHED') return id;
      if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Threads container ${status}: ${error_message}`);
      await sleep(3000);
    }
    throw new Error('Threads container timeout');
  },
  async publish(creation_id) {
    const { id } = await api('POST', `${TH}/${env.THREADS_USER_ID}/threads_publish`, { creation_id, ...this.tok() });
    return id;
  },
  async post({ text, imageUrl, replyTo }) {
    const params = imageUrl ? { media_type: 'IMAGE', image_url: imageUrl, text } : { media_type: 'TEXT', text };
    if (replyTo) params.reply_to_id = replyTo;
    return this.publish(await this.container(params));
  },
};

// ── Instagram ─────────────────────────────────────────────
const ig = {
  tok: () => ({ access_token: env.IG_ACCESS_TOKEN }),
  async container(params) {
    const { id } = await api('POST', `${IG}/${env.IG_USER_ID}/media`, { ...params, ...this.tok() });
    for (let i = 0; i < 60; i++) {
      const { status_code, status } = await api('GET', `${IG}/${id}`, { fields: 'status_code,status', ...this.tok() });
      if (status_code === 'FINISHED') return id;
      if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`IG container ${status_code}: ${status}`);
      await sleep(5000);
    }
    throw new Error('IG container timeout');
  },
  async publish(creation_id) {
    const { id } = await api('POST', `${IG}/${env.IG_USER_ID}/media_publish`, { creation_id, ...this.tok() });
    return id;
  },
  async carousel(imageUrls, caption) {
    const children = [];
    for (const image_url of imageUrls) children.push(await this.container({ image_url, is_carousel_item: 'true' }));
    return this.publish(await this.container({ media_type: 'CAROUSEL', children: children.join(','), caption }));
  },
  async reel(videoUrl, caption, coverUrl) {
    const params = { media_type: 'REELS', video_url: videoUrl, caption, share_to_feed: 'true' };
    if (coverUrl) params.cover_url = coverUrl;
    return this.publish(await this.container(params));
  },
};

// ── commands ──────────────────────────────────────────────
const readPost = dir => JSON.parse(fs.readFileSync(path.join(dir, 'post.json'), 'utf8'));
const writePost = (dir, post) => fs.writeFileSync(path.join(dir, 'post.json'), JSON.stringify(post, null, 2) + '\n');
const mediaUrl = (post, file) => `${SITE}/social/${post.slug}/${file}`;

async function assertReachable(urls) {
  for (const u of urls) {
    const res = await fetch(u, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
    const type = res.headers.get('content-type') ?? '';
    if (!res.ok || !/^(image|video)\//.test(type)) throw new Error(`media not deployed yet: ${u} (${res.status} ${type})`);
  }
}

async function check() {
  const t = await api('GET', `${TH}/me`, { fields: 'id,username', ...th.tok() });
  console.log('Threads  :', t.username, t.id === env.THREADS_USER_ID ? '(id ok)' : `(id MISMATCH: ${t.id})`);
  const i = await api('GET', `${IG}/me`, { fields: 'user_id,username,account_type', ...ig.tok() });
  console.log('Instagram:', i.username, i.account_type, String(i.user_id) === env.IG_USER_ID ? '(id ok)' : `(id MISMATCH: ${i.user_id})`);
}

async function refresh() {
  const t = await api('GET', `${TH}/refresh_access_token`, { grant_type: 'th_refresh_token', ...th.tok() });
  setEnv('THREADS_ACCESS_TOKEN', t.access_token);
  console.log('Threads token refreshed, expires in', Math.round(t.expires_in / 86400), 'days');
  const i = await api('GET', 'https://graph.instagram.com/refresh_access_token', { grant_type: 'ig_refresh_token', ...ig.tok() });
  setEnv('IG_ACCESS_TOKEN', i.access_token);
  console.log('Instagram token refreshed, expires in', Math.round(i.expires_in / 86400), 'days');
}

// 게시 단위: "threads:<key>" 또는 "instagram". 미지정이면 전부.
const allItems = post => [...(post.threads ?? []).map(t => `threads:${t.key}`), ...(post.instagram ? ['instagram'] : [])];

async function publish(dir, { only, dryRun, items }) {
  const post = readPost(dir);
  if (post.status !== 'approved') throw new Error(`post.json status is "${post.status}" — publish only after owner approval`);
  post.published ??= {};
  items ??= allItems(post).filter(i => !only || i.startsWith(only));
  const threadsToDo = (post.threads ?? []).filter(t => items.includes(`threads:${t.key}`));
  const doIg = items.includes('instagram');

  const igUrls = (post.instagram?.slides ?? []).map((_, i) => mediaUrl(post, `slide-${String(i + 1).padStart(2, '0')}.jpg`));
  const thUrls = threadsToDo.filter(t => t.image).map(t => mediaUrl(post, t.image));
  const vidUrls = post.instagram?.type === 'reel' ? [mediaUrl(post, post.instagram.video)] : [];
  await assertReachable([...thUrls, ...(doIg ? (vidUrls.length ? vidUrls : igUrls) : [])]);
  if (dryRun) { console.log('dry-run ok: media reachable, status approved →', items.join(', ')); return; }

  if (threadsToDo.length) {
    post.published.threads ??= {};
    for (const t of threadsToDo) {
      if (post.published.threads[t.key]) { console.log('skip threads', t.key, '(already published)'); continue; }
      const id = await th.post({ text: t.text, imageUrl: t.image && mediaUrl(post, t.image) });
      const replyIds = [];
      for (const r of t.replies ?? []) replyIds.push(await th.post({ text: r, replyTo: replyIds.at(-1) ?? id }));
      post.published.threads[t.key] = { id, replyIds, at: new Date().toISOString() };
      writePost(dir, post);
      console.log('Threads published', t.key, id);
    }
  }
  if (doIg && post.instagram && !post.published.instagram) {
    const ins = post.instagram;
    const id = ins.type === 'reel'
      ? await ig.reel(vidUrls[0], ins.caption, ins.cover && mediaUrl(post, ins.cover))
      : await ig.carousel(igUrls, ins.caption);
    const { permalink } = await api('GET', `${IG}/${id}`, { fields: 'permalink', ...ig.tok() });
    post.published.instagram = { id, permalink, at: new Date().toISOString() };
    writePost(dir, post);
    console.log('Instagram published', id, permalink);
  }
  const done = allItems(post).every(i => i === 'instagram' ? post.published.instagram : post.published.threads?.[i.slice(8)]);
  if (done) post.status = 'published';
  writePost(dir, post);
}

// 승인된 초안들의 schedule 중 시각이 지난 슬롯을 게시한다 (예약 작업이 호출).
// post.json: "schedule": [{ "at": "2026-10-08T22:00:00+09:00", "items": ["threads:quiz", "instagram"] }, ...]
async function due({ dryRun }) {
  const root = path.join('marketing', 'posts');
  let n = 0;
  for (const slug of fs.readdirSync(root).sort()) {
    const dir = path.join(root, slug);
    if (!fs.existsSync(path.join(dir, 'post.json'))) continue;
    const post = readPost(dir);
    if (post.status !== 'approved') continue;
    for (const slot of post.schedule ?? []) {
      if (new Date(slot.at) > new Date()) continue;
      const pending = slot.items.filter(i => i === 'instagram' ? !post.published?.instagram : !post.published?.threads?.[i.slice(8)]);
      if (!pending.length) continue;
      console.log(`due: ${slug} @ ${slot.at} → ${pending.join(', ')}`);
      await publish(dir, { dryRun, items: pending });
      n++;
    }
  }
  if (!n) console.log('due: nothing to publish');
}

async function insights(dir) {
  const post = readPost(dir);
  const out = { at: new Date().toISOString(), threads: {}, instagram: null };
  for (const [key, { id }] of Object.entries(post.published?.threads ?? {})) {
    const { data } = await api('GET', `${TH}/${id}/insights`, { metric: 'views,likes,replies,reposts,quotes,shares', ...th.tok() });
    out.threads[key] = Object.fromEntries(data.map(d => [d.name, d.values?.[0]?.value ?? d.total_value?.value]));
  }
  if (post.published?.instagram) {
    const { data } = await api('GET', `${IG}/${post.published.instagram.id}/insights`, { metric: 'reach,views,likes,comments,saved,shares,total_interactions', ...ig.tok() });
    out.instagram = Object.fromEntries(data.map(d => [d.name, d.values?.[0]?.value ?? d.total_value?.value]));
  }
  post.insights = [...(post.insights ?? []), out];
  writePost(dir, post);
  console.log(JSON.stringify(out, null, 2));
}

const [cmd, dir, ...rest] = process.argv.slice(2);
const onlyIdx = rest.indexOf('--only');
const opt = { only: onlyIdx >= 0 ? rest[onlyIdx + 1] : undefined, dryRun: rest.includes('--dry-run') };
try {
  if (cmd === 'check') await check();
  else if (cmd === 'refresh') await refresh();
  else if (cmd === 'publish' && dir) await publish(dir, opt);
  else if (cmd === 'insights' && dir) await insights(dir);
  else if (cmd === 'due') await due({ dryRun: [dir, ...rest].includes('--dry-run') });
  else { console.error('usage: publish.mjs check | refresh | due [--dry-run] | publish <post-dir> [--only threads|instagram] [--dry-run] | insights <post-dir>'); process.exit(1); }
} catch (e) {
  console.error('ERROR', redact(e.message));
  process.exit(1);
}
