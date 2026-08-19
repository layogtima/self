/**
 * Headless smoke test for MATERIALS.
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
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' · ' + detail : ''}`);
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
  check('the list shows only what has a yearly figure', info.visible > 0 && info.visible <= info.cards, `${info.visible} of ${info.cards} shown`);
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

  const first = () => page.evaluate(() => document.querySelector('#grid .card:not(.is-hidden) .card-name')?.textContent);
  check('the list is topped by water', /water/i.test((await first()) || ''), `1st is ${await first()}`);

  // Water is the largest flow by far and sits outside the 106 Gt headline, which counts
  // solid materials. It must never be summed into the tracked total.
  const totals = await page.evaluate(() => ({
    tracked: window.__mat.app.global.trackedTonnes,
    global: window.__mat.app.global.extraction.value,
    water: window.__mat.app.byId.get('water')?.quantities.annualProduction.value,
    flagged: !!window.__mat.app.byId.get('water')?.excludedFromTotal,
  }));
  check(
    'water is excluded from the headline total',
    totals.flagged && totals.tracked < totals.global && totals.water > totals.global,
    `water ${(totals.water / 1e9).toExponential(1)} Gt/yr vs tracked ${(totals.tracked / 1e9).toFixed(0)} Gt/yr`
  );

  // A stale cached build pairing old code with new data raised a false "double-counted"
  // alarm. Water's `withdrawal` kind means no build, however old, can sum it in.
  const staleSafe = await page.evaluate(() => {
    const mats = window.__mat.app.materials;
    const sum = (fn) => mats.reduce((s, m) => s + (fn(m) ? m.quantities.annualProduction.value : 0), 0);
    const isExtraction = (m) => m.quantities.annualProduction?.kind === 'extraction';
    return {
      global: window.__mat.app.global.extraction.value,
      stale: sum((m) => isExtraction(m) && !m.subsetOf), // build with no excludedFromTotal
      oldest: sum(isExtraction), // build with no subset handling either
    };
  });
  check(
    'no older build can raise a false double-count alarm',
    staleSafe.stale < staleSafe.global && staleSafe.oldest < staleSafe.global,
    `stale ${(staleSafe.stale / 1e9).toFixed(0)} / oldest ${(staleSafe.oldest / 1e9).toFixed(0)} vs ${(staleSafe.global / 1e9).toFixed(0)} Gt/yr`
  );

  // The two retired lists survive as sort orders over the same single list.
  const sortTo = async (id) => {
    await page.select('#sort', id);
    await sleep(200);
    return first();
  };
  check('sorting by built stock puts concrete first', /concrete/i.test((await sortTo('stock')) || ''), await first());
  check('sorting by crustal share puts silicon first', /silicon/i.test((await sortTo('crust')) || ''), await first());
  await sortTo('made');

  // An old three-list link must still land somewhere sensible.
  await page.evaluate(() => {
    location.hash = 'view=made';
  });
  await sleep(250);
  const migrated = await page.evaluate(() => window.__mat.state.sort);
  check('old ?view= links migrate to the matching sort', migrated === 'stock', `view=made -> sort=${migrated}`);
  await page.select('#sort', 'made');
  await sleep(150);

  // search
  await page.keyboard.press('/');
  await page.keyboard.type('alumin');
  await sleep(250);
  const searched = await page.evaluate(() => ({
    n: document.querySelectorAll('#grid .card:not(.is-hidden)').length,
    hash: location.hash,
  }));
  check('search filters', searched.n > 0 && searched.n <= 3, `${searched.n} results`);

  // Mod: first-use dates. Iron ore reading as older than wood was the symptom of every
  // undated record tying on one sentinel value.
  // Clear the search left over from the step above, or this only sorts the matches.
  await page.evaluate(() => {
    window.__mat.state.q = '';
    document.getElementById('search').value = '';
    window.__mat.grid.render();
  });
  await page.select('#sort', 'year');
  await sleep(250);
  const oldest = await page.evaluate(() =>
    [...document.querySelectorAll('#grid .card:not(.is-hidden)')].slice(0, 5).map((c) => c.querySelector('.card-name').textContent)
  );
  check('oldest first is water then wood, not an ore', /water/i.test(oldest[0] || '') && /wood/i.test(oldest[1] || ''), oldest.join(', '));
  check('no material is left undated', await page.evaluate(() => window.__mat.app.materials.every((m) => m.discovered?.year != null)));
  await page.select('#sort', 'made');
  await sleep(200);

  // Mod: nothing should be a generic blob any more.
  const shapeSpread = await page.evaluate(() => {
    const s = new Set(window.__mat.app.materials.map((m) => m.specimen.shape));
    return { distinct: s.size, missing: window.__mat.app.materials.filter((m) => !m.specimen.shape).length };
  });
  check('specimens use many distinct shapes', shapeSpread.distinct >= 20 && shapeSpread.missing === 0, `${shapeSpread.distinct} shapes`);

  // A plank has six faces and the wood recipe handed it three materials, so half of every
  // board drew nothing. Material count must match the geometry's group count.
  const groupMismatch = await page.evaluate(async () => {
    const sp = await import('./src/render/specimens.js');
    const bad = [];
    for (const m of window.__mat.app.materials) {
      const mesh = sp.makeMesh(m, 'card');
      const groups = mesh.geometry.groups.length;
      const mats = Array.isArray(mesh.material) ? mesh.material.length : 1;
      if (groups > 1 && mats > 1 && groups !== mats) bad.push(`${m.id}: ${groups} groups vs ${mats} materials`);
      if (groups > 1 && mats === 1) continue;
    }
    return bad;
  });
  check('every geometry group has a material', groupMismatch.length === 0, groupMismatch.slice(0, 3).join(', '));

  // Mod: light mode, defaulting to whatever the OS asks for.
  const themeAuto = await page.evaluate(() => ({
    applied: document.documentElement.dataset.theme,
    state: window.__mat.state.theme,
    osLight: matchMedia('(prefers-color-scheme: light)').matches,
    label: document.getElementById('theme-toggle').textContent,
  }));
  check(
    'theme follows the OS until asked otherwise',
    themeAuto.state === 'auto' && themeAuto.applied === (themeAuto.osLight ? 'light' : 'dark'),
    `OS light=${themeAuto.osLight}, applied=${themeAuto.applied}`
  );
  await page.evaluate(() => document.activeElement?.blur?.());
  await page.keyboard.press('t');
  await sleep(250);
  const flipped = await page.evaluate(() => ({
    applied: document.documentElement.dataset.theme,
    stored: localStorage.getItem('material.prefs'),
    bg: getComputedStyle(document.body).backgroundColor,
    ink: getComputedStyle(document.body).color,
    label: document.getElementById('theme-toggle').textContent,
  }));
  check(
    'toggling flips the palette and is remembered',
    flipped.applied !== themeAuto.applied && /"theme":"(light|dark)"/.test(flipped.stored) && flipped.label !== themeAuto.label,
    `${themeAuto.applied} -> ${flipped.applied}, bg ${flipped.bg}`
  );
  // No token may be left undefined in either palette, or something renders transparent.
  const tokens = await page.evaluate(() => {
    const names = ['--paper', '--panel', '--panel-hover', '--ink', '--dim', '--faint', '--hair',
      '--hair-strong', '--scrim', '--stage', '--ground', '--scroll-thumb', '--warn-line',
      '--warn-bg', '--good', '--bad'];
    const missing = [];
    for (const theme of ['light', 'dark']) {
      document.documentElement.dataset.theme = theme;
      const cs = getComputedStyle(document.documentElement);
      for (const n of names) if (!cs.getPropertyValue(n).trim()) missing.push(`${theme}${n}`);
    }
    return missing;
  });
  check('both palettes define every token', tokens.length === 0, tokens.join(', '));
  await page.keyboard.press('t');
  await sleep(200);

  // Mod: no em dashes anywhere the reader can see.
  const dashes = await page.evaluate(() => {
    const bad = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) if (node.nodeValue.includes('\u2014')) bad.push(node.nodeValue.trim().slice(0, 40));
    return bad;
  });
  check('no em dashes in the rendered page', dashes.length === 0, dashes.slice(0, 2).join(' | '));

  // Every visible row must carry a real figure, under every sort order.
  const noBlanks = await page.evaluate(async () => {
    const bad = [];
    for (const id of ['made', 'stock', 'crust', 'name', 'year']) {
      window.__mat.state.sort = id;
      window.__mat.grid.render();
      for (const c of document.querySelectorAll('#grid .card:not(.is-hidden)')) {
        if (!c.querySelector('.card-figure .unit')) bad.push(`${id}:${c.dataset.id}`);
      }
    }
    window.__mat.state.sort = 'made';
    window.__mat.grid.render();
    return bad;
  });
  check('no row is shown without a figure', noBlanks.length === 0, noBlanks.slice(0, 3).join(', '));
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

  // Mod: good/bad points where a material has a real trade-off.
  const points = await page.evaluate(() => ({
    good: [...document.querySelectorAll('#detail .points.good li')].length,
    bad: [...document.querySelectorAll('#detail .points.bad li')].length,
    headings: [...document.querySelectorAll('#detail h3')].map((h) => h.textContent),
  }));
  check('detail shows good and bad points', points.good >= 2 && points.bad >= 2, `${points.good} good, ${points.bad} bad`);
  check('the panel has em-dash-free headings', !points.headings.join('').includes('\u2014'), points.headings.join(' / '));

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
    location.hash = 'sort=crust&q=iron';
  });
  await sleep(200);
  await page.evaluate(() => document.querySelector('a.cta').click());
  await sleep(300);
  const afterAnchor = await page.evaluate(() => ({ sort: window.__mat.state.sort, q: window.__mat.state.q }));
  check('in-page anchors preserve filters', afterAnchor.sort === 'crust' && afterAnchor.q === 'iron', JSON.stringify(afterAnchor));

  // Regression: a prototype key in the sort param used to pass validation and throw.
  await page.evaluate(() => {
    location.hash = 'sort=constructor';
  });
  await sleep(300);
  const afterBad = await page.evaluate(() => ({
    sort: window.__mat.state.sort,
    cards: document.querySelectorAll('#grid .card:not(.is-hidden)').length,
  }));
  check('a bogus sort is rejected, not crashed on', afterBad.sort !== 'constructor' && afterBad.cards > 0, `sort=${afterBad.sort}, ${afterBad.cards} cards`);

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
    location.hash = 'sort=made';
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

  // narrow viewport: no horizontal scroll, and the bar sits at the bottom like an app
  await page.setViewport({ width: 375, height: 780 });
  await sleep(500);
  const phone = await page.evaluate(() => {
    const r = document.getElementById('nav').getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      atBottom: Math.abs(r.bottom - window.innerHeight) < 3,
      fixed: getComputedStyle(document.getElementById('nav')).position === 'fixed',
    };
  });
  check('no horizontal scroll at 375px', phone.overflow <= 1, `${phone.overflow}px overflow`);
  check('nav sits at the bottom on a phone', phone.atBottom && phone.fixed, JSON.stringify(phone));

  // Android Chrome with "Desktop site" ticked reports a 980px viewport, which used to sail
  // past the 880px breakpoint and leave a phone on the desktop layout.
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }],
  });
  await page.setViewport({ width: 980, height: 1200, isMobile: true, hasTouch: true });
  await sleep(500);
  const desktopSite = await page.evaluate(() => {
    const n = document.getElementById('nav');
    return { fixed: getComputedStyle(n).position === 'fixed', atBottom: Math.abs(n.getBoundingClientRect().bottom - innerHeight) < 3 };
  });
  check('phone in desktop-site mode still gets the app layout', desktopSite.fixed && desktopSite.atBottom, JSON.stringify(desktopSite));
  await cdp.send('Emulation.setEmulatedMedia', { features: [] });

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
