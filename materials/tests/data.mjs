// Schema + sanity check for the MATERIAL dataset. Run: node tests/data.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const { materials } = read('data/materials.json');
const sources = read('data/sources.json');
const scales = read('data/scales.json');

const CLASSES = new Set(['element', 'mineral', 'alloy', 'polymer', 'ceramic', 'composite', 'biomass', 'engineered', 'fossil']);
const RECIPES = new Set(['metal', 'glass', 'stone', 'ceramic', 'wood', 'paper', 'polymer', 'rubber', 'carbon', 'fibre', 'crystal', 'semiconductor', 'gas', 'liquid']);
const QUANTITY_UNITS = { crustalAbundance: 'ppm', anthropogenicStock: 't', annualProduction: 't/yr', reserves: 't' };
const KINDS = new Set(['extraction', 'manufacture']);

const errors = [];
const fail = (msg) => errors.push(msg);

const checkQ = (where, q, expectedUnit) => {
  if (typeof q.value !== 'number' || !Number.isFinite(q.value) || q.value <= 0) fail(`${where}: value must be a positive finite number, got ${JSON.stringify(q.value)}`);
  if (typeof q.unit !== 'string' || !q.unit) fail(`${where}: missing unit`);
  if (expectedUnit && q.unit !== expectedUnit) fail(`${where}: unit should be "${expectedUnit}", got "${q.unit}"`);
  if (!q.source_id) fail(`${where}: missing source_id`);
  else if (!sources[q.source_id]) fail(`${where}: unknown source_id "${q.source_id}"`);
  if (q.year != null && (typeof q.year !== 'number' || q.year < 1800 || q.year > 2100)) fail(`${where}: implausible year ${q.year}`);
};

const ids = new Set();
const scaleIds = new Set(scales.objects.map((o) => o.id));

for (const m of materials) {
  const at = `[${m.id}]`;
  if (!m.id || ids.has(m.id)) fail(`${at}: missing or duplicate id`);
  ids.add(m.id);
  if (!m.name) fail(`${at}: missing name`);
  if (!CLASSES.has(m.class)) fail(`${at}: unknown class "${m.class}"`);
  if (!Array.isArray(m.aka)) fail(`${at}: aka must be an array`);

  const q = m.quantities || {};
  for (const [key, val] of Object.entries(q)) {
    if (val == null) continue;
    if (!(key in QUANTITY_UNITS)) fail(`${at}: unknown quantity "${key}"`);
    checkQ(`${at}.${key}`, val, QUANTITY_UNITS[key]);
    if (key === 'annualProduction' && !KINDS.has(val.kind)) fail(`${at}.annualProduction: kind must be "extraction" or "manufacture"`);
    if (val.derived && !val.note) fail(`${at}.${key}: derived quantities must carry a note explaining the derivation`);
  }
  if (!q.crustalAbundance && !q.anthropogenicStock && !q.annualProduction) fail(`${at}: has no quantity in any of the three views`);

  for (const [key, val] of Object.entries(m.properties || {})) checkQ(`${at}.properties.${key}`, val);
  if (!Array.isArray(m.facts) || m.facts.length === 0) fail(`${at}: needs at least one fact`);
  for (const [i, f] of (m.facts || []).entries()) {
    if (!f.text) fail(`${at}.facts[${i}]: missing text`);
    if (!sources[f.source_id]) fail(`${at}.facts[${i}]: unknown source_id "${f.source_id}"`);
  }
  if (m.discovered && !sources[m.discovered.source_id]) fail(`${at}.discovered: unknown source_id`);

  if (!m.specimen || !RECIPES.has(m.specimen.recipe)) fail(`${at}: specimen.recipe must be one of ${[...RECIPES].join(', ')}`);
  if (!/^#[0-9a-f]{6}$/i.test(m.specimen?.color || '')) fail(`${at}: specimen.color must be a #rrggbb hex`);
  if (typeof m.specimen?.seed !== 'number') fail(`${at}: specimen.seed must be a number`);

  for (const s of m.scale || []) {
    if (!scaleIds.has(s.against)) fail(`${at}.scale: unknown comparison object "${s.against}"`);
    if (!m.quantities?.[s.quantity]) fail(`${at}.scale: references missing quantity "${s.quantity}"`);
  }
  for (const [rel, list] of Object.entries(m.relations || {})) {
    for (const other of list) if (!materials.some((x) => x.id === other)) fail(`${at}.relations.${rel}: unknown material "${other}"`);
  }
}

// Sanity: extraction tracked here must not exceed the global IRP figure, and should be the same order of magnitude.
const global = scales.globals.extraction.value;
const tracked = materials.reduce((sum, m) => {
  const p = m.quantities?.annualProduction;
  return sum + (p && p.kind === 'extraction' ? p.value : 0);
}, 0);
if (tracked > global) fail(`tracked extraction ${tracked.toExponential(2)} t/yr exceeds the global figure ${global.toExponential(2)} t/yr`);
if (tracked < global / 10) fail(`tracked extraction ${tracked.toExponential(2)} t/yr is under a tenth of the global figure — coverage too thin to be honest about`);
if (global < 1e10 || global > 3e11) fail(`global extraction ${global.toExponential(2)} t/yr is outside the plausible 10–300 Gt/yr band`);

for (const [id, s] of Object.entries(sources)) {
  if (!s.title || !s.publisher || !s.url) fail(`sources.${id}: needs title, publisher and url`);
  if (!/^https:\/\//.test(s.url)) fail(`sources.${id}: url must be https`);
}
for (const o of scales.objects) {
  if (typeof o.mass_t !== 'number' || o.mass_t <= 0) fail(`scales.${o.id}: mass_t must be a positive number`);
}

console.log(`${materials.length} materials, ${Object.keys(sources).length} sources, ${scales.objects.length} scale objects`);
console.log(`tracked extraction: ${(tracked / 1e9).toFixed(1)} Gt/yr of a global ${(global / 1e9).toFixed(0)} Gt/yr (${((tracked / global) * 100).toFixed(0)}%)`);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error('  ' + e);
  process.exit(1);
}
console.log('data ok');
