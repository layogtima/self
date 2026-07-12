// Screenshot walk mode from given spawn/look via the __debug hook.
// usage: node scripts/walkshot.mjs sx sz lx lz out
import { chromium } from 'playwright-core';
const [sx, sz, lx, lz, out] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
await page.evaluate(([a, b, c, d]) => window.__debug.walk(a, b, c, d),
  [+sx, +sz, +lx, +lz]);
await page.waitForTimeout(1200);
await page.screenshot({ path: out || '/tmp/walk.png' });
if (errors.length) console.log('ERRORS:', errors.join('\n'));
else console.log('ok', out);
await browser.close();
