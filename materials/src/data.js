// Loads the dataset, validates the shape it needs, and derives everything the UI ranks on.
// Rank is derived here and never stored in the JSON.

const SECONDS_PER_YEAR = 31_556_952; // tropical year

// One list, ranked by what we make each year. Crustal share and built stock are no longer
// separate lists, they ride along as extra facts on the card and as sort orders here.
export const PRIMARY = 'annualProduction';

export const SORTS = {
  made: { id: 'made', label: 'Most each year', quantity: 'annualProduction', rank: 'on the list' },
  carbon: { id: 'carbon', label: 'Most carbon per kilo', field: 'co2PerKg', rank: 'heaviest on carbon' },
  emitted: { id: 'emitted', label: 'Most carbon in total', derived: 'co2PerYear', rank: 'biggest carbon total' },
  years: { id: 'years', label: 'Running out soonest', derived: 'yearsLeft', ascending: true, rank: 'soonest to run out' },
  recycled: { id: 'recycled', label: 'Most recycled', field: 'recyclingRate', rank: 'most recycled' },
  stock: { id: 'stock', label: 'Most still standing', quantity: 'anthropogenicStock', rank: 'most built' },
  crust: { id: 'crust', label: 'Most common in rock', quantity: 'crustalAbundance', rank: 'most common in rock' },
  name: { id: 'name', label: 'A to Z' },
  year: { id: 'year', label: 'Oldest first' },
};

export const DEFAULT_SORT = 'made';

/**
 * The detail panel's sections, in the order they appear. `level` is the point on the
 * detail slider at which a section switches on, so the slider is just a threshold rather
 * than five hand-maintained lists that can drift apart.
 */
export const SECTIONS = [
  { id: 'numbers', label: 'Numbers', level: 0 },
  { id: 'facts', label: 'Did you know', level: 0 },
  { id: 'uses', label: 'What it is for', level: 0 },
  { id: 'since', label: 'Since', level: 1 },
  { id: 'pros', label: 'Good at', level: 1 },
  { id: 'cons', label: 'Not so good', level: 1 },
  { id: 'scale', label: 'That is like', level: 2 },
  { id: 'carbon', label: 'What it costs the air', level: 2 },
  { id: 'lifecycle', label: 'How long it lasts', level: 2 },
  { id: 'properties', label: 'What it is like', level: 3 },
  { id: 'producers', label: 'Where it comes from', level: 3 },
  { id: 'relations', label: 'Linked to', level: 4 },
];

export const DETAIL_LEVELS = ['Just the basics', 'Standard', 'Fuller', 'Detailed', 'Everything'];

/** One glyph per class. Used only where the nine kinds repeat as a set: the totals
 * strip and the settings tabs. Not on cards, which already show a specimen. */
export const CLASS_ICONS = {
  element: '\u269B\uFE0F',
  mineral: '\uD83E\uDEA8',
  alloy: '\uD83D\uDD29',
  ceramic: '\uD83C\uDFFA',
  composite: '\uD83E\uDDF1',
  polymer: '\uD83E\uDDF4',
  biomass: '\uD83C\uDF31',
  fossil: '\uD83D\uDEE2\uFE0F',
  engineered: '\u2697\uFE0F',
};


/** Which sections a given slider position turns on. */
export function sectionsForLevel(level) {
  return SECTIONS.filter((s) => s.level <= level).map((s) => s.id);
}

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

  // Every country that appears as a top producer, for the country filter.
  const countries = [...new Set(materials.flatMap((m) => (m.producers?.top || []).map((t) => t.country)))].sort();

  // Totals per class, so the list can be read as nine buckets instead of 180 rows.
  const byClass = classes
    .map((cls) => {
      const rows = materials.filter((m) => m.class === cls && !m.subsetOf && !m.excludedFromTotal);
      return {
        cls,
        count: materials.filter((m) => m.class === cls).length,
        tonnes: rows.reduce((t, m) => t + (m.quantities.annualProduction?.value || 0), 0),
      };
    })
    .sort((a, b) => b.tonnes - a.tonnes);

  // Deliberately NOT the sum of every material's carbon. Those figures are cradle to gate,
  // so steel's already contains the coal burned to make it and concrete's already contains
  // its cement. Adding them up double counts, and the answer came out above the real world
  // total. The headline uses published global figures instead, exactly as the mass counter
  // uses the IRP extraction figure rather than summing rows.
  const emissions = scales.globals.emissions;
  const materialsShare = scales.globals.materialsShareOfEmissions;
  const co2KgS = (emissions.value * 1000 * materialsShare.value) / SECONDS_PER_YEAR;

  return {
    materials,
    byId,
    sources,
    scales,
    ranks,
    classes,
    countries,
    byClass,
    population: scales.globals.population,
    warnings,
    global: {
      extraction: globalExtraction,
      extractionKgS: (globalExtraction.value * 1000) / SECONDS_PER_YEAR,
      trackedTonnes,
      trackedShare: trackedTonnes / globalExtraction.value,
      co2KgS,
      emissions,
      materialsShare,
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
  const rateKgS = production ? (production.value * 1000) / SECONDS_PER_YEAR : 0;
  const reserves = quantities.reserves;
  return {
    ...m,
    quantities,
    // kilograms per second, the only rate the app uses
    rateKgS,
    // Derived here, never stored, so these cannot disagree with their inputs.
    co2PerYear: m.co2PerKg && production ? production.value * 1000 * m.co2PerKg.value : null,
    co2KgS: m.co2PerKg ? rateKgS * m.co2PerKg.value : 0,
    yearsLeft: reserves && production ? reserves.value / production.value : null,
    haystack: [m.name, ...(m.aka || []), m.class, m.formula || '', m.id].join(' ').toLowerCase(),
    sortYear: m.discovered?.year ?? -1e6,
  };
}

export { SECONDS_PER_YEAR };
