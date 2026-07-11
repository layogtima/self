// The species dossier card - the game's signature UI artifact (blueprint grid,
// big specimen art, name plate, geologic timeline bar with a period marker, and
// a real-length line). Three modes:
//   'unknown' - discovery pop: dark silhouette, ? UNKNOWN SPECIMEN
//   'full' - analyzer reveal / collection detail: everything
// Used by scenes/game.js overlays and the collection detail view.

import { TILE } from '../config.js';
import { PALETTE, RARITY_COLORS } from './palette.js';
import { blueprintPanel, text, wrap, measure, roundRect } from './text.js';
import { drawFossil } from './sprites.js';
import { drawBone, boneFootprint } from './bones.js';
import { STRATA, STRATA_BY_ID } from '../content/strata.js';

// visor chrome shared with render/hud.js (THE VISOR v5)
const V = { chrome: '#241C16', deep: '#171210', cyan: '#4BE3E8', line: 'rgba(233,220,188,0.14)' };
const CATEGORY_GLYPH = { creature: '§', flora: '¥', feature: '¤', fluid: '≈', rock: '≡', salvage: '¶' };

/**
 * Codex card v2 - DG-3 FIELD ANALYSIS. A visor-native plate (chamfered chrome,
 * corner brackets, scanline sweep) instead of parchment: header band, big name,
 * framed illustration, LIVE TELEMETRY for a scanned individual (age gauge /
 * state / mood), the science in a readout grid, and the archive's flavor line
 * (lore.json, one variant per opening) as a quote block.
 * @param {(ctx,entry,x,y,size,time)=>void} [drawArt]  render/codexart.js hook
 * @param {{live?:{age,lifespan,state,mood}|null, openT?:number}} [opts]
 */
export function drawCodexCard(ctx, entry, x, y, w, h, drawArt, time = 0, opts = {}) {
  const { live = null, openT = 1 } = opts;
  const CUT = 26;
  ctx.save();
  // plate: dark chrome, one chamfered corner - the visor's own material
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w - CUT, y); ctx.lineTo(x + w, y + CUT);
  ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  ctx.fillStyle = V.chrome; ctx.fill();
  ctx.strokeStyle = 'rgba(240,169,59,0.6)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.clip();
  // faint plotting grid
  ctx.strokeStyle = 'rgba(233,220,188,0.04)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let gx = x + 24; gx < x + w; gx += 24) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); }
  for (let gy = y + 24; gy < y + h; gy += 24) { ctx.moveTo(x, gy); ctx.lineTo(x + w, gy); }
  ctx.stroke();

  // header band
  ctx.fillStyle = V.deep; ctx.fillRect(x, y, w, 22);
  ctx.fillStyle = V.cyan; ctx.fillRect(x, y + 22, w, 1);
  text(ctx, 'DG-3 · FIELD ANALYSIS', x + 12, y + 6, { size: 10, bold: true, color: V.cyan });
  text(ctx, `${CATEGORY_GLYPH[entry.category] || '·'} ${entry.category.toUpperCase()}`, x + w - CUT - 8, y + 6,
    { size: 10, bold: true, color: PALETTE.amberSoft, align: 'right' });

  // name plate
  text(ctx, entry.name, x + 14, y + 32, { size: 21, bold: true, color: PALETTE.amber });

  // illustration inset (top-right): framed, with scanner corner brackets
  const as = 76, ax2 = x + w - as - 18, ay2 = y + 34;
  if (drawArt) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(ax2 - 4, ay2 - 4, as + 8, as + 8);
    drawArt(ctx, entry, ax2, ay2, as, time);
    ctx.strokeStyle = V.cyan; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (const [bx, by2, sx, sy] of [[ax2 - 4, ay2 - 4, 1, 1], [ax2 + as + 4, ay2 - 4, -1, 1], [ax2 - 4, ay2 + as + 4, 1, -1], [ax2 + as + 4, ay2 + as + 4, -1, -1]]) {
      ctx.moveTo(bx + sx * 7, by2); ctx.lineTo(bx, by2); ctx.lineTo(bx, by2 + sy * 7);
    }
    ctx.stroke();
    // idle scan line drifting over the specimen
    const sy2 = ay2 + ((time * 18) % (as + 4)) - 2;
    ctx.fillStyle = 'rgba(75,227,232,0.14)';
    ctx.fillRect(ax2 - 3, sy2, as + 6, 1.6);
  }

  // ---- left column ------------------------------------------------------
  const lx = x + 16, colW = w - as - 56;
  let ry = y + 60;
  if (live) {
    // LIVE TELEMETRY: this individual, right now
    text(ctx, 'LIVE TELEMETRY', lx, ry, { size: 9, bold: true, color: V.cyan }); ry += 14;
    const ageClass = live.age < 0.35 ? 'JUVENILE' : live.age < 0.75 ? 'ADULT' : live.age < 1 ? 'ELDER' : 'FADING';
    // age gauge: pixel cells filled to lived fraction
    text(ctx, 'AGE', lx, ry, { size: 10, color: PALETTE.creamDim });
    const gx0 = lx + 44, cells = 10;
    for (let c = 0; c < cells; c++) {
      ctx.fillStyle = live.age > (c + 0.5) / cells ? PALETTE.amber : 'rgba(0,0,0,0.5)';
      ctx.fillRect(gx0 + c * 8, ry + 1, 6, 7);
    }
    text(ctx, ageClass, gx0 + cells * 8 + 8, ry, { size: 10, bold: true, color: PALETTE.parchment });
    ry += 15;
    for (const [label, val, col] of [['STATE', live.state.toUpperCase(), PALETTE.parchment], ['MOOD', live.mood, live.mood === 'TERRIFIED' || live.mood === 'TERRITORIAL' ? '#E88A6A' : '#9FBE9A']]) {
      text(ctx, label, lx, ry, { size: 10, color: PALETTE.creamDim });
      text(ctx, val, lx + 44, ry, { size: 10, bold: true, color: col });
      ry += 15;
    }
    ctx.fillStyle = V.line; ctx.fillRect(lx, ry + 2, colW, 1);
    ry += 10;
  }
  // the science: label/value readout rows
  for (const [label, val] of (entry.stats || []).slice(0, live ? 4 : 6)) {
    text(ctx, label.toUpperCase(), lx, ry, { size: 9, color: PALETTE.creamDim });
    text(ctx, val, lx + colW, ry, { size: 10, bold: true, align: 'right', color: PALETTE.parchment });
    ctx.fillStyle = V.line; ctx.fillRect(lx, ry + 12, colW, 1);
    ry += 17;
  }

  // ---- the archive speaks: flavor quote block (anchored to the bottom) ----
  const qLines = wrap(ctx, entry.blurb, w - 56, 11).slice(0, 4);
  const qH = qLines.length * 15 + 16;
  const qy = y + h - qH - 24;
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, x + 14, qy, w - 28, qH, 6); ctx.fill();
  ctx.fillStyle = PALETTE.amberSoft; ctx.fillRect(x + 14, qy, 2, qH);
  let qly = qy + 8;
  for (const line of qLines) { text(ctx, line, x + 26, qly, { size: 11, italic: true, color: PALETTE.cream }); qly += 15; }

  // footer strip
  ctx.fillStyle = V.deep; ctx.fillRect(x, y + h - 16, w, 16);
  text(ctx, `ARCHIVE ${entry.id.toUpperCase()}`, x + 12, y + h - 12, { size: 8, color: PALETTE.creamDim });
  text(ctx, live ? 'PATTERN STORED · SPECIMEN UNHARMED' : 'PATTERN STORED', x + w - 12, y + h - 12, { size: 8, color: PALETTE.creamDim, align: 'right' });

  // boot sweep: a bright scanline crosses the plate as the analysis lands
  if (openT < 0.5) {
    const sw = (openT / 0.5) * h;
    ctx.fillStyle = 'rgba(75,227,232,0.22)';
    ctx.fillRect(x, y + sw, w, 2.4);
    ctx.fillStyle = `rgba(75,227,232,${(0.08 * (1 - openT / 0.5)).toFixed(3)})`;
    ctx.fillRect(x, y, w, sw);
  }
  ctx.restore();
}

/**
 * @param {'unknown'|'full'} mode
 * @param {object} spec  FossilSpec
 */
export function drawSpeciesCard(ctx, mode, spec, x, y, w, h, makeCanvas, time = 0) {
  const { ix, iy, iw, ih } = blueprintPanel(ctx, x, y, w, h, { frameW: 8, r: 16 });
  const stratum = STRATA_BY_ID[spec.period];
  const unknown = mode === 'unknown';

  // header strip
  text(ctx, unknown ? 'FOSSIL DISCOVERED' : 'SPECIMEN DOSSIER', ix + 14, iy + 10,
    { size: 12, bold: true, color: PALETTE.creamDim });
  text(ctx, `${stratum.era} · ${stratum.mya[0]}–${stratum.mya[1]} mya`, ix + iw - 14, iy + 10,
    { size: 12, bold: true, color: PALETTE.amberSoft, align: 'right' });

  // ---- specimen art (left) --------------------------------------------------
  const artBox = { x: ix + 14, y: iy + 34, w: Math.min(iw * 0.46, 250), h: ih - 118 };
  const [fw, fh] = spec.footprint;
  const scale = Math.min(artBox.w / (fw * TILE), artBox.h / (fh * TILE), 3.2);
  const aw = fw * TILE * scale, ah = fh * TILE * scale;
  const ax = artBox.x + (artBox.w - aw) / 2, ay = artBox.y + (artBox.h - ah) / 2;

  // pedestal ellipse
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(ax + aw / 2, ay + ah + 8, aw * 0.55, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  if (unknown) {
    drawTinted(ctx, spec, ax, ay, makeCanvas, scale, '#1E2C45');
    // pulsing "?" over the silhouette
    const pulse = 0.75 + Math.sin(time * 5) * 0.25;
    ctx.globalAlpha = pulse;
    text(ctx, '?', ax + aw / 2, ay + ah / 2, { size: 44, bold: true, color: PALETTE.amber, align: 'center', baseline: 'middle' });
    ctx.globalAlpha = 1;
  } else {
    drawFossil(ctx, spec, ax, ay, makeCanvas, scale);
  }

  // ---- info column (right) --------------------------------------------------
  const rx = ix + Math.max(iw * 0.46, 264) + 24;
  const rw = ix + iw - rx - 14;
  let ry = iy + 44;

  if (unknown) {
    text(ctx, 'Encased specimen recovered.', rx, ry, { size: 14, bold: true }); ry += 24;
    text(ctx, 'Matrix: ' + stratum.era + ' rock', rx, ry, { size: 12, color: PALETTE.creamDim }); ry += 18;
    text(ctx, 'Identity: unknown', rx, ry, { size: 12, color: PALETTE.creamDim }); ry += 30;
    text(ctx, 'Run it through the lab - ', rx, ry, { size: 12, color: PALETTE.creamDim }); ry += 16;
    text(ctx, 'clean, then analyze.', rx, ry, { size: 12, color: PALETTE.creamDim });
  } else {
    // rarity chip
    ctx.fillStyle = RARITY_COLORS[spec.rarity];
    roundRect(ctx, rx, ry, 10 + measure(ctx, spec.rarity.toUpperCase(), 10, true), 16, 6);
    ctx.fill();
    text(ctx, spec.rarity.toUpperCase(), rx + 5, ry + 4, { size: 10, bold: true, color: '#2A2733' });
    ry += 26;
    // blurb
    for (const line of wrap(ctx, spec.blurb, rw, 13)) {
      text(ctx, line, rx, ry, { size: 13 });
      ry += 18;
    }
    ry += 8;
    // SCALE: the probe silhouette beside the fossil at relative size (the ref's
    // orange-figure moment). Probe ≈ 1.8 m tall as the yardstick.
    const lenStr = spec.lengthM >= 1 ? `${spec.lengthM} m` : `${Math.round(spec.lengthM * 100)} cm`;
    const scaleBoxH = 40, scaleY = ry + scaleBoxH;
    const pxPerM = Math.min(14, (scaleBoxH - 6) / 1.8);           // probe fills the box height
    const probeH = 1.8 * pxPerM, probeW = probeH * 0.7;
    const fossilLenPx = Math.min(rw - probeW - 40, Math.max(10, spec.lengthM * pxPerM));
    // ground line
    ctx.strokeStyle = PALETTE.frameDark; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(rx, scaleY); ctx.lineTo(rx + rw, scaleY); ctx.stroke();
    // probe silhouette (amber) as the human-scale stand-in
    ctx.fillStyle = PALETTE.amber;
    ctx.fillRect(rx, scaleY - probeH, probeW * 0.5, probeH);
    ctx.beginPath(); ctx.arc(rx + probeW * 0.25, scaleY - probeH - 2, probeW * 0.28, 0, Math.PI * 2); ctx.fill();
    // fossil length bracket
    const bx = rx + probeW + 12;
    ctx.strokeStyle = PALETTE.cream; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx, scaleY - 10); ctx.lineTo(bx, scaleY);
    ctx.lineTo(bx + fossilLenPx, scaleY); ctx.lineTo(bx + fossilLenPx, scaleY - 10);
    ctx.stroke();
    text(ctx, lenStr, bx + fossilLenPx / 2, scaleY - 24, { size: 14, bold: true, align: 'center' });
    ctx.textAlign = 'left';
    ry = scaleY + 8;
    text(ctx, `museum value · ${spec.value} pts`, rx, ry, { size: 11, color: PALETTE.creamDim });
  }

  // ---- geologic timeline bar (bottom-left, above the name plate) -------------
  const tlY = iy + ih - 66, tlX = ix + 14, tlW = Math.min(iw * 0.5, 260), tlH = 12;
  const perIdx = STRATA.findIndex(s => s.id === spec.period);
  STRATA.forEach((s, i) => {
    const segX = tlX + (i / STRATA.length) * tlW;
    const segW = tlW / STRATA.length;
    ctx.fillStyle = s.colors.base;
    ctx.fillRect(segX, tlY, segW - 1, tlH);
  });
  ctx.strokeStyle = PALETTE.frameDark;
  ctx.lineWidth = 2;
  ctx.strokeRect(tlX, tlY, tlW, tlH);
  // marker ▼ on the period
  const mx = tlX + ((perIdx + 0.5) / STRATA.length) * tlW;
  ctx.fillStyle = PALETTE.amber;
  ctx.beginPath();
  ctx.moveTo(mx, tlY - 2); ctx.lineTo(mx - 5, tlY - 10); ctx.lineTo(mx + 5, tlY - 10);
  ctx.closePath(); ctx.fill();
  text(ctx, unknown ? 'period detected' : stratum.era, tlX, tlY + tlH + 4, { size: 10, color: PALETTE.creamDim });

  // ---- name plate (bottom) ----------------------------------------------------
  const npY = y + h - 44;
  roundRect(ctx, x + 14, npY, w - 28, 34, 10);
  ctx.fillStyle = PALETTE.frameDark;
  ctx.fill();
  if (unknown) {
    text(ctx, '? ? ? ? ?', x + 30, npY + 8, { size: 20, bold: true, color: PALETTE.creamDim });
    text(ctx, 'specimen undetermined', x + w - 30, npY + 12, { size: 11, italic: true, color: PALETTE.creamDim, align: 'right' });
  } else {
    text(ctx, spec.name, x + 30, npY + 7, { size: 20, bold: true, color: PALETTE.amberSoft });
    text(ctx, spec.latin, x + w - 30, npY + 12, { size: 12, italic: true, color: PALETTE.creamDim, align: 'right' });
  }
}

/**
 * Mini recovery card - the corner toast (~290×92). Deliberately anonymous:
 * no species, no bone name. Just what a field instrument would measure - 
 * size, weight, condition - derived deterministically from the specimen.
 */
export function drawMiniCard(ctx, spec, x, y, w, h, makeCanvas, time = 0, bone = 'bone', boneIndex = 0) {
  const stratum = STRATA_BY_ID[spec.period];
  const { ix, iy, iw, ih } = blueprintPanel(ctx, x, y, w, h, { frameW: 5, r: 10, grid: false });

  // measured properties (stable per specimen+bone)
  const hash = n => (((Math.imul(spec.id.length * 31 + boneIndex, 2654435761) + n * 40503) >>> 0) % 1000) / 1000;
  const nBones = (spec.bones || ['piece']).length;
  const sizeM = (spec.lengthM / nBones) * (0.55 + hash(1) * 0.9);
  const weightKg = Math.max(0.02, Math.pow(sizeM, 2.4) * (30 + hash(2) * 40));
  const sizeStr = sizeM >= 1 ? `${sizeM.toFixed(1)} m` : `${Math.max(1, Math.round(sizeM * 100))} cm`;
  const weightStr = weightKg >= 1000 ? `${(weightKg / 1000).toFixed(1)} t` : weightKg >= 1 ? `${weightKg.toFixed(1)} kg` : `${Math.round(weightKg * 1000)} g`;
  const condition = ['mineralized', 'permineralized', 'compressed', 'encrusted'][Math.floor(hash(3) * 4)];

  // the actual recovered bone, left
  const [bfw, bfh] = boneFootprint(bone);
  const bsc = Math.min(46 / (bfw * TILE), (ih - 12) / (bfh * TILE), 1.4);
  drawBone(ctx, spec, bone, ix + 30 - bfw * TILE * bsc / 2, iy + ih / 2 - bfh * TILE * bsc / 2, makeCanvas, bsc);
  const pulse = 0.6 + Math.sin(time * 5) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.amber;
  ctx.beginPath(); ctx.arc(ix + 12, iy + 14, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  const tx = ix + 62;
  // size with ↔ bracket icon
  ctx.strokeStyle = PALETTE.cream; ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(tx, iy + 16); ctx.lineTo(tx + 12, iy + 16);
  ctx.moveTo(tx + 2.5, iy + 13); ctx.lineTo(tx, iy + 16); ctx.lineTo(tx + 2.5, iy + 19);
  ctx.moveTo(tx + 9.5, iy + 13); ctx.lineTo(tx + 12, iy + 16); ctx.lineTo(tx + 9.5, iy + 19);
  ctx.stroke();
  text(ctx, sizeStr, tx + 20, iy + 10, { size: 13, bold: true });
  // weight with a little scale-pan icon
  ctx.beginPath();
  ctx.moveTo(tx + 6, iy + 30); ctx.lineTo(tx + 6, iy + 36);
  ctx.moveTo(tx, iy + 31); ctx.lineTo(tx + 12, iy + 31);
  ctx.arc(tx + 1.5, iy + 34, 2.5, Math.PI, 0, true);
  ctx.arc(tx + 10.5, iy + 34, 2.5, Math.PI, 0, true);
  ctx.stroke();
  text(ctx, weightStr, tx + 20, iy + 26, { size: 13, bold: true });

  text(ctx, condition, tx, iy + 48, { size: 10, italic: true, color: PALETTE.creamDim });
  // age dots instead of era name
  text(ctx, `${stratum.mya[0] >= 1 ? Math.round(stratum.mya[0]) : stratum.mya[0]}–${Math.round(stratum.mya[1])} million years`, tx, iy + 62, { size: 9, color: PALETTE.creamDim });
}

/** draw the fossil silhouette re-tinted to one flat colour (unknown mode) */
function drawTinted(ctx, spec, dx, dy, makeCanvas, scale, color) {
  const [fw, fh] = spec.footprint;
  const w = Math.ceil(fw * TILE * scale), h = Math.ceil(fh * TILE * scale);
  const tmp = makeCanvas(w, h);
  const tc = tmp.getContext('2d');
  drawFossil(tc, spec, 0, 0, makeCanvas, scale);
  tc.globalCompositeOperation = 'source-atop';
  tc.fillStyle = color;
  tc.fillRect(0, 0, w, h);
  ctx.drawImage(tmp, dx, dy);
}
