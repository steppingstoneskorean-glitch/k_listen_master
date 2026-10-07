// 앱 화면을 SNS용 스크린샷으로 캡처한다. dev 서버(localhost:5173)가 떠 있어야 함.
// 사용: node scripts/social/capture.mjs <url-path> <out.png> [--click "텍스트"]... [--css "선택자"]... [--wait ms]
// 쿠키 배너는 'denied'로 숨기고 UI 언어는 영어로 고정한다.
import { chromium } from 'playwright';

const [, , path, out, ...rest] = process.argv;
if (!path || !out) {
  console.error('usage: capture.mjs <url-path> <out.png> [--click "text"]... [--wait ms]');
  process.exit(1);
}
const clicks = [];
let wait = 800;
for (let i = 0; i < rest.length; i++) {
  if (rest[i] === '--click') clicks.push({ text: rest[++i] });
  else if (rest[i] === '--css') clicks.push({ css: rest[++i] });
  else if (rest[i] === '--wait') wait = Number(rest[++i]);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'en-US' });
await page.addInitScript(() => {
  localStorage.setItem('cookie_consent', 'denied');
  localStorage.setItem('klisten_lang', 'en');
});
await page.goto(`http://localhost:5173${path}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(wait);
for (const c of clicks) {
  await (c.css ? page.locator(c.css).first() : page.getByText(c.text, { exact: false }).first()).click();
  await page.waitForTimeout(wait);
}
await page.screenshot({ path: out });
await browser.close();
console.log('saved', out);
