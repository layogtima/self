// The headline counter: what comes out of the Earth while the page is open.

import { commas, fmtRatePlain } from '../format.js';
import { elapsed, since } from '../ticker.js';

export function mountHero(app) {
  const kgEl = document.getElementById('counter-kg');
  const rateEl = document.getElementById('counter-rate');
  const srcEl = document.getElementById('counter-source');
  const navEl = document.getElementById('nav-total');
  const { extraction, extractionKgS, trackedShare } = app.global;

  rateEl.textContent = `${fmtRatePlain(extractionKgS)}, without pause.`;
  srcEl.textContent = `UNEP ${extraction.year} · the ${app.materials.length} below cover ${(trackedShare * 100).toFixed(0)}% of it`;

  let last = -1;
  return function updateHero() {
    const kg = since(extractionKgS);
    const rounded = Math.round(kg);
    if (rounded === last) return;
    last = rounded;
    kgEl.textContent = commas(kg);
    navEl.textContent = `${commas(kg / 1000)} t`;
    navEl.setAttribute('title', `${elapsed().toFixed(0)} s on this page`);
  };
}
