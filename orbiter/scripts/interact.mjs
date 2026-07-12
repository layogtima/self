// End-to-end flow check: skip cinematic → advisor dialogue → build mode →
// place a Gravity Whirl → verify credits/guests → free-fly exterior shot.
import { chromium } from 'playwright-core';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://localhost:5173/ships/monolith/', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// skip the cinematic
await page.keyboard.press('Space');
await page.waitForTimeout(1800); // advisor appears after 900ms

// advance through all 4 advisor lines (each line: click completes type, click advances)
for (let i = 0; i < 8; i++) {
  await page.click('#advisor-bubble');
  await page.waitForTimeout(350);
}
const advisorGone = await page.$eval('#advisor', (el) => getComputedStyle(el).opacity === '0' || el.style.display === 'none' || !el.classList.contains('show'));

// enter build mode, hover over deck center-left, place
await page.keyboard.press('KeyB');
await page.mouse.move(1150, 700); // open promenade, clear of ride exclusion zones
await page.waitForTimeout(600);
await page.screenshot({ path: '/tmp/orbiter-ghost.png' });
await page.mouse.click(1150, 700);
await page.waitForTimeout(800);
const credits = await page.$eval('#credits', (el) => el.textContent);
const guests = await page.$eval('#guest-count', (el) => el.textContent);
await page.screenshot({ path: '/tmp/orbiter-placed.png' });

// wait for guests to flock, then check the toast fired
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/orbiter-flock.png' });

// walk around the park in first person, then into the ship concourse
await page.keyboard.press('Escape');
await page.keyboard.press('KeyG');
await page.waitForTimeout(500);
const walkMode = await page.evaluate(() => document.body.className);
await page.keyboard.down('KeyW');
await page.waitForTimeout(1200);
await page.keyboard.up('KeyW');
await page.screenshot({ path: '/tmp/orbiter-walk.png' });
await page.evaluate(() => window.__debug.walk(-200, 0, -600, 0)); // jump into aft concourse
await page.waitForTimeout(800);
await page.screenshot({ path: '/tmp/orbiter-concourse.png' });

// back to manage, then free-fly out
await page.keyboard.press('KeyG');
await page.waitForTimeout(300);
await page.keyboard.press('KeyF');
// pull back to see the ship: hold S for a while
await page.keyboard.down('ShiftLeft');
await page.keyboard.down('KeyS');
await page.waitForTimeout(2600);
await page.keyboard.up('KeyS');
await page.keyboard.up('ShiftLeft');
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/orbiter-fly.png' });

console.log(JSON.stringify({ advisorGone, credits, guests, errors }, null, 2));
await browser.close();
