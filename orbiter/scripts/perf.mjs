// Measure FPS + renderer stats at three beats, at a given quality tier.
// usage: node scripts/perf.mjs [tier]
import { chromium } from 'playwright-core';

const tier = process.argv[2];
const url = 'http://localhost:5173/ships/monolith/' + (tier !== undefined ? `?quality=${tier}` : '');

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);

async function measure(label) {
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let frames = 0;
    const start = performance.now();
    function loop() {
      frames++;
      if (performance.now() - start < 2000) requestAnimationFrame(loop);
      else resolve((frames / (performance.now() - start)) * 1000);
    }
    requestAnimationFrame(loop);
  }));
  const info = await page.evaluate(() => new Promise((resolve) => {
    const r = window.__renderer;
    r.info.autoReset = false;
    r.info.reset();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const out = { calls: r.info.render.calls, triangles: r.info.render.triangles };
      r.info.autoReset = true;
      resolve(out);
    }));
  }));
  console.log(label, '→ fps:', fps.toFixed(1), 'drawCalls:', info.calls, 'tris:', (info.triangles / 1e6).toFixed(2) + 'M');
}

await measure(`tier=${tier ?? 'auto'} exterior `);
await page.keyboard.press('Space');
await page.waitForTimeout(1200);
await measure(`tier=${tier ?? 'auto'} manage   `);
await page.evaluate(() => window.__debug.walk(170, 30, 100, -10));
await page.waitForTimeout(600);
await measure(`tier=${tier ?? 'auto'} walk     `);
if (errors.length) console.log('ERRORS:', errors);
await browser.close();
