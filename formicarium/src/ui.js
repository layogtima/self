// The DG-3 field-station UI — a precision lab instrument for reading + talking to
// the colony. All hand-drawn on the 2D canvas: chamfered chrome panels, a smooth
// glowing pheromone-field overlay, a glyph-based semiochemical console (colorblind
// -safe icon+shape+label), an ant field-analysis card, tweened vitals. Restrained,
// communicative motion. Kept out of main.js so the loop stays clean.

import { CELL, COLS, ROWS, CH, PH_COL, TASK_COL, UI, CH_META } from './config.js';
import { drawAnt } from './render.js';

const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

export function makeUI(ctx) {
  const tv = new Map();                                   // tween registry
  const tw = (k, target, dt, rate = 9) => { const c = tv.get(k) ?? target; let n = c + (target - c) * (1 - Math.exp(-rate * dt)); if (Math.abs(n - target) < 0.02) n = target; tv.set(k, n); return n; };
  const ripples = [];                                     // {wx,wy,ch,t}
  const foff = document.createElement('canvas'); foff.width = COLS; foff.height = ROWS;
  const fctx = foff.getContext('2d'); const fimg = fctx.createImageData(COLS, ROWS);
  let hot = [];

  // ---- primitives ----------------------------------------------------------------
  function text(str, x, y, o = {}) {
    ctx.font = `${o.bold ? 'bold ' : ''}${o.size || 11}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'top';
    if (o.halo) { ctx.fillStyle = 'rgba(4,8,9,0.65)'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.fillText(str, x + dx, y + dy); }
    ctx.fillStyle = o.color || UI.ink; ctx.fillText(str, x, y);
  }
  function chamfer(x, y, w, h, c = 9) {
    ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + h - c);
    ctx.lineTo(x + w - c, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + c); ctx.closePath();
  }
  function panel(x, y, w, h, time, c = 9) {
    ctx.save();
    chamfer(x, y, w, h, c); ctx.fillStyle = UI.chrome; ctx.fill();
    ctx.clip();
    // scanline sweep + faint top ticks
    const sy = y + ((time * 16) % (h + 20)) - 10;
    ctx.fillStyle = UI.scan; ctx.fillRect(x, sy, w, 2);
    ctx.strokeStyle = UI.edgeSoft; ctx.lineWidth = 1;
    for (let tx = x + 6; tx < x + w - 6; tx += 8) { ctx.beginPath(); ctx.moveTo(tx + 0.5, y + 2); ctx.lineTo(tx + 0.5, y + 5); ctx.stroke(); }
    ctx.restore();
    chamfer(x, y, w, h, c); ctx.strokeStyle = UI.edge; ctx.lineWidth = 1; ctx.stroke();
    chamfer(x + 3, y + 3, w - 6, h - 6, c - 2); ctx.strokeStyle = UI.edgeSoft; ctx.stroke();
  }
  function brackets(x, y, w, h, col = UI.cyan, arm = 11) {
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (const [ox, oy, gx, gy] of [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x + ox, y + oy + gy * arm); ctx.lineTo(x + ox, y + oy); ctx.lineTo(x + ox + gx * arm, y + oy); ctx.stroke(); }
    ctx.lineWidth = 1;
  }
  function rule(x, y, w) { ctx.strokeStyle = UI.edgeSoft; ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + w, y + 0.5); ctx.stroke(); }
  function gauge(x, y, w, frac, col) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, 8);
    ctx.strokeStyle = UI.edgeSoft; ctx.strokeRect(x + 0.5, y + 0.5, w, 8);
    for (let i = 1; i < 5; i++) { ctx.fillStyle = UI.edgeSoft; ctx.fillRect(x + (w * i / 5) | 0, y, 1, 8); }
  }

  // ---- the 6 channel glyphs (icon + shape, colorblind-safe) ----------------------
  function glyph(ch, cx, cy, s, col) {
    ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(1.2, s * 0.14); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const r = s * 0.5;
    if (ch === 'TRAIL') { for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * r * 0.42, 0, s * 0.08, 0, 7); ctx.fill(); } }
    else if (ch === 'ALARM') { for (let a = 0; a < 8; a++) { const t = a / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(t) * r * 0.3, Math.sin(t) * r * 0.3); ctx.lineTo(Math.cos(t) * r, Math.sin(t) * r); ctx.stroke(); } }
    else if (ch === 'RECRUIT') { ctx.beginPath(); ctx.moveTo(-r, -r * 0.6); ctx.lineTo(-s * 0.1, 0); ctx.lineTo(-r, r * 0.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(r, -r * 0.6); ctx.lineTo(s * 0.1, 0); ctx.lineTo(r, r * 0.6); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.09, 0, 7); ctx.fill(); }
    else if (ch === 'BROOD') { ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.85, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -r * 0.15, s * 0.16, 0, 7); ctx.fill(); }
    else if (ch === 'NECRO') { ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.stroke(); }
    else if (ch === 'QUEEN') { ctx.beginPath(); ctx.moveTo(-r, r * 0.5); ctx.lineTo(-r, -r * 0.3); ctx.lineTo(-r * 0.4, r * 0.1); ctx.lineTo(0, -r * 0.55); ctx.lineTo(r * 0.4, r * 0.1); ctx.lineTo(r, -r * 0.3); ctx.lineTo(r, r * 0.5); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  // ---- smooth pheromone-field overlay + emit ripples -----------------------------
  function drawField(st) {
    const { overlay, pher, cam, W, H } = st;
    if (overlay) {
      const d = fimg.data; d.fill(0);
      const chans = overlay === 'ALL' ? CH : [overlay];
      for (const ch of chans) {
        const c = PH_COL[ch], fld = pher.field[ch];
        for (let i = 0; i < fld.length; i++) { const v = fld[i]; if (v < 0.02) continue; const a = Math.min(255, v * 260), j = i * 4; d[j] = Math.min(255, d[j] + c[0] * a / 255); d[j + 1] = Math.min(255, d[j + 1] + c[1] * a / 255); d[j + 2] = Math.min(255, d[j + 2] + c[2] * a / 255); d[j + 3] = Math.min(255, d[j + 3] + a); }
      }
      fctx.putImageData(fimg, 0, 0);
      const p = CELL * cam.zoom, dx = (0 - cam.x) * p + W / 2, dy = (0 - cam.y) * p + H / 2;
      ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 1; ctx.drawImage(foff, 0, 0, COLS, ROWS, dx, dy, COLS * p, ROWS * p);   // core
      ctx.globalAlpha = 0.5; ctx.drawImage(foff, 0, 0, COLS, ROWS, dx - 2, dy - 2, COLS * p + 4, ROWS * p + 4);   // soft bloom halo
      ctx.restore();
    }
    // ripples (world-space rings in the channel hue)
    const p = CELL * cam.zoom;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 2;
    for (const rp of ripples) { const f = rp.t / 0.34, sx = (rp.wx - cam.x) * p + st.W / 2, sy = (rp.wy - cam.y) * p + st.H / 2; ctx.globalAlpha = (1 - f) * 0.8; ctx.strokeStyle = rgb(PH_COL[rp.ch]); ctx.beginPath(); ctx.arc(sx, sy, (2 + f * 5) * p, 0, 7); ctx.stroke(); }
    ctx.restore();
  }
  function ripple(wx, wy, ch) { ripples.push({ wx, wy, ch, t: 0 }); }
  function update(dt) { for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].t += dt; if (ripples[i].t > 0.34) ripples.splice(i, 1); } }

  // ---- HUD -----------------------------------------------------------------------
  function drawHUD(st) {
    hot = [];
    const { colony, pher, codex, armed, selected, W, H, time } = st;
    const s = colony.stats();
    ctx.save();

    // ===== colony vitals instrument (top-left) =====
    const vx = 12, vy = 12, vw = 250, vh = 178;
    panel(vx, vy, vw, vh, time);
    text('MESSOR BARBARUS', vx + 14, vy + 12, { size: 12, bold: true, color: UI.cyan });
    text('COLONY', vx + 14, vy + 27, { size: 9, color: UI.inkFaint });
    if (Math.sin(time * 3) > 0) { ctx.fillStyle = UI.cyan; ctx.beginPath(); ctx.arc(vw - 18, vy + 16, 3, 0, 7); ctx.fill(); text('LIVE', vw - 42, vy + 11, { size: 8, color: UI.cyanDim }); }
    // census tiles
    const tiles = [['WORKERS', s.pop, 'pop'], ['MAJORS', s.majors, 'maj'], ['CHAMBERS', s.chambers, 'ch']];
    tiles.forEach(([lab, val, k], i) => { const tx = vx + 14 + i * 78; text(String(Math.round(tw('v' + k, val, st.dt))), tx, vy + 40, { size: 18, bold: true, color: UI.ink }); text(lab, tx, vy + 62, { size: 8, color: UI.inkFaint }); });
    rule(vx + 12, vy + 78, vw - 24);
    // task allocation
    text('TASK ALLOCATION', vx + 14, vy + 82, { size: 8, color: UI.inkFaint });
    const tasks = [['forage'], ['dig'], ['nurse'], ['undertake'], ['idle']];
    let bx = vx + 14, bw = vw - 28, cx = bx; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx, vy + 94, bw, 10);
    for (const [k] of tasks) { const seg = tw('t' + k, (s.tasks[k] || 0), st.dt) / (s.pop || 1) * bw; ctx.fillStyle = TASK_COL[k]; ctx.fillRect(cx, vy + 94, seg, 10); cx += seg; }
    ctx.strokeStyle = UI.edgeSoft; ctx.strokeRect(bx + 0.5, vy + 94.5, bw, 10);
    let lx = vx + 14; for (const [k] of tasks) { const n = s.tasks[k] || 0; if (!n) continue; ctx.fillStyle = TASK_COL[k]; ctx.fillRect(lx, vy + 110, 7, 7); text(`${k} ${n}`, lx + 10, vy + 110, { size: 8, color: UI.inkDim }); lx += ctx.measureText(`${k} ${n}`).width * 0.72 + 24; }
    rule(vx + 12, vy + 126, vw - 24);
    // brood pipeline flow
    text('BROOD PIPELINE', vx + 14, vy + 130, { size: 8, color: UI.inkFaint });
    const stages = [['egg', s.broodStages.egg], ['larva', s.broodStages.larva], ['pupa', s.broodStages.pupa], ['worker', '']];
    stages.forEach(([lab, n], i) => {
      const nx = vx + 26 + i * 56, ny = vy + 152;
      const mat = i / 3, col = [Math.round(233 - mat * 106), Math.round(197 + mat * 27), Math.round(138 + mat * 70)];
      ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.arc(nx, ny, 5, 0, 7); ctx.fill();
      text(lab, nx, ny + 8, { size: 7, color: UI.inkFaint, align: 'center' }); if (n !== '') text(String(n), nx, ny - 16, { size: 10, bold: true, color: UI.ink, align: 'center' });
      if (i < 3) { const px2 = nx + 8, px3 = nx + 48; ctx.strokeStyle = UI.edgeSoft; ctx.beginPath(); ctx.moveTo(px2, ny); ctx.lineTo(px3, ny); ctx.stroke(); const fp = (time * 0.4 + i * 0.33) % 1; ctx.fillStyle = UI.cyanDim; ctx.beginPath(); ctx.arc(px2 + (px3 - px2) * fp, ny, 1.6, 0, 7); ctx.fill(); }
    });

    // seed store gauge (its own slim panel under vitals)
    const gy2 = vy + vh + 8; panel(vx, gy2, vw, 30, time);
    text('SEED STORE', vx + 14, gy2 + 8, { size: 8, color: UI.inkFaint });
    text(String(s.stores), vx + 14, gy2 + 17, { size: 10, bold: true, color: s.stores < 3 ? UI.warn : UI.amber });
    gauge(vx + 92, gy2 + 12, vw - 108, Math.min(1, s.stores / 40), s.stores < 3 ? UI.warn : UI.amber);

    // ===== pheromone console (bottom center) =====
    const n = CH.length, cw = 116, gap = 6, tw2 = n * cw + (n - 1) * gap, x0 = (W - tw2) / 2, cy = H - 52;
    for (let i = 0; i < n; i++) {
      const ch = CH[i], cd = codex[ch], x = x0 + i * (cw + gap), isArm = armed === ch;
      const col = PH_COL[ch], lift = isArm ? -3 : 0;
      hot.push({ x, y: cy + lift, w: cw, h: 40, kind: 'chip', ch });
      ctx.fillStyle = isArm ? rgba(col, 0.16) : UI.chrome; ctx.fillRect(x, cy + lift, cw, 40);
      if (isArm) brackets(x, cy + lift, cw, 40, rgb(col), 9); else { ctx.strokeStyle = UI.edgeSoft; ctx.strokeRect(x + 0.5, cy + lift + 0.5, cw, 40); }
      const gcol = cd.unlocked ? rgb(col) : UI.inkFaint;
      glyph(ch, x + 22, cy + lift + 20, 20, gcol);
      text(`[${i + 1}]`, x + 40, cy + lift + 7, { size: 8, color: UI.inkFaint });
      if (cd.unlocked) { text(ch, x + 40, cy + lift + 18, { size: 11, bold: true, color: UI.ink }); text(cd.readonly ? 'READ-ONLY' : 'EMIT', x + 40, cy + lift + 30, { size: 8, color: cd.readonly ? UI.inkFaint : UI.cyanDim }); }
      else { text('DECODING', x + 40, cy + lift + 18, { size: 9, color: UI.inkDim }); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 40, cy + lift + 31, cw - 50, 4); ctx.fillStyle = UI.cyanDim; ctx.fillRect(x + 40, cy + lift + 31, (cw - 50) * cd.fam, 4); }
    }
    // armed → expand a readout above the rail
    if (armed) {
      const c = PH_COL[armed], ex = x0, ew = tw2, ey = cy - 38;
      panel(ex, ey, ew, 30, time);
      glyph(armed, ex + 18, ey + 15, 16, rgb(c));
      text(armed, ex + 34, ey + 6, { size: 11, bold: true, color: rgb(c) });
      text(CH_META[armed] || '', ex + 34, ey + 18, { size: 9, color: UI.inkDim });
      const samp = st.cursorWorld ? Math.min(1, pher.sample(armed, st.cursorWorld[0], st.cursorWorld[1]) / 2) : 0;
      text('here', ex + ew - 150, ey + 10, { size: 8, color: UI.inkFaint }); gauge(ex + ew - 118, ey + 10, 100, samp, rgb(c));
      text('click / drag to emit', ex + ew - 150, ey + 22, { size: 8, color: UI.inkFaint });
    }
    text('scroll zoom · drag pan · click an ant · P decode · T tasks · 1–6 pheromone', W / 2, H - 10, { size: 9, color: UI.inkFaint, align: 'center' });

    // ===== field-analysis card (top-right, on select) =====
    if (selected && colony.ants.includes(selected)) drawInspector(st, s);
    ctx.restore();
  }

  function drawInspector(st, s) {
    const a = st.selected, cw = 268, x = st.W - cw - 12, y = 12, h = 196, time = st.time;
    panel(x, y, cw, h, time); brackets(x, y, cw, h);
    text('DG-3 FIELD ANALYSIS', x + 16, y + 12, { size: 11, bold: true, color: UI.cyan });
    text(`#${a.id}`, x + cw - 16, y + 12, { size: 11, color: UI.inkDim, align: 'right' });
    // portrait
    const pxp = x + 40, pyp = y + 54;
    ctx.strokeStyle = UI.edgeSoft; ctx.beginPath(); ctx.arc(pxp, pyp, 24, 0, 7); ctx.stroke();
    drawAnt(ctx, pxp, pyp + 4, 15, { caste: a.caste, age: a.age, carrying: a.carrying, hx: 1, hy: -0.04, t: time, dead: false });
    // rows
    const stage = a.age < 0.06 ? 'callow' : a.age > 0.85 ? 'elder' : 'adult';
    const rx = x + 80, row = (l, v, yy, vc) => { text(l, rx, yy, { size: 9, color: UI.inkFaint }); text(v, rx + 62, yy, { size: 11, color: vc || UI.ink }); };
    row('caste', a.caste, y + 34); row('task', a.task, y + 52, TASK_COL[a.task]); row('stage', `${(a.age * 100 | 0)}% ${stage}`, y + 70); row('carrying', a.carrying || '—', y + 88);
    // crop gauge
    text('crop', rx, y + 106, { size: 9, color: UI.inkFaint }); gauge(rx + 62, y + 106, cw - (rx - x) - 78, a.crop, UI.amber);
    rule(x + 14, y + 122, cw - 28);
    // intent + prediction
    text('› ' + st.colony.intent(a), x + 16, y + 128, { size: 10, color: UI.cyan });
    text(st.colony.predict(a), x + 22, y + 144, { size: 9, color: UI.inkDim });
    // pheromone context at the ant
    text('CHEMICAL CONTEXT', x + 16, y + 162, { size: 8, color: UI.inkFaint });
    CH.forEach((ch, i) => { const gx = x + 20 + i * 42, gy = y + 180, v = Math.min(1, st.pher.sample(ch, a.x, a.y) / 2); const col = st.codex[ch].unlocked ? rgb(PH_COL[ch]) : UI.inkFaint; glyph(ch, gx, gy - 4, 12, v > 0.05 ? col : UI.inkFaint); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(gx - 8, gy + 6, 16, 3); ctx.fillStyle = col; ctx.fillRect(gx - 8, gy + 6, 16 * v, 3); });
  }

  function hitTest(mx, my) { for (const r of hot) if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return r; return null; }

  return { update, drawField, drawHUD, ripple, hitTest };
}
