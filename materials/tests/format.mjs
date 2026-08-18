// Formatting is the last place a correct number can become a wrong one on screen.
// Run: node tests/format.mjs
import { fmtPpm, fmtBig, fmtRatePlain, fmtProperty, fmtYear } from '../src/format.js';

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

eq('fmtYear BCE', fmtYear(-4000, 'Native nuggets'), '4000 BCE — Native nuggets');
eq('fmtYear null', fmtYear(null, null), 'Prehistoric');

console.log(failures.length ? `\n${failures.length} failure(s)` : '\nformat ok');
process.exit(failures.length ? 1 : 0);
