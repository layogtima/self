#!/usr/bin/env node
// RetroDiffusion asset generator for Diggg. Zero dependencies.
//
//   node tools/generate-assets.mjs --dry                  cost estimate, no generation
//   node tools/generate-assets.mjs                        generate everything missing
//   node tools/generate-assets.mjs --only tiles           tiles | fossils | probe
//   node tools/generate-assets.mjs --id trilobite         one specific asset (forces a new version)
//   node tools/generate-assets.mjs --promote trilobite 2  copy gen/<...>_v002.png to the live path
//
// Never wastes an image: every result is saved as assets/gen/<cat>/<id>_vNNN.png
// and logged in assets/gen/manifest.json. Generation SKIPS ids that already have
// any saved version (use --id to force more takes). New ids auto-promote to the
// live path if nothing is there yet.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { FOSSILS } = await import(join(ROOT, 'src/content/fossils.js'));
const { STRATA } = await import(join(ROOT, 'src/content/strata.js'));

const API = 'https://api.retrodiffusion.ai/v1';
const GEN = join(ROOT, 'assets/gen');
const MANIFEST = join(GEN, 'manifest.json');

// ---------------------------------------------------------------- key / args
function apiKey() {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^retro\s*=\s*(.+)$/m);
  if (!m) throw new Error('no `retro=` key in dig/.env');
  return m[1].trim();
}

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const opt = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const DRY = flag('--dry');
const ONLY = opt('--only');
const ONE_ID = opt('--id');


// ---------------------------------------------------------------- palette.png
// Minimal zero-dep PNG encoder (8-bit RGB) — writes the palette strip that all
// generations pass as input_palette, so every asset is born in-palette (TIGHT).
function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })());
  c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, rgb) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 3)] = 0;
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (1 + w * 3) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// the game's curated palette (strata ramps + UI + greens + bone + ink)
const GAME_COLORS = [
  '#B5AC9C', '#7E7466', '#D9C49A', '#A98F5F', '#E0B586', '#B0804E', '#E2DCC0', '#B1A882',
  '#AFC49E', '#758D60', '#D49C87', '#A1614A', '#A29AB2', '#68607D', '#96B0C5', '#59788F',
  '#A3A1B6', '#6B6980', '#A3859A', '#6A4D60', '#F2EBD7', '#CFC5A9', '#F0A93B', '#8E96A4',
  '#33303E', '#7FA86A', '#5F8A54', '#8A6A4F', '#6E4F33', '#E9DCBC', '#3B2F22', '#1D2433',
];
function writePalettePng() {
  const w = GAME_COLORS.length, h = 4;
  const rgb = Buffer.alloc(w * h * 3);
  GAME_COLORS.forEach((hex, i) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    for (let y = 0; y < h; y++) { const o = (y * w + i) * 3; rgb[o] = r; rgb[o + 1] = g; rgb[o + 2] = b; }
  });
  const png = encodePng(w, h, rgb);
  mkdirSync(GEN, { recursive: true });
  writeFileSync(join(GEN, 'palette.png'), png);
  return png.toString('base64');
}

// ---------------------------------------------------------------- prompts
// Fossil art prompts: as close to the actual specimen as possible.
const FOSSIL_PROMPTS = {
  'mammoth': 'woolly mammoth complete fossil skeleton with long curved tusks, side view, bones',
  'smilodon': 'saber-toothed cat fossil skeleton with huge fangs, crouched side view, bones',
  'giant-sloth': 'giant ground sloth megatherium fossil skeleton standing, side view, bones',
  'eohippus': 'tiny dawn horse eohippus fossil skeleton, side view, bones',
  'titanoboa': 'enormous coiled snake fossil skeleton, titanoboa vertebrae spiral, bones',
  'basilosaurus': 'long serpentine early whale basilosaurus fossil skeleton, side view, bones',
  't-rex': 'tyrannosaurus rex complete fossil skeleton, huge skull with teeth, side view, bones',
  'triceratops': 'triceratops fossil skeleton with three horns and neck frill, side view, bones',
  'mosasaur': 'mosasaurus marine reptile fossil skeleton with paddle fins, side view, bones',
  'amber-insect': 'insect trapped in golden amber gemstone, translucent orange resin',
  'stegosaurus': 'stegosaurus fossil skeleton with back plates and tail spikes, side view, bones',
  'diplodocus': 'diplodocus sauropod fossil skeleton with very long neck and whip tail, side view',
  'archaeopteryx': 'archaeopteryx fossil imprint in limestone slab with feather impressions and spread wings',
  'ammonite': 'ammonite spiral shell fossil, ridged coil, cross section',
  'coelophysis': 'coelophysis small slender dinosaur fossil skeleton, side view, bones',
  'phytosaur': 'phytosaur crocodile-like fossil skeleton with long toothy snout, side view, bones',
  'dimetrodon': 'dimetrodon fossil skeleton with tall sail spines on back, side view, bones',
  'meganeura': 'giant dragonfly meganeura fossil imprint with four wings in stone slab',
  'fern-frond': 'fossilized fern frond imprint in dark coal shale, detailed leaves',
  'dunkleosteus': 'dunkleosteus armored fish fossil, huge bony head plates with blade jaws, side view',
  'eurypterid': 'sea scorpion eurypterid fossil with paddle limbs and segmented tail in stone',
  'trilobite': 'trilobite fossil, segmented ribbed oval shell, top view, in stone',
  'anomalocaris': 'anomalocaris cambrian predator fossil with grasping arms and lobed body, top view',
  'stromatolite': 'stromatolite fossil, layered banded dome rock cross-section',
  'dickinsonia': 'dickinsonia fossil imprint, ribbed oval ediacaran organism, top view in sandstone',
  // — the anthropocene: their artifacts, our specimens —
  'human': 'human skeleton fossil, homo sapiens, standing pose, side view, bones',
  'smartphone': 'old broken smartphone with cracked dark screen, ancient artifact, dirt',
  'plastic-bottle': 'crushed clear plastic water bottle, ancient artifact',
  'sneaker': 'old worn sneaker shoe, ancient artifact, side view',
  'house-cat': 'cat skeleton fossil, felis catus, sitting pose, side view, bones',
  'pigeon': 'pigeon bird skeleton fossil, side view, bones',
  'car-tyre': 'old worn car tyre with deep treads, ancient rubber artifact',
};

// Stratum texture prompts: real geology, virtually fun.
const TILE_PROMPTS = {
  'anthropocene': 'compacted urban rubble soil with concrete chunks, brick fragments, wire bits, grey brown',
  'quaternary': 'dense wet loam topsoil with small roots and pebbles, dark warm brown',
  'paleogene': 'soft tan sandstone with fine sediment layers, pale orange',
  'cretaceous': 'white chalk rock with small shell fragments, ivory cream',
  'jurassic': 'pale green-grey limestone with faint ammonite fragments',
  'triassic': 'red siltstone with fine dusty layers, terracotta',
  'carboniferous': 'dark coal seam with black shiny chunks in grey shale, purple-grey',
  'devonian': 'blue-grey marine shale with thin ripple layers',
  'cambrian': 'ancient grey slate with fine mineral veins, cool lilac grey',
  'precambrian': 'dark basement gneiss rock with quartz crystal veins, dusty plum',
};

// ---------------------------------------------------------------- jobs
let PALETTE_B64 = '';
function buildJobs() {
  PALETTE_B64 = PALETTE_B64 || writePalettePng();
  const jobs = [];
  for (const f of FOSSILS) {
    const [fw, fh] = f.footprint;
    jobs.push({
      cat: 'fossils', id: f.id,
      livePath: join(ROOT, 'assets/sprites/fossils', `${f.id}.png`),
      payload: {
        prompt: FOSSIL_PROMPTS[f.id] || `${f.name} fossil skeleton, side view, bones`,
        width: Math.max(16, Math.min(128, fw * 16)),
        height: Math.max(16, Math.min(128, fh * 16)),
        num_images: 1,
        prompt_style: 'rd_fast__mc_item',
        remove_bg: true,
      },
    });
  }
  for (const s of STRATA) {
    jobs.push({
      cat: 'tiles', id: s.id,
      livePath: join(ROOT, 'assets/tiles', `${s.id}.png`),
      payload: {
        prompt: TILE_PROMPTS[s.id] || `${s.era} rock texture`,
        width: 64, height: 64, num_images: 1,
        prompt_style: 'rd_fast__texture',
        tile_x: true, tile_y: true,
      },
    });
  }
  // master terrain textures — ONE style, palette-ramped per stratum in-game
  for (const [id, prompt] of [
    ['master-a', 'cracked dry dirt with rounded chunky clods separated by deep dark crack lines, flat chunky pixel art, warm brown'],
    ['master-b', 'chunky rounded stone cobbles packed tight with dark gaps between, flat pixel art, warm brown'],
    ['master-c', 'compacted soil with embedded rounded pebbles and thick dark fracture lines, flat pixel art'],
  ]) {
    jobs.push({
      cat: 'tiles', id,
      livePath: id === 'master-a' ? join(ROOT, 'assets/tiles/master.png') : null,
      payload: {
        prompt, width: 64, height: 64, num_images: 1,
        prompt_style: 'rd_fast__texture', tile_x: true, tile_y: true,
        input_palette: PALETTE_B64,
      },
    });
  }

  // scenery — trees per biome + dressing (platformer ref canopies)
  for (const [id, prompt, w, h] of [
    ['tree-badlands', 'single bushy round-canopy tree with thick trunk, lush green leaves, side view game asset', 64, 80],
    ['tree-conifer', 'single tall pine conifer tree, dark green with pale dusting, side view game asset', 64, 96],
    ['tree-palm', 'single palm tree with curved trunk and fan fronds, side view game asset', 64, 80],
    ['bush', 'small round leafy green bush, side view game asset', 64, 64],
    ['boulder', 'rounded grey mossy boulder rock, side view game asset', 64, 64],
    ['flowers', 'cluster of pink and white wildflowers with green stems, side view game asset', 64, 64],
    // the seven-biome wave (v4 M3)
    ['tree-mangrove', 'single mangrove tree standing on tall stilted arching roots above wet ground, dense green canopy, side view game asset', 64, 80],
    ['tree-acacia', 'single acacia tree with wide flat umbrella canopy on a slender trunk, savanna, side view game asset', 64, 88],
    ['tree-deadsnag', 'single dead bleached tree snag, bare twisted branches, no leaves, ashen, side view game asset', 64, 88],
    ['tree-shardspire', 'tall pale violet crystal spire growing from the ground like a tree, faceted translucent mineral, faint glow, side view game asset', 64, 96],
    ['reeds', 'small clump of tall marsh reeds with brown cattail heads, side view game asset', 64, 64],
    ['shard', 'small cluster of pale violet crystal shards jutting from the ground, side view game asset', 64, 64],
  ]) {
    jobs.push({
      cat: 'scenery', id,
      livePath: join(ROOT, 'assets/sprites/scenery', `${id}.png`),
      payload: { prompt, width: w, height: h, num_images: 1, prompt_style: 'rd_fast__game_asset', remove_bg: true, input_palette: PALETTE_B64 },
    });
  }

  // fauna (v5.5): bespoke creature sprites for the hero species - a clean
  // side-view critter, transparent bg, in-palette; the renderer flips + scales
  // + bobs it and layers reaction emojis, so one crisp frame reads as alive.
  // (generic-drawn kinds + revenant stay procedural.)
  for (const [id, prompt] of [
    ['grazer', 'a small deer-like herbivore creature, tan and soft brown fur, slender legs, tiny nub antlers, standing side view, cute storybook game creature sprite, facing right'],
    ['wader', 'a tall wading stilt bird, pale blue-grey plumage, long thin legs, long slender neck, small head, standing side view, storybook game creature sprite, facing right'],
    ['lizard', 'a small basking lizard, smooth muted green scales, four splayed legs, long tail, side view, storybook game creature sprite, facing right'],
    ['hopper', 'a small round frog, olive and moss green, big eyes, mid-hop crouch, side view, storybook game creature sprite, facing right'],
    ['spider', 'a tailless whip spider amblypygid, dark charcoal flat body, two long thin feeler front legs, side view, eerie but harmless, storybook game creature sprite, facing right'],
    ['mudskipper', 'a mudskipper fish with front fins like little arms, olive-tan, big top eyes, side view, no ground, plain transparent background, storybook game creature sprite, facing right'],
  ]) {
    jobs.push({
      cat: 'fauna', id,
      livePath: join(ROOT, 'assets/sprites/fauna', `${id}.png`),
      payload: { prompt, width: 64, height: 64, num_images: 1, prompt_style: 'rd_fast__game_asset', remove_bg: true, input_palette: PALETTE_B64 },
    });
  }

  // biome backdrops (v4.8): SIMPLE, seamlessly HORIZONTALLY-TILING horizon
  // silhouettes - a low band of distant terrain that repeats forever behind the
  // ground. Minimal + transparent-topped so the sky owns the upper screen.
  const bd = 'minimal distant horizon silhouette band, low simple rolling hills at the bottom third, very few elements, flat muted colours, mostly empty sky above, seamless tileable, no characters, no foreground';
  for (const [id, prompt] of [
    ['tundra', `${bd}, faint snowy peaks and a dark conifer treeline`],
    ['wetland', `${bd}, low misty marsh flats and reed banks`],
    ['badlands', `${bd}, low striped mesa buttes in warm tan`],
    ['savanna', `${bd}, flat golden plain with tiny flat-top acacia silhouettes`],
    ['ashflats', `${bd}, low grey ash plain with a faint distant cinder cone`],
    ['crystal', `${bd}, pale gypsum dunes with small violet crystal spire silhouettes`],
    ['coast', `${bd}, low green headlands meeting a calm sea horizon`],
  ]) {
    jobs.push({
      cat: 'backdrops', id: `backdrop-${id}`,
      livePath: join(ROOT, 'assets/sprites/backdrops', `${id}.png`),
      payload: { prompt, width: 256, height: 128, num_images: 1, prompt_style: 'rd_fast__default', tile_x: true, input_palette: PALETTE_B64 },
    });
  }

  // lab station machines
  for (const [id, prompt] of [
    ['station-clean', 'small wooden workbench with brushes, dental picks and a fossil tray, side view game asset'],
    ['station-analyze', 'wooden desk with brass microscope and anatomy comparison charts, side view game asset'],
    ['station-prep', 'small rig with glue bottles, clamps and consolidant applicator, side view game asset'],
    ['station-showcase', 'museum skeleton mount armature stand with brass fittings on wooden base, side view game asset'],
  ]) {
    jobs.push({
      cat: 'stations', id,
      livePath: join(ROOT, 'assets/sprites/stations', `${id}.png`),
      payload: { prompt, width: 64, height: 64, num_images: 1, prompt_style: 'rd_fast__game_asset', remove_bg: true, input_palette: PALETTE_B64 },
    });
  }

  // UI textures
  jobs.push({
    cat: 'ui', id: 'table-wood',
    livePath: join(ROOT, 'assets/sprites/ui/table-wood.png'),
    payload: {
      prompt: 'seamless dark walnut wood plank texture, deep espresso brown, fine horizontal wood grain lines, one subtle knot',
      width: 64, height: 64, num_images: 1,
      prompt_style: 'rd_fast__texture', tile_x: true, tile_y: true,
      input_palette: PALETTE_B64,
    },
  });

  // social share card (Open Graph / Twitter). Wide 16:9 pixel scene.
  jobs.push({
    cat: 'social', id: 'og-card',
    livePath: join(ROOT, 'assets/og.png'),
    payload: {
      prompt: 'wide cutaway pixel art scene: a small boxy robot probe with tank treads digging through layered rock strata underground, glowing dinosaur bones and fossils half-buried in the earth, pastel blueprint palette, cheerful storybook paleontology, cross-section of soil layers with grass and trees on top and a warm sky',
      width: 512, height: 288, num_images: 1,
      prompt_style: 'rd_fast__game_asset',
      input_palette: PALETTE_B64,
    },
  });

  jobs.push({
    cat: 'characters', id: 'probe',
    livePath: null,   // not wired into the game yet; saved for later
    payload: {
      prompt: 'small boxy robot probe with one glowing lens eye, antenna, tank treads, digging scoop arm',
      width: 128, height: 128, num_images: 1,
      prompt_style: 'rd_fast__character_turnaround',
    },
  });
  let out = jobs;
  if (ONLY) out = out.filter(j => j.cat === ONLY || (ONLY === 'probe' && j.id === 'probe'));
  if (ONE_ID) out = out.filter(j => j.id === ONE_ID);
  return out;
}

// ---------------------------------------------------------------- versioned saves
function nextVersionPath(cat, id) {
  const dir = join(GEN, cat);
  mkdirSync(dir, { recursive: true });
  const existing = readdirSync(dir).filter(f => f.startsWith(`${id}_v`) && f.endsWith('.png'));
  const n = existing.length
    ? Math.max(...existing.map(f => parseInt(f.match(/_v(\d+)\.png$/)?.[1] || '0', 10))) + 1
    : 1;
  return { path: join(dir, `${id}_v${String(n).padStart(3, '0')}.png`), version: n, hasAny: existing.length > 0 };
}

function loadManifest() {
  try { return JSON.parse(readFileSync(MANIFEST, 'utf8')); } catch { return { entries: [] }; }
}
function saveManifest(m) {
  mkdirSync(GEN, { recursive: true });
  writeFileSync(MANIFEST, JSON.stringify(m, null, 2));
}

// ---------------------------------------------------------------- api
async function post(payload, key) {
  const res = await fetch(`${API}/inferences`, {
    method: 'POST',
    headers: { 'X-RD-Token': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(body.detail || body)}`);
  return body;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------- promote
function promote(id, version) {
  const jobs = buildJobs();
  const job = jobs.find(j => j.id === id);
  if (!job || !job.livePath) throw new Error(`unknown or unwireable id: ${id}`);
  const src = join(GEN, job.cat, `${id}_v${String(version).padStart(3, '0')}.png`);
  if (!existsSync(src)) throw new Error(`no such version: ${src}`);
  mkdirSync(dirname(job.livePath), { recursive: true });
  copyFileSync(src, job.livePath);
  console.log(`promoted ${src} -> ${job.livePath}`);
}

// ---------------------------------------------------------------- main
async function main() {
  if (flag('--promote')) {
    const i = args.indexOf('--promote');
    promote(args[i + 1], parseInt(args[i + 2] || '1', 10));
    return;
  }

  const key = apiKey();
  const status = await (await fetch(`${API}/status`)).json();
  console.log('rd_fast status:', status.status?.rd_fast);
  if (status.status?.rd_fast === 'down') throw new Error('rd_fast is down; try later');

  const jobs = buildJobs();
  const manifest = loadManifest();
  let totalCost = 0, generated = 0, skipped = 0;

  for (const job of jobs) {
    const { path, version, hasAny } = nextVersionPath(job.cat, job.id);
    if (hasAny && !ONE_ID) { skipped++; continue; }   // never re-spend on an id we already have

    if (DRY) {
      const est = await post({ ...job.payload, check_cost: true }, key);
      totalCost += est.balance_cost;
      console.log(`[dry] ${job.cat}/${job.id} ~$${est.balance_cost}`);
      await sleep(250);
      continue;
    }

    process.stdout.write(`gen ${job.cat}/${job.id} v${version} … `);
    try {
      const res = await post(job.payload, key);
      const b64 = res.base64_images?.[0];
      if (!b64) throw new Error('no image in response');
      writeFileSync(path, Buffer.from(b64, 'base64'));
      totalCost += res.balance_cost || 0;
      generated++;
      manifest.entries.push({
        id: job.id, cat: job.cat, file: path.replace(ROOT + '/', ''),
        version, prompt: job.payload.prompt, cost: res.balance_cost,
        created_at: res.created_at, remaining_balance: res.remaining_balance,
      });
      saveManifest(manifest);
      // auto-promote if nothing live yet
      if (job.livePath && !existsSync(job.livePath)) {
        mkdirSync(dirname(job.livePath), { recursive: true });
        copyFileSync(path, job.livePath);
      }
      console.log(`ok ($${res.balance_cost}, balance $${res.remaining_balance})`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
    await sleep(650);
  }

  console.log(`\n${DRY ? 'estimated' : 'spent'} $${totalCost.toFixed(3)} · generated ${generated} · skipped ${skipped} (already have versions)`);
}

main().catch(e => { console.error(e.message); process.exit(1); });
