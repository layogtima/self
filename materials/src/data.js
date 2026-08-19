// Loads the dataset, validates the shape it needs, and derives everything the UI ranks on.
// Rank is derived here and never stored in the JSON.

const SECONDS_PER_YEAR = 31_556_952; // tropical year

// One list, ranked by what we make each year. Crustal share and built stock are no longer
// separate lists — they ride along as extra facts on the card and as sort orders here.
export const PRIMARY = 'annualProduction';

export const SORTS = {
  made: { id: 'made', label: 'Most made', quantity: 'annualProduction' },
  stock: { id: 'stock', label: 'Most still standing', quantity: 'anthropogenicStock' },
  crust: { id: 'crust', label: 'Most common in rock', quantity: 'crustalAbundance' },
  name: { id: 'name', label: 'A to Z' },
  year: { id: 'year', label: 'Oldest first' },
};

export const DEFAULT_SORT = 'made';

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

  // Ranks and log-scale extents per quantity, so a card can show where it sits on any of
  // them without the UI ever recomputing an ordering.
  const ranks = {};
  const extents = {};
  for (const key of ['annualProduction', 'anthropogenicStock', 'crustalAbundance']) {
    const ranked = materials
      .filter((m) => m.quantities[key])
      // Same tiebreak as the grid uses, so two materials on an identical figure never
      // display as rank 18 above rank 17.
      .sort((a, b) => b.quantities[key].value - a.quantities[key].value || a.name.localeCompare(b.name));
    ranks[key] = new Map(ranked.map((m, i) => [m.id, i + 1]));
    const values = ranked.map((m) => m.quantities[key].value);
    extents[key] = values.length ? { min: Math.min(...values), max: Math.max(...values) } : { min: 1, max: 1 };
  }

  // Live extraction: the global figure is the honest headline. What we track is shown beside it.
  // Only whole, independent extraction flows count toward the tracked total. Wheat is
  // inside cereals and sawnwood is inside roundwood, so a record marked `subsetOf` is
  // shown in the list but never added to its own parent.
  const globalExtraction = scales.globals.extraction;
  const trackedTonnes = materials.reduce((sum, m) => {
    const p = m.quantities.annualProduction;
    return sum + (p && p.kind === 'extraction' && !m.subsetOf ? p.value : 0);
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
