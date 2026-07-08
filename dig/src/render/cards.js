// The species dossier card — the game's signature UI artifact (blueprint grid,
// big specimen art, name plate, geologic timeline bar with a period marker, and
// a real-length line). Three modes:
//   'unknown' — discovery pop: dark silhouette, ? UNKNOWN SPECIMEN
//   'full'    — analyzer reveal / collection detail: everything
// Used by scenes/game.js overlays and the collection detail view.

import { TILE } from '../config.js';
import { PALETTE, RARITY_COLORS } from './palette.js';
import { blueprintPanel, text, wrap, measure, roundRect } from './text.js';
import { drawFossil } from './sprites.js';
import { STRATA, STRATA_BY_ID } from '../content/strata.js';

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
    text(ctx, 'Run it through the lab —', rx, ry, { size: 12, color: PALETTE.creamDim }); ry += 16;
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
 * Mini bone-recovery card — the corner toast (~290×92). Shows the bone you just
 * pulled from the ground, unidentified. No freeze.
 */
export function drawMiniCard(ctx, spec, x, y, w, h, makeCanvas, time = 0, bone = 'bone') {
  const stratum = STRATA_BY_ID[spec.period];
  const { ix, iy, iw, ih } = blueprintPanel(ctx, x, y, w, h, { frameW: 5, r: 10, grid: false });

  // a little bone icon, left
  const cx = ix + 30, cy = iy + ih / 2;
  ctx.save();
  ctx.translate(cx, cy); ctx.rotate(-0.5);
  ctx.fillStyle = PALETTE.frame;
  ctx.fillRect(-12, -3, 24, 6);
  ctx.beginPath(); ctx.arc(-12, 0, 5, 0, Math.PI * 2); ctx.arc(12, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const pulse = 0.6 + Math.sin(time * 5) * 0.3;
  ctx.globalAlpha = pulse;
  ctx.fillStyle = PALETTE.amber;
  ctx.beginPath(); ctx.arc(ix + 12, iy + 14, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // copy, right
  const tx = ix + 62;
  text(ctx, 'BONE RECOVERED', tx, iy + 10, { size: 10, bold: true, color: PALETTE.amber });
  text(ctx, `? ${bone}`, tx, iy + 26, { size: 14, bold: true });
  text(ctx, `${stratum.era} matrix`, tx, iy + 46, { size: 10, color: PALETTE.creamDim });
  text(ctx, 'collate the set at the lab', tx, iy + 60, { size: 9, color: PALETTE.creamDim });
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
