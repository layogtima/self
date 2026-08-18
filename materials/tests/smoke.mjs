/**
 * Headless smoke test for MATERIAL.
 *
 * Needs a Chrome and puppeteer-core:
 *   mkdir -p /tmp/matsmoke && cd /tmp/matsmoke && npm i puppeteer-core@23
 *   cd <repo root> && python3 -m http.server 8642 &
 *   NODE_PATH=/tmp/matsmoke/node_modules node materials/tests/smoke.mjs
 *
 * Env: BASE (default http://localhost:8642/materials/), CHROME (path to Chrome).
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const BASE = process.env.BASE || 'http://localhost:8642/materials/';
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
  if (!ok) failures.push(name);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('requestfailed', (r) => consoleErrors.push(`request failed: ${r.url()}`));

  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__mat !== undefined', { timeout: 15000 });

  const info = await page.evaluate(() => ({
    materials: window.__mat.app.materials.length,
    cards: document.querySelectorAll('#grid .card').length,
    visible: document.querySelectorAll('#grid .card:not(.is-hidden)').length,
    webgl: !!window.__mat.gl?.renderer?.getContext(),
    views: window.__mat.gl?.viewCount?.() ?? 0,
    warnings: window.__mat.app.warnings,
    globalTonnes: window.__mat.app.global.extraction.value,
    rateKgS: window.__mat.app.global.extractionKgS,
    noWebglClass: document.body.classList.contains('no-webgl'),
  }));

  check('dataset loads', info.materials >= 40, `${info.materials} materials`);
  check('every material has a card', info.cards === info.materials, `${info.cards} cards`);
  check('FLOW shows only what it measures', info.visible === 47 && info.visible < info.cards, `${info.visible} of ${info.cards} shown`);
  check('WebGL context created', info.webgl && !info.noWebglClass);
  check('live 3D is limited to the hero', info.views <= 2, `${info.views} live view(s), ${info.cards} cards`);
  check('no data warnings', info.warnings.length === 0, info.warnings.join('; '));
  check(
    'global extraction is plausible',
    info.globalTonnes >= 1e10 && info.globalTonnes <= 3e11,
    `${(info.globalTonnes / 1e9).toFixed(0)} Gt/yr = ${(info.rateKgS / 1000).toFixed(0)} t/s`
  );

  // The ticker actually moves. Headless Chrome throttles requestAnimationFrame to
  // roughly 1 fps, so poll rather than assuming a repaint inside a fixed window.
  const kg1 = await page.$eval('#counter-kg', (el) => el.textContent);
  let kg2 = kg1;
  for (let i = 0; i < 20 && kg2 === kg1; i++) {
    await sleep(250);
    kg2 = await page.$eval('#counter-kg', (el) => el.textContent);
  }
  const parsed = Number(kg2.replace(/,/g, ''));
  check('live counter advances', kg1 !== kg2 && parsed > 0, `${kg1} → ${kg2} kg`);

  // views re-rank
  await page.keyboard.press('2');
  await sleep(150);
  const made = await page.evaluate(() => {
    const first = document.querySelector('#grid .card:not(.is-hidden)');
    return {
      hash: location.hash,
      name: first?.querySelector('.card-name').textContent,
      rank: first?.querySelector('.card-rank').textContent,
      shown: document.querySelectorAll('#grid .card:not(.is-hidden)').length,
      note: document.getElementById('grid-note').textContent,
    };
  });
  check('view 2 switches to MADE', made.hash.includes('view=made'), made.hash);
  check('MADE hides the 44 with no built stock', made.shown === 9, `${made.shown} shown, note: "${made.note}"`);
  check('MADE is topped by concrete', /concrete/i.test(made.name || ''), `#1 is ${made.name} ${made.rank}`);

  await page.keyboard.press('3');
  await sleep(150);
  const flow = await page.evaluate(() => document.querySelector('#grid .card:not(.is-hidden) .card-name')?.textContent);
  check('FLOW is topped by sand & gravel', /sand/i.test(flow || ''), `#1 is ${flow}`);

  // search
  await page.keyboard.press('/');
  await page.keyboard.type('alumin');
  await sleep(250);
  const searched = await page.evaluate(() => ({
    n: document.querySelectorAll('#grid .card:not(.is-hidden)').length,
    hash: location.hash,
  }));
  check('search filters', searched.n > 0 && searched.n <= 3, `${searched.n} results`);

  // Relabelling regression: no list may show a row it has no number for.
  const noBlanks = await page.evaluate(() => {
    const bad = [];
    for (const view of ['crust', 'made', 'flow']) {
      location.hash = `view=${view}`;
      window.__mat.grid.render();
      for (const c of document.querySelectorAll('#grid .card:not(.is-hidden)')) {
        if (!c.querySelector('.card-figure .unit')) bad.push(`${view}:${c.dataset.id}`);
      }
    }
    return bad;
  });
  check('no list shows a material it cannot measure', noBlanks.length === 0, noBlanks.slice(0, 3).join(', '));

  const labels = await page.evaluate(() => ({
    tabs: [...document.querySelectorAll('.views button')].map((b) => b.textContent.trim()),
    legend: [...document.querySelectorAll('#legend dt')].map((d) => d.textContent.trim()),
  }));
  check(
    'tab labels and the legend cannot drift apart',
    labels.tabs.length === 3 && labels.tabs.join('|') === labels.legend.join('|'),
    labels.tabs.join(' / ')
  );
  check('search is in the URL', searched.hash.includes('q=alumin'), searched.hash);

  // deep link into the detail panel
  await page.goto(BASE + '#m=steel', { waitUntil: 'networkidle0' });
  await page.waitForFunction('window.__mat !== undefined');
  await sleep(400);
  const detail = await page.evaluate(() => {
    const d = document.getElementById('detail');
    return {
      open: !d.hidden,
      name: d.querySelector('#detail-name')?.textContent,
      focusInside: d.contains(document.activeElement),
      live: !!d.querySelector('#detail-live-kg'),
      sources: d.querySelectorAll('.src').length,
      dialog: d.getAttribute('role') === 'dialog' && d.getAttribute('aria-modal') === 'true',
    };
  });
  check('deep link opens the detail panel', detail.open && /steel/i.test(detail.name || ''), detail.name);
  check('detail is a real dialog with focus moved in', detail.dialog && detail.focusInside);
  check('detail shows sourced numbers', detail.sources >= 5, `${detail.sources} source credits`);
  check('detail has a live figure', detail.live);

  await page.keyboard.press('Escape');
  await sleep(200);
  const closed = await page.evaluate(() => ({
    hidden: document.getElementById('detail').hidden,
    hash: location.hash,
  }));
  check('escape closes the detail panel', closed.hidden && !closed.hash.includes('m=steel'), closed.hash);

  // calm mode. Escape restored focus to the search box (correct dialog behaviour),
  // so blur it first — 'c' is a page shortcut, not a shortcut while typing.
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('c');
  await sleep(900);
  const calm = await page.evaluate(() => ({
    on: document.body.classList.contains('calm'),
    stored: localStorage.getItem('material.prefs'),
    kg: document.getElementById('counter-kg').textContent,
  }));
  await sleep(900);
  const calmAfter = await page.$eval('#counter-kg', (el) => el.textContent);
  check('calm mode engages and persists', calm.on && /"calm":true/.test(calm.stored || ''));
  check('calm mode freezes the counter', calm.kg === calmAfter, `${calm.kg} → ${calmAfter}`);

  // Regression: an in-page anchor must not reset the filters (state hashes contain '=').
  await page.evaluate(() => {
    location.hash = 'view=crust&q=iron';
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('a.cta').click());
  await sleep(300);
  const afterAnchor = await page.evaluate(() => ({ view: window.__mat.state.view, q: window.__mat.state.q }));
  check('in-page anchors preserve filters', afterAnchor.view === 'crust' && afterAnchor.q === 'iron', JSON.stringify(afterAnchor));

  // Regression: a prototype key in the view param used to pass validation and throw.
  const beforeBad = await page.evaluate(() => window.__mat.state.view);
  await page.evaluate(() => {
    location.hash = 'view=constructor';
  });
  await sleep(300);
  const afterBad = await page.evaluate(() => ({ view: window.__mat.state.view, cards: document.querySelectorAll('#grid .card:not(.is-hidden)').length }));
  check('a bogus view is rejected, not crashed on', afterBad.view !== 'constructor' && afterBad.cards > 0, `view=${afterBad.view} (was ${beforeBad}), ${afterBad.cards} cards`);

  // Card specimens are real renders, not empty canvases.
  const paintedPixels = await page.evaluate(() => {
    const c = document.querySelector('#grid .card:not(.is-hidden) canvas');
    if (!c || !c.width) return 0;
    const ctx = c.getContext('2d');
    const { data } = ctx.getImageData(0, 0, c.width, c.height);
    let opaque = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 8) opaque++;
    return opaque;
  });
  check('card specimens are painted', paintedPixels > 200, `${paintedPixels} opaque pixels`);

  // The point of the whole render rewrite: scrolling the list must cost no GPU at all.
  await page.evaluate(() => {
    location.hash = 'view=flow';
    document.getElementById('grid').scrollIntoView();
  });
  await sleep(600);
  const drawCalls = await page.evaluate(async () => {
    if (!window.__mat.gl) return 0;
    const r = window.__mat.gl.renderer;
    const real = r.render.bind(r);
    let calls = 0;
    r.render = (...a) => {
      calls++;
      return real(...a);
    };
    for (let i = 0; i < 12; i++) {
      window.scrollBy(0, 60);
      await new Promise((res) => requestAnimationFrame(res));
    }
    await new Promise((res) => setTimeout(res, 400));
    r.render = real;
    return calls;
  });
  check('scrolling the grid costs no GPU', drawCalls === 0, `${drawCalls} draw calls while scrolling`);

  // narrow viewport, no horizontal scroll
  await page.setViewport({ width: 375, height: 780 });
  await sleep(400);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('no horizontal scroll at 375px', overflow <= 1, `${overflow}px overflow`);

  await page.setViewport({ width: 1440, height: 900 });
  await sleep(600);
  await page.screenshot({ path: '/tmp/material.png', fullPage: false });
  console.log('screenshot: /tmp/material.png');

  check('no console errors', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));
} finally {
  await browser.close();
}

console.log(failures.length ? `\n${failures.length} failure(s): ${failures.join(', ')}` : '\nall checks passed');
process.exit(failures.length ? 1 : 0);
