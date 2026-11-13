// 팟캐스트 클립형 쇼츠 만들기 — 에피소드 설정 JSON 하나로 영상 완성
//   node scripts/social/shorts/make-short.mjs marketing/shorts/<slug>.json            → public/social/<slug>/reel.mp4 + cover.jpg
//   node scripts/social/shorts/make-short.mjs marketing/shorts/<slug>.json --stills 1,7.5,15   → 확인용 정지 화면만 (임시 폴더)
// 필요: playwright(루트 node_modules), python + numpy + imageio-ffmpeg (ffmpeg 경로). 원본 팟캐스트 영상은 assets/ (커밋 안 함).
// 설정 형식은 scripts/social/shorts/README.md 참고.
import { chromium } from 'playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const specFile = argv.find(a => !a.startsWith('--'));
if (!specFile) { console.error('usage: make-short.mjs <spec.json> [--stills t1,t2,...]'); process.exit(1); }
const stillsArg = argv.includes('--stills') ? argv[argv.indexOf('--stills') + 1].split(',').map(Number) : null;

const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const pub = path.join('public', 'social', spec.slug);
const work = path.join(os.tmpdir(), `short-${spec.slug}`);
fs.mkdirSync(work, { recursive: true });
const PY = process.env.PYTHON || 'python';
const FF = process.env.FFMPEG || execFileSync(PY, ['-c', 'import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())']).toString().trim();
const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] }).toString();
const fileUrl = p => pathToFileURL(path.resolve(p)).href;

// 1) 원본에서 목소리 구간 잘라 이어 붙이기
const voice = path.join(work, 'voice.wav');
const clips = spec.clips;
const filter = clips.map(([a, b], i) => `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS[a${i}]`).join(';')
  + ';' + clips.map((_, i) => `[a${i}]`).join('') + `concat=n=${clips.length}:v=0:a=1,aformat=sample_rates=48000:channel_layouts=mono[o]`;
run(FF, ['-y', '-loglevel', 'error', '-i', spec.source, '-filter_complex', filter, '-map', '[o]', voice]);
const durMatch = /Duration: (\d+):(\d+):([\d.]+)/.exec(spawnSync(FF, ['-i', spec.source]).stderr.toString());
const sourceLength = durMatch ? +durMatch[1] * 3600 + +durMatch[2] * 60 + +durMatch[3] : 0;

// 2) 목소리 분석: 끝 시각 + 30fps 음량
const envFile = path.join(work, 'env.json');
const an = JSON.parse(run(PY, [path.join(here, 'mix.py'), 'analyze', voice, envFile]));
const env = JSON.parse(fs.readFileSync(envFile, 'utf8'));
const clipLen = clips.reduce((s, [a, b]) => s + b - a, 0);
if (an.speechEnd > clipLen - .15) console.warn(`⚠ 마지막 구간이 말하는 도중에 끝나요 (끝 ${an.speechEnd}s / 클립 ${clipLen.toFixed(2)}s). clips 마지막 끝 시각을 늘려 주세요.`);
const STOP = +(an.speechEnd + .2).toFixed(2);
const FULL = +(STOP + (spec.hold ?? 1.5)).toFixed(2);
const DUR = +(FULL + (spec.endCard ?? 3.5)).toFixed(2);

// 3) 노래방 자막 단어 시각: 직접 준 at[] 이 없으면 목소리 구간에 음절 수 비율로 자동 배분 (추정치)
const syl = w => Math.max(1, (w.match(/[가-힣]/g) ?? []).length);
const lines = spec.lines.map((l, li) => {
  const to = l.to === 'end' || l.to == null ? FULL : l.to;
  const words = [];
  l.ko.split('/').forEach((part, pi) => {
    if (pi) words.push({ br: true });
    part.trim().split(/\s+/).filter(Boolean).forEach(text => words.push({ text, key: !!(l.key && text.includes(l.key)) }));
  });
  const real = words.filter(w => !w.br);
  if (Array.isArray(l.at)) real.forEach((w, i) => { w.at = l.at[i] ?? l.from; });
  else {
    const voiced = [];
    for (let f = Math.floor(l.from * 30); f < Math.min(to * 30, env.length); f++) if (env[f] > .12) voiced.push(f / 30);
    // 줄바꿈(/) 경계를 목소리의 쉼(0.3초 이상)에 맞춘다 → 각 덩어리 안에서 음절 비율로 배분
    const parts = []; let cur = [];
    words.forEach(w => { if (w.br) { parts.push(cur); cur = []; } else cur.push(w); }); parts.push(cur);
    const total = real.reduce((s, w) => s + syl(w.text), 0);
    const at = frac => voiced[Math.min(voiced.length - 1, Math.floor(frac * voiced.length))];
    let acc = 0;
    const bounds = parts.slice(0, -1).map(pt => { acc += pt.reduce((s, w) => s + syl(w.text), 0); return { frac: acc / total, t: at(acc / total), snap: null }; });
    const gaps = voiced.slice(1).map((v, i) => ({ a: voiced[i], b: v, len: v - voiced[i] })).filter(g => g.len >= .3).sort((x, y) => y.len - x.len);
    for (const g of gaps.slice(0, bounds.length)) {
      const free = bounds.filter(bd => !bd.snap);
      if (!free.length) break;
      free.sort((x, y) => Math.abs(x.t - g.b) - Math.abs(y.t - g.b))[0].snap = g.b;
    }
    // 덩어리별 시간 범위 [시작, 끝)
    const edges = [voiced[0] ?? l.from, ...bounds.map(bd => bd.snap ?? bd.t), Infinity];
    parts.forEach((pt, pi) => {
      const v = voiced.filter(x => x >= edges[pi] && x < edges[pi + 1]);
      const tot = pt.reduce((s, w) => s + syl(w.text), 0); let a2 = 0;
      pt.forEach(w => { w.at = v.length ? v[Math.min(v.length - 1, Math.floor(a2 / tot * v.length))] : edges[pi]; a2 += syl(w.text); });
    });
    if (!voiced.length) real.forEach(w => { w.at = l.from; });
  }
  console.log(`  line ${li + 1}: ${real.map(w => `${w.text}@${w.at.toFixed(2)}`).join(' ')}`);
  return { from: l.from, to, en: l.en, words };
});

const SPEC = {
  episode: spec.episode, clips, sourceLength, STOP, FULL,
  scenes: spec.scenes.map(s => ({ ...s, url: fileUrl(path.join(pub, s.image)) })),
  lines, chips: spec.chips ?? [],
  logoUrl: fileUrl(spec.logo ?? 'marketing/os/01_brand/logos/StepKorean_logo_circle.png'),
  cta: spec.cta ?? ['Full episode', 'Link in bio'],
  handle: spec.handle ?? '@step.korean',
};

// 4) 화면 렌더
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(fileUrl(path.join(here, 'template.html')), { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.evaluate(s => window.setup(s), SPEC);
const frames = path.join(work, stillsArg ? 'stills' : 'frames');
fs.rmSync(frames, { recursive: true, force: true }); fs.mkdirSync(frames, { recursive: true });
const times = stillsArg ?? Array.from({ length: Math.round(DUR * 30) }, (_, i) => i / 30);
for (const [i, t] of times.entries()) {
  await p.evaluate(([t, e]) => window.render(t, e), [t, env[Math.round(t * 30)] ?? 0]);
  await p.screenshot({ path: path.join(frames, stillsArg ? `s${t}.jpg` : `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
}
await b.close();
console.log(`STOP ${STOP}s · FULL ${FULL}s · DUR ${DUR}s`);
if (stillsArg) { console.log('stills →', frames); process.exit(0); }

// 5) 오디오 믹스 + 인코딩
const mixWav = path.join(work, 'mix.wav');
run(PY, [path.join(here, 'mix.py'), 'mix', voice, mixWav, String(DUR), String(FULL)]);
const out = path.join(pub, spec.out ?? 'reel.mp4');
run(FF, ['-y', '-loglevel', 'error', '-framerate', '30', '-i', path.join(frames, 'f%04d.jpg'), '-i', mixWav,
  '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-color_range', 'tv', '-af', 'volume=2dB,alimiter=limit=0.89:attack=5:release=50',
  '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]);
const coverAt = Math.min(Math.round((spec.coverAt ?? 3.5) * 30), times.length - 1);
fs.copyFileSync(path.join(frames, `f${String(coverAt).padStart(4, '0')}.jpg`), path.join(pub, 'cover.jpg'));
const lufs = /I:\s+(-?[\d.]+) LUFS/.exec(spawnSync(FF, ['-i', out, '-af', 'ebur128', '-f', 'null', '-'], { maxBuffer: 1 << 26 }).stderr.toString().split('Summary:').pop());
console.log(`wrote ${out} (${DUR}s, ${lufs ? lufs[1] + ' LUFS' : '?'}) + cover.jpg`);
