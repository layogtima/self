// Measure FPS + renderer stats at three beats: exterior sweep, viewport
// approach, park management view.
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ args: ['--use-angle=metal'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
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

await measure('exterior sweep ');
await page.waitForTimeout(14000);
await measure('viewport close ');
await page.keyboard.press('Space');
await page.waitForTimeout(1200);
await measure('management view');
await browser.close();
