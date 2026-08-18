// Loads the dataset, validates the shape it needs, and derives everything the UI ranks on.
// Rank is derived here and never stored in the JSON.

const SECONDS_PER_YEAR = 31_556_952; // tropical year

// `tab` is the button, `rank` completes "22nd …", `legend` explains the list in the About
// section. All three live here so a label can only be changed in one place.
//
// The crust list is elemental composition, so it is named for that. It used to be called
// "IN THE GROUND", which promised anything you can dig up — and then had nothing to say
// about coal, salt or bauxite, because no source gives a rock a parts-per-million share
// of the crust.
export const VIEWS = {
  crust: {
    id: 'crust',
    quantity: 'crustalAbundance',
    tab: "EARTH'S RECIPE",
    rank: 'most common in rock',
    legend: 'What everything is made of, element by element.',
  },
  made: {
    id: 'made',
    quantity: 'anthropogenicStock',
    tab: 'WE BUILT',
    rank: 'most built',
    legend: 'Stuff we made that is still standing.',
  },
  flow: {
    id: 'flow',
    quantity: 'annualProduction',
    tab: 'RIGHT NOW',
    rank: 'most made',
    legend: 'What we are making today.',
  },
};

export async function loadData(base = './') {
  const [dataset, sources, scales] = await Promise.all(
    ['data/materials.json', 'data/sources.json', 'data/scales.json'].map(async (p) => {
      const res = await fetch(base + p);
      if (!res.ok) throw new Error(`${p}: ${res.status} ${res.statusText}`);
      return res.json();
    })
  );

  const warnings = [];
  const materials = dataset.materials.map((m) => decorate(m, sources, warnings));
  const byId = new Map(materials.map((m) => [m.id, m]));

  const ranks = {};
  const extents = {};
  for (const view of Object.values(VIEWS)) {
    const key = view.quantity;
    const ranked = materials
      .filter((m) => m.quantities[key])
      .sort((a, b) => b.quantities[key].value - a.quantities[key].value);
    ranks[view.id] = new Map(ranked.map((m, i) => [m.id, i + 1]));
    const values = ranked.map((m) => m.quantities[key].value);
    extents[view.id] = values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 1, max: 1 };
  }

  // Live extraction: the global figure is the honest headline. What we track is shown beside it.
  const globalExtraction = scales.globals.extraction;
  const trackedTonnes = materials.reduce((sum, m) => {
    const p = m.quantities.annualProduction;
    return sum + (p && p.kind === 'extraction' ? p.value : 0);
  }, 0);

  if (globalExtraction.value < 1e10 || globalExtraction.value > 3e11) {
    warnings.push(
      `The global extraction figure (${globalExtraction.value.toExponential(2)} t/yr) is outside the plausible 10–300 Gt/yr band. Treat the live counter as broken, not as news.`
    );
  }
  if (trackedTonnes > globalExtraction.value) {
    warnings.push('The materials tracked here add up to more than the global extraction total, which means something is double-counted.');
  }

  const classes = [...new Set(materials.map((m) => m.class))].sort();

  return {
    materials,
    byId,
    sources,
    scales,
    ranks,
    extents,
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

/** Position of a value on a log scale between the view's smallest and largest, 0..1. */
export function logFraction(value, extent) {
  if (!(value > 0)) return 0;
  const lo = Math.log10(Math.max(extent.min, Number.MIN_VALUE));
  const hi = Math.log10(extent.max);
  if (hi <= lo) return 1;
  return Math.max(0.02, Math.min(1, (Math.log10(value) - lo) / (hi - lo)));
}

export { SECONDS_PER_YEAR };
