// Text + panel helpers - the blueprint dossier UI language. Every UI surface
// goes through blueprintPanel so the whole game reads as one artifact.

import { PALETTE } from './palette.js';

export const FONT = px => `${px}px ui-monospace, "SF Mono", Menlo, monospace`;
export const FONT_BOLD = px => `bold ${px}px ui-monospace, "SF Mono", Menlo, monospace`;
export const FONT_ITALIC = px => `italic ${px}px ui-monospace, "SF Mono", Menlo, monospace`;

/** draw text; blueprint UIs default to cream */
export function text(ctx, str, x, y, { size = 14, bold = false, italic = false, color = PALETTE.cream, align = 'left', baseline = 'top' } = {}) {
  ctx.font = italic ? FONT_ITALIC(size) : bold ? FONT_BOLD(size) : FONT(size);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * The signature panel: a wood-grain frame around a parchment page (faint ledger
 * rule optional). Name/API kept from the old blueprint theme. Options: frameW
 * (border), deep (aged parchment), grid (rule lines), r (corner radius).
 */
export function blueprintPanel(ctx, x, y, w, h, { frameW = 6, r = 12, deep = false, grid = true } = {}) {
  // wood frame
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = PALETTE.frame;
  ctx.fill();
  // grain streaks
  ctx.save();
  roundRect(ctx, x, y, w, h, r); ctx.clip();
  ctx.strokeStyle = PALETTE.frameDark;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) {
    const gy = y + 3 + i * 2;
    ctx.beginPath(); ctx.moveTo(x, gy); ctx.bezierCurveTo(x + w * 0.3, gy + 1.5, x + w * 0.7, gy - 1.5, x + w, gy + 0.5); ctx.stroke();
    const gy2 = y + h - 3 - i * 2;
    ctx.beginPath(); ctx.moveTo(x, gy2); ctx.bezierCurveTo(x + w * 0.4, gy2 - 1.5, x + w * 0.6, gy2 + 1.5, x + w, gy2 - 0.5); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  roundRect(ctx, x, y, w, h, r);
  ctx.lineWidth = 1.5; ctx.strokeStyle = PALETTE.frameLight; ctx.stroke();

  // parchment page
  const ix = x + frameW, iy = y + frameW, iw = w - frameW * 2, ih = h - frameW * 2;
  roundRect(ctx, ix, iy, iw, ih, Math.max(3, r - frameW));
  ctx.fillStyle = deep ? PALETTE.blueprintDeep : PALETTE.blueprint;
  ctx.fill();
  // aged edge shading
  ctx.save();
  roundRect(ctx, ix, iy, iw, ih, Math.max(3, r - frameW)); ctx.clip();
  const edge = ctx.createLinearGradient(ix, iy, ix, iy + ih);
  edge.addColorStop(0, 'rgba(120,90,50,0.10)');
  edge.addColorStop(0.15, 'rgba(120,90,50,0)');
  edge.addColorStop(0.85, 'rgba(120,90,50,0)');
  edge.addColorStop(1, 'rgba(120,90,50,0.12)');
  ctx.fillStyle = edge; ctx.fillRect(ix, iy, iw, ih);

  if (grid) {
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    const step = 18;
    for (let gy = iy + step; gy < iy + ih; gy += step) { ctx.moveTo(ix, gy); ctx.lineTo(ix + iw, gy); }
    ctx.stroke();
  }
  ctx.restore();
  return { ix, iy, iw, ih };
}

/** small solid chip (no grid) for HUD slivers */
export function chip(ctx, x, y, w, h, { fill = PALETTE.blueprintDeep, r = 8, border = PALETTE.frame } = {}) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (border) { ctx.lineWidth = 3; ctx.strokeStyle = border; ctx.stroke(); }
}

/** measure with a given size (sets font) */
export function measure(ctx, str, size = 14, bold = false) {
  ctx.font = bold ? FONT_BOLD(size) : FONT(size);
  return ctx.measureText(str).width;
}

/** greedy word wrap → array of lines */
export function wrap(ctx, str, maxW, size = 12) {
  ctx.font = FONT(size);
  const words = String(str).split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const probe = line ? line + ' ' + w : w;
    if (ctx.measureText(probe).width > maxW && line) { lines.push(line); line = w; }
    else line = probe;
  }
  if (line) lines.push(line);
  return lines;
}
