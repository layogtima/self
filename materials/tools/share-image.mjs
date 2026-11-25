/**
 * Regenerates share.png, the image link previews use, by photographing the real hero.
 * Keeping it in the repo rather than a scratch file means it survives, and the image can
 * never drift far from what the page actually looks like.
 *
 *   (cd .. && python3 -m http.server 8642 &)
 *   NODE_PATH=/tmp/matsmoke/node_modules node tools/share-image.mjs
 */
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE || 'http://localhost:8642/materials/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'share.png');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });

  const offsite = [];
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith('http://localhost') && !u.startsWith('data:')) offsite.push(u);
  });

  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__mat !== undefined');
  await sleep(2500);

  // Hide the chrome so the card is the hero and its counter, nothing else.
  await page.evaluate(() => {
    for (const sel of ['#nav', '.cta']) {
      const el = document.querySelector(sel);
      if (el) el.style.visibility = 'hidden';
    }
  });
  await sleep(1200);
  await page.screenshot({ path: OUT });

  console.log(`wrote ${OUT}`);
  console.log(offsite.length ? `WARNING: ${offsite.length} third-party requests` : 'no third-party requests');
} finally {
  await browser.close();
}
