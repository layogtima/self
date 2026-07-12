// Dev screenshot harness: loads the scene headless, jumps the camera to a
// named moment, and saves a PNG. Usage: node scripts/shot.mjs <seconds> <out>
import { chromium } from 'playwright-core';

const t = parseFloat(process.argv[2] ?? '0');
const out = process.argv[3] ?? `/tmp/orbiter-${t}s.png`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto('http://localhost:5173/ships/monolith/', { waitUntil: 'networkidle' });
// let the cinematic play to the requested moment
await page.waitForTimeout(1500 + t * 1000);
await page.screenshot({ path: out });
console.log('saved', out);
if (errors.length) console.log('PAGE ERRORS:\n' + errors.join('\n'));
await browser.close();
