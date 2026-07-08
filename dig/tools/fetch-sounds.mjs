#!/usr/bin/env node
// Fetch ambient sounds from Freesound (APIv2, token auth) for Diggg.
//
//   node tools/fetch-sounds.mjs           download anything missing
//   node tools/fetch-sounds.mjs --force   re-download everything
//   node tools/fetch-sounds.mjs --dry     just list what would be picked
//
// We download PREVIEWS (hq mp3) — no OAuth2 needed — save them to
// assets/sounds/<name>.mp3, record attribution in assets/sounds/credits.json,
// and regenerate CREDITS.md. Only CC0 + CC-BY licences are accepted (both are
// safe to ship; CC-BY needs the credit we generate).

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/sounds');
const MANIFEST = join(OUT, 'credits.json');

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DRY = args.includes('--dry');
const REFETCH = (() => { const i = args.indexOf('--refetch'); return i >= 0 ? (args[i + 1] || '').split(',').filter(Boolean) : []; })();

function token() {
  const m = readFileSync(join(ROOT, '.env'), 'utf8').match(/^freesound_secret\s*=\s*(.+)$/m);
  if (!m) throw new Error('no `freesound_secret=` in dig/.env');
  return m[1].trim();
}

// Only these licences are accepted (safe to ship; CC-BY credited in CREDITS.md).
const OK_LICENCE = /creativecommons\.org\/(publicdomain\/zero|licenses\/by)\b/;
const licenceLabel = url =>
  /publicdomain\/zero/.test(url) ? 'CC0' :
  /licenses\/by\//.test(url) ? 'CC-BY' : 'other';

// each need: local name, search query, duration window, loopability hint
const NEEDS = [
  { name: 'rain-loop', query: 'gentle rain ambience seamless loop', dur: [10, 90] },
  { name: 'wind-loop', query: 'soft wind ambience seamless loop', dur: [10, 90] },
  { name: 'crickets-night', query: 'crickets night ambience distant loop', dur: [10, 90] },
  { name: 'forest-day', query: 'forest birds ambience', dur: [15, 180] },
  { name: 'cave-ambience', query: 'cave ambience quiet', dur: [15, 180] },
  { name: 'water-stream', query: 'water trickle small', dur: [10, 120] },
  { name: 'lava-bubbling', query: 'soft bubbling mud loop', dur: [5, 90] },
];

async function api(url, tok) {
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'token=' + tok);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const VOCAL = /voice|speech|speak|talk|vocal|singing|chant|narrat|podcast|conversation|acapella/i;
async function pick(need, tok) {
  const filter = `duration:[${need.dur[0]} TO ${need.dur[1]}]`;
  const url = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(need.query)}`
    + `&filter=${encodeURIComponent(filter)}`
    + `&fields=id,name,username,license,previews,duration,tags`
    + `&sort=score&page_size=60`;
  const data = await api(url, tok);
  for (const r of data.results || []) {
    if (!OK_LICENCE.test(r.license) || !r.previews || !r.previews['preview-hq-mp3']) continue;
    const hay = `${r.name} ${(r.tags || []).join(' ')}`;
    if (VOCAL.test(hay)) continue;                 // skip anything that reads vocal/speech
    return r;
  }
  return null;
}

async function download(previewUrl) {
  const res = await fetch(previewUrl);
  if (!res.ok) throw new Error(`download HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function loadManifest() { try { return JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { return {}; } }

function writeCredits(manifest) {
  const rows = Object.entries(manifest)
    .map(([name, m]) => `- **${name}** — “${m.title}” by [${m.author}](https://freesound.org/people/${encodeURIComponent(m.author)}/) · ${m.licence} · [freesound #${m.id}](${m.url})`)
    .join('\n');
  const md = `# Credits\n\n## Sound\n\nAmbient sound effects sourced from [Freesound](https://freesound.org) `
    + `under Creative Commons licences (CC0 / CC-BY). Thank you to the creators:\n\n${rows}\n\n`
    + `All other sound is synthesized in-engine (see \`src/core/audio.js\`, \`music.js\`).\n\n`
    + `## Pixel art\n\nTerrain, fossils, scenery and station art generated with `
    + `[RetroDiffusion](https://retrodiffusion.ai) and hand-tuned; procedural fallbacks in \`src/render/\`.\n`;
  writeFileSync(join(ROOT, 'CREDITS.md'), md);
}

async function main() {
  const tok = token();
  mkdirSync(OUT, { recursive: true });
  const manifest = loadManifest();
  let got = 0, skipped = 0, spent = 0;

  for (const need of NEEDS) {
    const file = join(OUT, `${need.name}.mp3`);
    if (REFETCH.includes(need.name)) { try { if (existsSync(file)) rmSync(file); } catch { /* ok */ } delete manifest[need.name]; }
    if (existsSync(file) && !FORCE && !REFETCH.includes(need.name)) { skipped++; continue; }
    process.stdout.write(`${need.name}: searching… `);
    let r;
    try { r = await pick(need, tok); } catch (e) { console.log('search failed:', e.message); continue; }
    if (!r) { console.log('no CC0/CC-BY match'); continue; }
    console.log(`#${r.id} "${r.name}" by ${r.username} (${licenceLabel(r.license)})`);
    manifest[need.name] = {
      id: r.id, title: r.name, author: r.username,
      licence: licenceLabel(r.license), licenceUrl: r.license,
      url: `https://freesound.org/s/${r.id}/`,
    };
    if (DRY) continue;
    try {
      const buf = await download(r.previews['preview-hq-mp3']);
      writeFileSync(file, buf);
      got++; spent++;
    } catch (e) { console.log('  download failed:', e.message); }
    await new Promise(res => setTimeout(res, 1100));   // stay under the rate limit
  }

  if (!DRY) { writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2)); writeCredits(manifest); }
  console.log(`\n${DRY ? 'would fetch' : 'fetched'} ${got}, skipped ${skipped}. manifest: ${Object.keys(manifest).length} entries.`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
