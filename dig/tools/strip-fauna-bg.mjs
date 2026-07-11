// strip-fauna-bg.mjs (v5.7) — kill the white box on the animated fauna sheets.
//
// The 4 surface-walker walk-cycles (grazer/hopper/lizard/wader) came from an
// out-of-repo animation step that shipped a FULLY-OPAQUE near-white background
// (alpha=255 everywhere). The renderer blits the frame verbatim, so the world
// shows a white box around each creature. This tool rewrites them as true RGBA:
// decode the sheet, edge-flood-fill the light background of EACH 64px frame to
// alpha 0 (flood-fill, not a global threshold, so interior whites — eyes,
// highlights — survive), keep the baked grass tuft (it's not white), and
// re-encode as a color-type-6 PNG. Zero dependencies: Node's built-in zlib.
//
// Run:  node tools/strip-fauna-bg.mjs
// Source of truth = assets/gen/fauna/<id>_anim_v001.png ; output overwrites the
// live assets/sprites/fauna/<id>.png. Re-runnable (reads from gen/, not live).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IDS = ['grazer', 'hopper', 'lizard', 'wader'];   // the 4 opaque walk-cycles
const FRAME = 64;

// -- CRC32 (PNG chunks) -------------------------------------------------------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

// -- decode PNG → { width, height, rgba:Uint8Array } (8-bit, non-interlaced) ---
function decodePng(buf) {
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (buf[i] !== SIG[i]) throw new Error('not a PNG');
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); bitDepth = data[8]; colorType = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;   // len + type(4) + data + crc(4)
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} unsupported`);
  if (interlace !== 0) throw new Error('interlaced PNG unsupported');
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`colorType ${colorType} unsupported (need RGB/RGBA/gray)`);

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = channels, stride = width * bpp;
  const un = new Uint8Array(height * stride);
  const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };
  let rp = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[rp++];
    for (let x = 0; x < stride; x++) {
      const v = raw[rp++];
      const a = x >= bpp ? un[y * stride + x - bpp] : 0;
      const b = y > 0 ? un[(y - 1) * stride + x] : 0;
      const c = (x >= bpp && y > 0) ? un[(y - 1) * stride + x - bpp] : 0;
      let val;
      switch (f) {
        case 0: val = v; break;
        case 1: val = v + a; break;
        case 2: val = v + b; break;
        case 3: val = v + ((a + b) >> 1); break;
        case 4: val = v + paeth(a, b, c); break;
        default: throw new Error(`filter ${f} unsupported`);
      }
      un[y * stride + x] = val & 0xFF;
    }
  }
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    let r, g, b, al;
    if (colorType === 6) { r = un[i * 4]; g = un[i * 4 + 1]; b = un[i * 4 + 2]; al = un[i * 4 + 3]; }
    else if (colorType === 2) { r = un[i * 3]; g = un[i * 3 + 1]; b = un[i * 3 + 2]; al = 255; }
    else if (colorType === 0) { r = g = b = un[i]; al = 255; }
    else { r = g = b = un[i * 2]; al = un[i * 2 + 1]; }
    rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = al;
  }
  return { width, height, rgba };
}

// -- encode RGBA → PNG (color-type 6, one None-filtered scanline per row) ------
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y++) { raw[y * (stride + 1)] = 0; raw.set(rgba.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;   // 8-bit RGBA
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// -- the strip: per-frame edge flood-fill of the light background --------------
// background = light + low-saturation (catches pure white AND the cream corners).
const isBg = (rgba, i) => {
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
  return r >= 228 && g >= 222 && b >= 200 && (Math.max(r, g, b) - Math.min(r, g, b)) <= 40;
};
const isNearWhite = (rgba, i) => {   // stricter, for the anti-alias fringe cleanup
  const r = rgba[i * 4], g = rgba[i * 4 + 1], b = rgba[i * 4 + 2];
  return r >= 236 && g >= 230 && b >= 214;
};

function stripFrames(img) {
  const { width, height, rgba } = img;
  const cols = Math.max(1, Math.round(width / FRAME)), rows = Math.max(1, Math.round(height / FRAME));
  const fw = Math.round(width / cols), fh = Math.round(height / rows);
  const stack = [];
  const flood = (x0, y0, x1, y1) => {
    const push = (x, y) => { const i = y * width + x; if (rgba[i * 4 + 3] !== 0 && isBg(rgba, i)) { rgba[i * 4 + 3] = 0; stack.push(i); } };
    for (let x = x0; x < x1; x++) { push(x, y0); push(x, y1 - 1); }   // top + bottom edges
    for (let y = y0; y < y1; y++) { push(x0, y); push(x1 - 1, y); }   // left + right edges
    while (stack.length) {
      const i = stack.pop(), x = i % width, y = (i / width) | 0;
      if (x + 1 < x1) push(x + 1, y);
      if (x - 1 >= x0) push(x - 1, y);
      if (y + 1 < y1) push(x, y + 1);
      if (y - 1 >= y0) push(x, y - 1);
    }
  };
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    flood(cx * fw, cy * fh, Math.min(width, cx * fw + fw), Math.min(height, cy * fh + fh));
  }
  // fringe cleanup: near-white opaque pixels touching a transparent one (the
  // 1px AA halo the hard threshold leaves behind) → transparent. Two passes.
  for (let pass = 0; pass < 2; pass++) {
    const kill = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (rgba[i * 4 + 3] === 0 || !isNearWhite(rgba, i)) continue;
      const clear = (x + 1 < width && rgba[(i + 1) * 4 + 3] === 0) || (x > 0 && rgba[(i - 1) * 4 + 3] === 0)
        || (y + 1 < height && rgba[(i + width) * 4 + 3] === 0) || (y > 0 && rgba[(i - width) * 4 + 3] === 0);
      if (clear) kill.push(i);
    }
    for (const i of kill) rgba[i * 4 + 3] = 0;
  }
}

// -- run ----------------------------------------------------------------------
let ok = 0;
for (const id of IDS) {
  const src = join(ROOT, 'assets/gen/fauna', `${id}_anim_v001.png`);
  const dst = join(ROOT, 'assets/sprites/fauna', `${id}.png`);
  if (!existsSync(src)) { console.warn(`SKIP ${id}: no source ${src}`); continue; }
  const img = decodePng(readFileSync(src));
  const before = countAlpha0(img.rgba);
  stripFrames(img);
  const after = countAlpha0(img.rgba);
  writeFileSync(dst, encodePng(img.width, img.height, img.rgba));
  const pct = ((after - before) / (img.width * img.height) * 100).toFixed(1);
  console.log(`✓ ${id}  ${img.width}x${img.height}  transparent: ${(before / (img.width * img.height) * 100).toFixed(1)}% → ${(after / (img.width * img.height) * 100).toFixed(1)}%  (stripped ${pct}%)`);
  ok++;
}
function countAlpha0(rgba) { let n = 0; for (let i = 3; i < rgba.length; i += 4) if (rgba[i] === 0) n++; return n; }
console.log(`\nDone: ${ok}/${IDS.length} sheets rewritten to assets/sprites/fauna/`);
