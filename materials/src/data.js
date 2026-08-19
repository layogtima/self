// Loads the dataset, validates the shape it needs, and derives everything the UI ranks on.
// Rank is derived here and never stored in the JSON.

const SECONDS_PER_YEAR = 31_556_952; // tropical year

// One list, ranked by what we make each year. Crustal share and built stock are no longer
// separate lists — they ride along as extra facts on the card and as sort orders here.
export const PRIMARY = 'annualProduction';

export const SORTS = {
  made: { id: 'made', label: 'Most each year', quantity: 'annualProduction', rank: 'on the list' },
  stock: { id: 'stock', label: 'Most still standing', quantity: 'anthropogenicStock', rank: 'most built' },
  crust: { id: 'crust', label: 'Most common in rock', quantity: 'crustalAbundance', rank: 'most common in rock' },
  name: { id: 'name', label: 'A to Z' },
  year: { id: 'year', label: 'Oldest first' },
};

export const DEFAULT_SORT = 'made';

// Bump when the data changes, so a cached JSON can never be paired with newer code.
export const DATA_VERSION = '8';

export async function loadData(base = './') {
  const [dataset, sources, scales] = await Promise.all(
    ['data/materials.json', 'data/sources.json', 'data/scales.json'].map(async (p) => {
      const res = await fetch(`${base}${p}?v=${DATA_VERSION}`);
      if (!res.ok) throw new Error(`${p}: ${res.status} ${res.statusText}`);
      return res.json();
    })
  );

  const warnings = [];
  const materials = dataset.materials.map((m) => decorate(m, sources, warnings));
  const byId = new Map(materials.map((m) => [m.id, m]));

  // A rank per quantity, so the UI never recomputes an ordering.
  const ranks = {};
  for (const key of ['annualProduction', 'anthropogenicStock', 'crustalAbundance']) {
    const ranked = materials
      .filter((m) => m.quantities[key])
      // Same tiebreak as the grid uses, so two materials on an identical figure never
      // display as rank 18 above rank 17.
      .sort((a, b) => b.quantities[key].value - a.quantities[key].value || a.name.localeCompare(b.name));
    ranks[key] = new Map(ranked.map((m, i) => [m.id, i + 1]));
  }

  // Live extraction: the global figure is the honest headline. What we track is shown beside it.
  // Only whole, independent extraction flows count toward the tracked total. Wheat is
  // inside cereals and sawnwood is inside roundwood, so a record marked `subsetOf` is
  // shown in the list but never added to its own parent.
  const globalExtraction = scales.globals.extraction;
  // Only whole, independent *solid* extraction counts toward the tracked total.
  // `withdrawal` is its own kind precisely so that any build which does not know about it,
  // including a stale cached one, skips it rather than summing 4 trillion tonnes of water
  // into a 106 Gt figure and reporting a double-count that is not there.
  const trackedTonnes = materials.reduce((sum, m) => {
    const p = m.quantities.annualProduction;
    const counts = p && p.kind === 'extraction' && !m.subsetOf && !m.excludedFromTotal;
    return sum + (counts ? p.value : 0);
  }, 0);

  if (globalExtraction.value < 1e10 || globalExtraction.value > 3e11) {
    warnings.push(
      `The global extraction figure (${globalExtraction.value.toExponential(2)} t/yr) is outside the plausible 10–300 Gt/yr band. Treat the live counter as broken, not as news.`
    );
  }
  if (trackedTonnes > globalExtraction.value) {
    const worst = materials
      .filter((m) => m.quantities.annualProduction?.kind === 'extraction' && !m.subsetOf && !m.excludedFromTotal)
      .sort((a, b) => b.quantities.annualProduction.value - a.quantities.annualProduction.value)
      .slice(0, 3)
      .map((m) => `${m.name} (${(m.quantities.annualProduction.value / 1e9).toFixed(1)} Gt/yr)`)
      .join(', ');
    warnings.push(
      `Tracked extraction is ${(trackedTonnes / 1e9).toFixed(0)} Gt/yr against a global figure of ` +
        `${(globalExtraction.value / 1e9).toFixed(0)} Gt/yr, so something is counted twice. ` +
        `Largest contributors: ${worst}.`
    );
  }

  const classes = [...new Set(materials.map((m) => m.class))].sort();

  return {
    materials,
    byId,
    sources,
    scales,
    ranks,
    classes,
    warnings,
    global: {
      extraction: globalExtraction,
      extractionKgS: (globalExtraction.value * 1000) / SECONDS_PER_YEAR,
      trackedTonnes,
      trackedShare: trackedTonnes / globalExtraction.value,
    },
  };
}

function decorate(m, sources, warnings) {
  const quantities = {};
  for (const [key, q] of Object.entries(m.quantities || {})) {
    if (!q) continue;
    if (typeof q.value !== 'number' || !Number.isFinite(q.value)) {
      warnings.push(`${m.id}.${key} is not a finite number and was dropped.`);
      continue;
    }
    if (!q.source_id || !sources[q.source_id]) {
      warnings.push(`${m.id}.${key} has no resolvable source and was dropped.`);
      continue; // a number with no source does not get rendered
    }
    quantities[key] = q;
  }

  const production = quantities.annualProduction;
  return {
    ...m,
    quantities,
    // kilograms per second — the only rate the app uses
    rateKgS: production ? (production.value * 1000) / SECONDS_PER_YEAR : 0,
    haystack: [m.name, ...(m.aka || []), m.class, m.formula || '', m.id].join(' ').toLowerCase(),
    sortYear: m.discovered?.year ?? -1e6,
  };
}

export { SECONDS_PER_YEAR };
