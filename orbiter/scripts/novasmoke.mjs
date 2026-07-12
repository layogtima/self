// Fire every Nova power headless and screenshot the interesting ones.
import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5173/ships/monolith/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// skip cinematic, open console
await page.keyboard.press('Space');
await page.waitForTimeout(1000);
await page.keyboard.press('KeyN');
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/nova-console.png' });

const results = {};
for (const key of ['planet', 'planet', 'planet', 'gravity', 'timewarp', 'disco', 'paint', 'paint', 'scale', 'teleport', 'warp']) {
  const r = await page.evaluate((k) => window.__debug.firePower(k), key);
  results[key] = r?.detail || r?.line?.slice(0, 40) || 'fired';
  await page.waitForTimeout(700);
}
await page.screenshot({ path: '/tmp/nova-planets.png' });

// gravity + teleport to a deck then jump
await page.evaluate(() => window.__debug.walk(-170, 20, -290, 0));
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/nova-walk-deckB.png' });

console.log(JSON.stringify({ results, errors }, null, 2));
await browser.close();
