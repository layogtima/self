// Number and quantity formatting. Nothing else in the app formats a number.

const SI = [
  { v: 1e12, s: 'T' },
  { v: 1e9, s: 'G' },
  { v: 1e6, s: 'M' },
  { v: 1e3, s: 'k' },
];

/** 1.885e9 -> { num: "1.89", prefix: "G" } */
export function siParts(value, digits = 2) {
  const abs = Math.abs(value);
  for (const { v, s } of SI) {
    if (abs >= v) return { num: trim(value / v, digits), prefix: s };
  }
  return { num: trim(value, abs < 1 ? 4 : digits), prefix: '' };
}

function trim(n, digits) {
  const abs = Math.abs(n);
  const d = abs >= 100 ? 0 : abs >= 10 ? 1 : digits;
  return n.toFixed(d).replace(/\.0+$/, '');
}

export function commas(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function fmtPpm(ppm) {
  if (ppm >= 10000) return `${(ppm / 10000).toFixed(1)}%`;
  // Group thousands, but never through commas() — it rounds, and 1.7 ppm of tin is not 2.
  if (ppm >= 1) return `${Number(trim(ppm, 1)).toLocaleString('en-US')} ppm`;
  if (ppm >= 0.001) return `${trim(ppm * 1000, 1)} ppb`;
  return `${ppm.toExponential(1)} ppm`;
}

/** kg/s -> a human phrase, choosing the unit so the number stays legible */
export function fmtRate(kgPerSecond) {
  if (kgPerSecond >= 1000) {
    const { num, prefix } = siParts(kgPerSecond / 1000);
    return `${num} ${prefix}t per second`;
  }
  if (kgPerSecond >= 1) return `${trim(kgPerSecond, 1)} kg per second`;
  if (kgPerSecond * 60 >= 1) return `${trim(kgPerSecond * 60, 1)} kg per minute`;
  if (kgPerSecond * 3600 >= 1) return `${trim(kgPerSecond * 3600, 1)} kg per hour`;
  return `${trim(kgPerSecond * 86400, 2)} kg per day`;
}

const WORD_SCALES = [
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand'],
];

/**
 * A quantity in plain words: "4.4" + "billion tonnes a year". "Gt/yr" is correct and
 * unreadable; this is the version you can hand to a six-year-old.
 */
export function fmtBig(q, viewId) {
  // The detail table's row label already says "In the ground"; don't say it twice.
  if (q.unit === 'ppm') return { num: fmtPpm(q.value), words: viewId ? 'of all rock' : '' };
  const tail = viewId === 'flow' ? ' a year' : viewId === 'made' ? ' still standing' : '';
  for (const [v, word] of WORD_SCALES) {
    if (q.value >= v) return { num: trim(q.value / v, 2), words: `${word} tonnes${tail}` };
  }
  return { num: commas(q.value), words: `tonnes${tail}` };
}

/** "3,359 tonnes every second" — the headline version of a rate. */
export function fmtRatePlain(kgPerSecond) {
  const t = kgPerSecond / 1000;
  if (t >= 1) return `${commas(t)} tonnes every second`;
  if (kgPerSecond >= 1) return `${commas(kgPerSecond)} kg every second`;
  return `${commas(kgPerSecond * 60)} kg every minute`;
}

/** A physical property, given its SI value and unit. */
export function fmtProperty(q) {
  const { value, unit } = q;
  switch (unit) {
    case 'Pa': {
      const { num, prefix } = siParts(value);
      return `${num} ${prefix}Pa`;
    }
    case 'K':
      return `${commas(value - 273.15)} °C`;
    case 'kg/m3':
      return `${commas(value)} kg/m³`;
    case 'W/(m·K)':
      return `${value >= 10 ? commas(value) : value} W/(m·K)`;
    default:
      return `${trim(value, 2)} ${unit}`;
  }
}

export const PROPERTY_LABELS = {
  density: 'Heaviness',
  tensileStrength: 'Pull strength',
  compressiveStrength: 'Squash strength',
  thermalConductivity: 'Heat flow',
  meltingPoint: 'Melts at',
};

export const QUANTITY_LABELS = {
  crustalAbundance: 'In the ground',
  anthropogenicStock: 'Still standing',
  annualProduction: 'Made each year',
  reserves: 'Left to dig',
};

/** "USGS 2023" — the credit shown beside every number. */
export function credit(q, sources) {
  const s = sources[q.source_id];
  const who = s ? s.publisher : q.source_id;
  return q.year ? `${who} ${q.year}` : who;
}

export function fmtYear(year, era) {
  if (year == null) return era || 'Prehistoric';
  const label = year < 0 ? `${Math.abs(year)} BCE` : `${year}`;
  return era ? `${label} — ${era}` : label;
}

/** HTML-escape. Everything that builds markup from data goes through this. */
export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
