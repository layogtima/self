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
  // Group thousands, but never through commas(), it rounds, and 1.7 ppm of tin is not 2.
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
/**
 * Per-person mode divides everything between everyone alive. It is applied here, once, so
 * no caller can forget it and no figure can be half-converted.
 */
let perPerson = null;
export function setPerPerson(population) {
  perPerson = population;
}

function scaled(value, unit) {
  if (!perPerson || unit === 'ppm' || unit === 'fraction') return value;
  return value / perPerson;
}

export function fmtBig(q, viewId) {
  // The detail table's row label already says "In the ground"; don't say it twice.
  if (q.unit === 'ppm') return { num: fmtPpm(q.value), words: viewId ? 'of all rock' : '' };
  const value = scaled(q.value, q.unit);
  const tail = viewId === 'flow' ? ' a year' : viewId === 'made' ? ' still standing' : '';
  // A personal share of most things is a few kilograms, so drop below tonnes when needed.
  if (perPerson && value < 1) {
    const kg = value * 1000;
    if (kg >= 1) return { num: trim(kg, 1), words: `kg${tail}` };
    return { num: trim(kg * 1000, 0), words: `grams${tail}` };
  }
  for (const [v, word] of WORD_SCALES) {
    if (value >= v) return { num: trim(value / v, 2), words: `${word} tonnes${tail}` };
  }
  return { num: commas(value), words: `tonnes${tail}` };
}

/**
 * A live mass that might be a fraction of a gram (one person's share of a second) or
 * billions of kilograms (the world's). Number and unit come back separately so the counter
 * keeps its two-part layout.
 */
export function fmtLiveMass(kg) {
  if (kg < 1) return { num: commas(kg * 1000), unit: 'g' };
  if (kg < 1e6) return { num: commas(kg), unit: 'kg' };
  return { num: commas(kg / 1000), unit: 't' };
}

/** "3,359 tonnes every second", the headline version of a rate. */
export function fmtRatePlain(kgPerSecond) {
  const t = kgPerSecond / 1000;
  if (t >= 1) return `${commas(t)} tonnes every second`;
  if (kgPerSecond >= 1) return `${commas(kgPerSecond)} kg every second`;
  return `${commas(kgPerSecond * 60)} kg every minute`;
}

/** Carbon, in the smallest sensible unit: grams for the featherweights, tonnes for gold. */
export function fmtCarbon(kgPerKg) {
  if (kgPerKg >= 1000) return `${commas(kgPerKg / 1000)} t CO2e`;
  if (kgPerKg >= 1) return `${trim(kgPerKg, 2)} kg CO2e`;
  return `${commas(kgPerKg * 1000)} g CO2e`;
}

/**
 * "Running out" is the most abused number in this field, so say what it actually means.
 * Reserves are what is worth digging at today's price, not what exists.
 */
export function fmtYearsLeft(years) {
  if (years >= 1000) return `over 1,000 years at today's rate`;
  return `about ${Math.round(years)} years at today's rate`;
}

/**
 * How likely this is to actually run out. Deliberately not a score: the old version of this
 * site had unsourced 1-to-10 "sustainability" ratings and they were meaningless. This is a
 * rule over three sourced numbers, and it always shows the numbers it used.
 *
 * `years`   reserves / annual production
 * `recycled` share of supply that comes back round, 0 to 1
 * `topShare` share of world output from the single largest producer, 0 to 1
 */
export function runOutRisk({ years, recycled = 0, topShare = 0 }) {
  if (!years) return null;
  // Each reason carries the weight it added, so the sentence can lead with whatever is
  // actually driving the verdict rather than always starting with the years.
  const reasons = [];
  const add = (weight, text) => reasons.push({ weight, text });

  if (years < 30) add(2, `only ${Math.round(years)} years of reserves at today's rate`);
  else if (years < 80) add(1, `${Math.round(years)} years of reserves at today's rate`);
  else add(0, `${years >= 1000 ? 'over 1,000' : Math.round(years)} years of reserves at today's rate`);

  if (recycled >= 0.5) add(-1, `${Math.round(recycled * 100)}% of it comes back round`);
  else if (recycled > 0 && recycled < 0.1) add(1, 'barely any of it is recycled');

  if (topShare >= 0.6) add(1, `${Math.round(topShare * 100)}% comes from one country`);

  const score = reasons.reduce((t, r) => t + r.weight, 0);
  const level = score >= 3 ? 'tight' : score >= 1 ? 'watch' : 'comfortable';
  const verdict = { tight: 'Genuinely tight.', watch: 'Worth watching.', comfortable: 'Unlikely to run out.' }[level];

  const ordered = [...reasons].sort((a, b) => b.weight - a.weight).map((r) => r.text);
  const why = ordered.length > 1 ? `${ordered.slice(0, -1).join(', ')} and ${ordered.at(-1)}` : ordered[0];
  return { level, verdict, reason: `${verdict} ${why.charAt(0).toUpperCase()}${why.slice(1)}.` };
}

export const RESERVES_CAVEAT =
  'Reserves are what is worth digging at today\'s price, not everything that exists. ' +
  'The figure has gone up for most materials over the last century, because higher prices and better ' +
  'machinery keep turning rock nobody wanted into ore.';

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

const ADULT = 70;   // kg
const CAR = 1400;   // kg
const ROD_AREA = Math.PI * 0.005 ** 2; // a rod 1 cm across, in m2

const plural = (n, one, many) => `${commas(n)} ${n === 1 ? one : many}`;

/** How much a rod 1 cm across could carry, in things a person can picture. */
function loadForce(pascals) {
  const kg = (pascals * ROD_AREA) / 9.81;
  if (kg < 25) return `${Math.round(kg)} kg`;
  if (kg < ADULT * 400) return plural(Math.round(kg / ADULT), 'adult', 'adults');
  return plural(Math.round(kg / CAR), 'car', 'cars');
}

/**
 * A plain-language gloss under a physical property. Computed, never written by hand, so
 * it can never drift away from the number it is describing.
 */
export function propertyNote(key, q) {
  const v = q.value;
  if (key === 'density') {
    if (v < 100) {
      // Gases: a litre of one weighs nothing anybody can picture.
      const bath = v * 0.2; // 200 litres
      return `A bathtub full of it would weigh about ${bath < 1 ? `${Math.round(bath * 1000)} g` : `${bath.toFixed(1)} kg`}.`;
    }
    const perLitre = v / 1000;
    const vsWater = v / 1000;
    const float = v < 1000 ? ' It floats on water.' : '';
    const times = vsWater >= 2 ? ` That is ${vsWater.toFixed(1)} times a litre of water.` : '';
    return `A one-litre carton of it would weigh ${perLitre < 1 ? perLitre.toFixed(2) : perLitre.toFixed(1)} kg.${times}${float}`;
  }
  if (key === 'tensileStrength') {
    return `A rod of it 1 cm across could hang ${loadForce(v)} before it snapped.`;
  }
  if (key === 'compressiveStrength') {
    return `A block of it 1 cm across could take ${loadForce(v)} before it crushed.`;
  }
  if (key === 'thermalConductivity') {
    // Anchors people have actually touched: a wooden spoon, a glass, a metal spoon.
    if (v < 1) return 'Barely carries heat at all. It works as an insulator.';
    if (v < 20) return 'Carries heat slowly, about like glass or brick.';
    if (v < 100) return 'Carries heat fast, about like a metal spoon in hot tea.';
    return 'Carries heat away faster than steel does.';
  }
  if (key === 'meltingPoint') {
    if (v < 290) return 'It is not solid at room temperature.';
    if (v < 600) return 'A kitchen oven would melt it.';
    if (v < 1100) return 'A wood fire would melt it.';
    if (v < 2000) return 'It takes a furnace to melt.';
    return 'Almost nothing gets hot enough to melt it.';
  }
  return null;
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
  deliberate: 'Made on purpose',
  reserves: 'Left to dig',
};

/** Nobody makes water, coal or iron ore; they are taken. Say which. */
export function quantityLabel(key, q) {
  if (key === 'annualProduction') {
    if (q?.kind === 'extraction' || q?.kind === 'withdrawal') return 'Taken each year';
    // Nobody sets out to make fly ash or carbon dioxide.
    if (q?.kind === 'byproduct') return 'Made by accident';
  }
  return QUANTITY_LABELS[key];
}

/** "USGS 2023", the credit shown beside every number. */
export function credit(q, sources) {
  const s = sources[q.source_id];
  const who = s ? s.publisher : q.source_id;
  return q.year ? `${who} ${q.year}` : who;
}

export function fmtYear(year, era, approx = false) {
  if (year == null) return era || 'Prehistoric';
  // Years are not written with separators (1856, not 1,856); prehistory is (400,000 BCE).
  const abs = Math.abs(year);
  const n = abs >= 10000 ? abs.toLocaleString('en-US') : String(abs);
  const label = `${approx ? 'about ' : ''}${year < 0 ? `${n} BCE` : n}`;
  return era ? `${label} · ${era}` : label;
}

/** HTML-escape. Everything that builds markup from data goes through this. */
export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
