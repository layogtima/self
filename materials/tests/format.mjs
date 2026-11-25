// Formatting is the last place a correct number can become a wrong one on screen.
// Run: node tests/format.mjs
import { fmtPpm, fmtBig, fmtRatePlain, fmtProperty, fmtYear, propertyNote, fmtLiveMass, runOutRisk } from '../src/format.js';

const failures = [];
const eq = (label, got, want) => {
  const ok = got === want;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} = ${got}${ok ? '' : `  (want ${want})`}`);
  if (!ok) failures.push(label);
};

// A rounding bug here silently misreports the data, so the small values matter most.
eq('fmtPpm(461000)', fmtPpm(461000), '46.1%');
eq('fmtPpm(5650)', fmtPpm(5650), '5,650 ppm');
eq('fmtPpm(404)', fmtPpm(404), '404 ppm');
eq('fmtPpm(1.7)', fmtPpm(1.7), '1.7 ppm');
eq('fmtPpm(0.056)', fmtPpm(0.056), '56 ppb');
eq('fmtPpm(0.0015)', fmtPpm(0.0015), '1.5 ppb');

const big = (value, unit, view) => {
  const { num, words } = fmtBig({ value, unit }, view);
  return `${num} ${words}`.trim();
};
eq('flow 1.885e9 t/yr', big(1.885e9, 't/yr', 'flow'), '1.89 billion tonnes a year');
eq('flow 5e10 t/yr', big(5e10, 't/yr', 'flow'), '50 billion tonnes a year');
eq('made 5.49e11 t', big(5.49e11, 't', 'made'), '549 billion tonnes still standing');
eq('made 2.13e5 t', big(2.13e5, 't', 'made'), '213 thousand tonnes still standing');
eq('crust ppm in a list', big(82300, 'ppm', 'crust'), '8.2% of all rock');
eq('crust ppm in the panel', big(82300, 'ppm', null), '8.2%');

eq('fmtRatePlain(3.359e6)', fmtRatePlain(3.359e6), '3,359 tonnes every second');
eq('fmtRatePlain(0.095)', fmtRatePlain(0.095), '6 kg every minute');

eq('fmtProperty Pa', fmtProperty({ value: 4.0e8, unit: 'Pa' }), '400 MPa');
eq('fmtProperty K', fmtProperty({ value: 1723, unit: 'K' }), '1,450 °C');
eq('fmtProperty kg/m3', fmtProperty({ value: 7850, unit: 'kg/m3' }), '7,850 kg/m³');

eq('fmtYear BCE', fmtYear(-4000, 'Native nuggets'), '4000 BCE · Native nuggets');
eq('fmtYear CE has no separator', fmtYear(1856, null), '1856');
eq('fmtYear approx', fmtYear(-9500, 'Fertile Crescent', true), 'about 9500 BCE · Fertile Crescent');
eq('fmtYear deep prehistory', fmtYear(-400000, null, true), 'about 400,000 BCE');
eq('fmtYear null', fmtYear(null, null), 'Prehistoric');
eq('no em dash from fmtYear', fmtYear(1909, 'Haber-Bosch').includes('\u2014'), false);

// The glosses are computed, so they cannot drift from the number, but they can still be
// nonsense at the edges. Pin the boundaries.
const note = (k, value) => propertyNote(k, { value });
eq('gloss: steel density', note('density', 7850), 'A one-litre carton of it would weigh 7.8 kg. That is 7.8 times a litre of water.');
eq('gloss: cork floats', note('density', 240), 'A one-litre carton of it would weigh 0.24 kg. It floats on water.');
eq('gloss: a gas', note('density', 0.0899), 'A bathtub full of it would weigh about 18 g.');
eq('gloss: steel tensile', note('tensileStrength', 4.0e8), 'A rod of it 1 cm across could hang 46 adults before it snapped.');
eq('gloss: graphene tensile', note('tensileStrength', 1.3e11), 'A rod of it 1 cm across could hang 743 cars before it snapped.');
eq('gloss: weak tensile falls back to kg', note('tensileStrength', 1.0e6), 'A rod of it 1 cm across could hang 8 kg before it snapped.');
eq('gloss: concrete compressive', note('compressiveStrength', 3.0e7), 'A block of it 1 cm across could take 3 adults before it crushed.');
eq('gloss: insulator', note('thermalConductivity', 0.15), 'Barely carries heat at all. It works as an insulator.');
eq('gloss: copper conducts', note('thermalConductivity', 401), 'Carries heat away faster than steel does.');
eq('gloss: mercury is liquid', note('meltingPoint', 234), 'It is not solid at room temperature.');
eq('gloss: tungsten', note('meltingPoint', 3695), 'Almost nothing gets hot enough to melt it.');
eq('gloss: unknown property has none', note('somethingElse', 5), null);

// A personal share of one second is a fraction of a gram; the world's is billions of kilos.
const live = (kg) => { const r = fmtLiveMass(kg); return `${r.num} ${r.unit}`; };
eq('live mass: a share of a second', live(0.00016), '0 g');
eq('live mass: a minute of a share', live(0.024), '24 g');
eq('live mass: kilograms', live(4210), '4,210 kg');
eq('live mass: the world', live(3.4e7), '34,000 t');

const risk = (o) => runOutRisk(o).level;
eq('risk: plenty and recycled', risk({ years: 300, recycled: 0.8, topShare: 0.2 }), 'comfortable');
eq('risk: short but recycled', risk({ years: 20, recycled: 0.8, topShare: 0.2 }), 'watch');
eq('risk: short, unrecycled, concentrated', risk({ years: 15, recycled: 0.02, topShare: 0.8 }), 'tight');
eq('risk: no reserves figure', runOutRisk({ years: null }), null);

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nformat ok');
process.exit(failures.length ? 1 : 0);
