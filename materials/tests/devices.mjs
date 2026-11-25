/**
 * Layout across the shapes of screen this actually meets, including the one that caused a
 * bug report: an Android phone with Chrome's "Desktop site" ticked, which reports 980px.
 * Run like smoke.mjs: NODE_PATH=/tmp/matsmoke/node_modules node tests/devices.mjs
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE || 'http://localhost:8642/materials/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const failures = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'],
});

const CASES = [
  ['phone 412px', 412, 915, true, 'app'],
  ['phone, Desktop site 980px', 980, 1200, true, 'app'],
  ['tablet 1024px', 1024, 1366, true, 'app'],
  ['laptop 1440px', 1440, 900, false, 'desktop'],
  ['wide 1920px', 1920, 1080, false, 'desktop'],
];

for (const [label, width, height, coarse, want] of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: coarse, hasTouch: coarse });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'pointer', value: coarse ? 'coarse' : 'fine' },
      { name: 'hover', value: coarse ? 'none' : 'hover' },
    ],
  });
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__mat !== undefined');
  await sleep(600);
  const r = await page.evaluate(() => {
    const n = document.getElementById('nav');
    const b = n.getBoundingClientRect();
    return {
      fixed: getComputedStyle(n).position === 'fixed',
      atBottom: Math.abs(b.bottom - innerHeight) < 3,
      overflow: document.documentElement.scrollWidth - innerWidth,
    };
  });
  const got = r.fixed && r.atBottom ? 'app' : 'desktop';
  const ok = got === want && r.overflow <= 1;
  if (!ok) failures.push(label);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(27)} layout=${got.padEnd(7)} overflow=${r.overflow}px`);
  await page.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} failure(s): ${failures.join(', ')}` : '\ndevices ok');
process.exit(failures.length ? 1 : 0);
