// The headline counter: what comes out of the Earth while the page is open.

import { commas, fmtRatePlain, fmtLiveMass } from '../format.js';
import { state } from '../state.js';
import { elapsed, since } from '../ticker.js';

export function mountHero(app) {
  const kgEl = document.getElementById('counter-kg');
  const carbonEl = document.getElementById('counter-carbon');
  const rateEl = document.getElementById('counter-rate');
  const srcEl = document.getElementById('counter-source');
  const navEl = document.getElementById('nav-total');
  const { extraction, extractionKgS } = app.global;

  rateEl.textContent = state.perPerson
    ? `${(((extraction.value * 1000) / app.population.value) / 1000).toFixed(1)} tonnes a year, each.`
    : `${fmtRatePlain(extractionKgS)}, without pause.`;
  // The provenance behind these two numbers lives in the About section and in Settings,
  // not stacked under the headline where it buried the point.
  srcEl.remove();

  const co2KgS = app.global.co2KgS;
  const head = document.querySelector('.counter-label');
  const unitEl = document.querySelector('.counter-unit');
  // The rate line changes wording between the two modes, so it is redrawn too.
  const rateText = () =>
    state.perPerson
      ? `${(((extraction.value * 1000) / app.population.value) / 1000).toFixed(1)} tonnes a year, each.`
      : `${fmtRatePlain(extractionKgS)}, without pause.`;

  let last = -1;
  let lastMode = null;
  return function updateHero() {
    // Per-person mode reframes the headline: the world's tonnage becomes your share.
    const share = state.perPerson ? app.population.value : 1;
    const kg = since(extractionKgS) / share;
    const rounded = Math.round(kg);
    if (rounded === last) return;
    last = rounded;
    if (state.perPerson !== lastMode) {
      lastMode = state.perPerson;
      rateEl.textContent = rateText();
    }
    const mass = fmtLiveMass(kg);
    kgEl.textContent = mass.num;
    unitEl.textContent = mass.unit;
    head.textContent = state.perPerson ? 'Dug up for you since you got here' : 'Dug up since you got here';
    // Making it is the other half of the story, and it is the half nobody counts.
    const co2 = fmtLiveMass(since(co2KgS) / share);
    carbonEl.textContent = state.perPerson
      ? `and ${co2.num} ${co2.unit} of carbon dioxide put into the air on your behalf`
      : `and ${co2.num} ${co2.unit} of carbon dioxide put into the air`;
    navEl.textContent = `${mass.num} ${mass.unit}${state.perPerson ? ' yours' : ''}`;
    navEl.setAttribute('title', `${elapsed().toFixed(0)} s on this page`);
  };
}
