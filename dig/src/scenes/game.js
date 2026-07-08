// The dig. Year 102,025. Bone-collation loop: laser through the strata, pull
// buried bones (never whole skeletons), winch home, run each bone through the
// four lab minigames, and watch the museum skeleton assemble bone by bone.

import {
  VIEW_W, VIEW_H, TILE, WORLD_W, WORLD_H,
  T_AIR, T_PLACED, T_BEDROCK, AUTOSAVE_SECONDS,
} from '../config.js';
import { keys, mouse, pressed } from '../core/input.js';
import { sfx, rumble } from '../core/audio.js';
import { setMusicDepth, updateMusic } from '../core/music.js';
import { writeSave } from '../core/save.js';
import { makeCamera } from '../core/camera.js';
import { makeParticles } from '../render/particles.js';
import { PALETTE, RARITY_COLORS } from '../render/palette.js';
import { text, chip, blueprintPanel, measure, roundRect } from '../render/text.js';
import { drawProbe, drawFossil, drawBoneNub, drawSprite, hasSprite } from '../render/sprites.js';
import { drawSpeciesCard, drawMiniCard } from '../render/cards.js';
import { makeWorld } from '../world/world.js';
import { makePlayer, updatePlayer } from '../game/player.js';
import { updateDigging } from '../game/digging.js';
import { makePulley } from '../game/pulley.js';
import { makeMinigame } from '../game/minigames.js';
import { makeSatchel, makeFragment } from '../game/fossils.js';
import { makeCollection } from '../game/collection.js';
import { makeLab } from '../game/stations.js';
import { STRATA } from '../content/strata.js';
import { biomeAtX } from '../content/biomes.js';
import { FOSSILS, FOSSILS_BY_ID, fossilsForPeriod } from '../content/fossils.js';
import { SPECIMEN_STATES } from '../content/stations.js';

const MISSION_ID = 't-rex';

export function makeGameScene(services) {
  const { ctx, tileset, makeCanvas, settings, save } = services;

  const seed = save?.seed ?? ((Math.random() * 1e9) | 0);

  const world = makeWorld(seed);
  world.applyDeltas(save);
  const spawnCol = world.spawnCol;
  const player = makePlayer(
    spawnCol * TILE + (TILE - 12) / 2,
    (world.surface[spawnCol] - 2) * TILE - 22,
  );
  const cam = makeCamera();
  const particles = makeParticles();
  const satchel = makeSatchel();
  const collection = makeCollection(save?.collected || {});
  const lab = makeLab(spawnCol, world.surface);
  const pulley = makePulley();

  if (save?.session) {
    const s = save.session;
    if (typeof s.px === 'number') { player.x = s.px; player.y = s.py; player.vx = s.vx || 0; player.vy = s.vy || 0; player.facing = s.facing || 1; }
    for (const it of s.satchel || []) {
      const frag = makeFragment(it.fossilId, it.bone, it.boneIndex, it.stratumId);
      frag.state = it.state; frag.identified = it.identified;
      satchel.add(frag);
    }
  }

  let time = 0, autosaveT = AUTOSAVE_SECONDS;
  let collectionOpen = false;
  let overlay = null;                 // {type:'reveal'|'dex', spec, t}
  let minigame = null;                // {game, station, fragment}
  let lastStratumIndex = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
  let banner = null, missionBanner = 0;
  let rumbleT = 14 + Math.random() * 10;
  const toasts = [];
  const miniCards = [];
  const hintedPockets = new Set();

  const fx = { shake: m => cam.addShake(m, settings.shake) };
  function toast(str, color = PALETTE.amber) { toasts.push({ text: str, life: 3, color }); }

  function persist() {
    const deltas = world.exportDeltas();
    const session = {
      px: player.x, py: player.y, vx: player.vx, vy: player.vy, facing: player.facing,
      satchel: satchel.items.map(s => ({ fossilId: s.fossilId, bone: s.bone, boneIndex: s.boneIndex, stratumId: s.stratumId, state: s.state, identified: s.identified })),
    };
    const data = { seed, dug: deltas.dug, placed: deltas.placed, collected: collection.export(), settings: { ...settings }, session };
    writeSave(data);
    services.save = data;
  }

  cam.follow(player.cx(), player.cy(), 0, true);

  // --------------------------------------------------------------- update
  function update(dt) {
    time += dt;
    updateMusic(dt);
    decayToasts(dt);
    for (const mc of miniCards) mc.t += dt;
    while (miniCards.length && miniCards[0].t > 4.2) miniCards.shift();
    if (banner) banner.life -= dt;
    missionBanner = Math.max(0, missionBanner - dt);

    if (minigame) {
      minigame.game.update(dt);
      const st = minigame.game.status;
      if (st === 'success') finishStation(minigame);
      else if (st === 'failed') failStation(minigame);
      if (st !== 'active') minigame = null;
      return;
    }

    if (overlay) {
      overlay.t += dt;
      if (overlay.t > 0.35 && (pressed('Space') || pressed('KeyE') || pressed('Escape') || pressed('Enter') || pressed('MouseLeft') || pressed('Tab'))) { overlay = null; sfx.uiBack(); }
      return;
    }

    if (pressed('Escape')) { persist(); services.go('settings', { overlay: true, back: 'game' }); return; }
    if (pressed('Tab')) { collectionOpen = !collectionOpen; sfx.ui(); }
    if (collectionOpen) { updateCollectionInput(); return; }

    if (pulley.active) {
      const ride = pulley.updateReel(player, world, dt);
      if (ride.popped) { toast('extraction complete', PALETTE.good); particles.burst(player.cx(), player.y + player.h, '#AA9678', 14, 180); fx.shake(3); }
    } else {
      if (pressed('Space') || pressed('KeyW')) player.bufferJump();
      if (pressed('KeyK') && pulley.tryAttach(player, world)) toast('winch deployed', PALETTE.amberSoft);

      updatePlayer(player, world, dt);

      const digEv = updateDigging(player, world, cam, particles, fx, dt);
      if (digEv.bone) onBone(digEv.bone);
      if (digEv.nearBone && !hintedPockets.has(digEv.nearBone.id)) { hintedPockets.add(digEv.nearBone.id); sfx.hint(); toast('something here…', PALETTE.amberSoft); }
      if (digEv.camp && !toasts.some(t => t.text.startsWith('the camp'))) toast('the camp is off-limits', PALETTE.danger);

      const st = lab.nearest(player);
      if (st && pressed('KeyE')) openStation(st);
    }

    glintPockets();
    cam.follow(player.cx(), player.cy(), dt);
    cam.decay(dt);
    particles.update(dt);

    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE)));
    const si = world.stratumIndexAt(player.tx(), Math.floor(player.cy() / TILE));
    if (si !== lastStratumIndex && player.cy() > world.surface[player.tx()] * TILE) {
      const s = STRATA[si];
      banner = { era: s.era, mya: s.mya, life: 3 };
      lastStratumIndex = si;
    }
    rumbleT -= dt * (1 + depth / 160);
    if (rumbleT <= 0 && depth > 12) { rumble(); fx.shake(1.2); rumbleT = 22 + Math.random() * 20; }
    setMusicDepth(depth);

    autosaveT -= dt;
    if (autosaveT <= 0) { persist(); autosaveT = AUTOSAVE_SECONDS; }
  }

  function onBone(pocket) {
    const stratum = world.stratumAt(pocket.tx, pocket.ty);
    satchel.add(makeFragment(pocket.fossilId, pocket.bone, pocket.boneIndex, stratum.id));
    miniCards.push({ spec: FOSSILS_BY_ID[pocket.fossilId], bone: pocket.bone, t: 0 });
    sfx.discover();
    fx.shake(1.5);
  }

  function openStation(st) {
    const frag = satchel.firstAtState(st.spec.input);
    if (!frag) { toast(`nothing to ${st.spec.verb.toLowerCase()}`, PALETTE.creamDim); return; }
    const spec = FOSSILS_BY_ID[frag.fossilId];
    const extra = { fragment: frag };
    if (st.spec.minigame === 'identify') {
      const pool = fossilsForPeriod(spec.period).filter(f => f.id !== spec.id);
      extra.decoys = shuffle(pool, frag.uid).slice(0, 2);
    }
    if (st.spec.minigame === 'mount') {
      extra.bones = spec.bones;
      extra.boneIndex = frag.boneIndex;
      extra.mountedSlots = new Set(spec.bones.map((_, i) => i).filter(i => collection.hasBone(spec.id, i)));
    }
    minigame = { game: makeMinigame(st.spec.minigame, spec, makeCanvas, extra), station: st, fragment: frag };
    sfx.station();
  }

  function finishStation({ station, fragment, game }) {
    fragment.state = station.spec.output;
    if (station.spec.output === 'identified') {
      fragment.identified = true;
      if (game.reduced) toast('identified (reduced confidence)', PALETTE.creamDim);
      overlay = { type: 'reveal', spec: FOSSILS_BY_ID[fragment.fossilId], t: 0 };
      sfx.reveal();
    }
    if (station.spec.output === 'mounted') {
      satchel.remove(fragment.uid);
      const complete = collection.mountBone(fragment.fossilId, fragment.boneIndex);
      const f = FOSSILS_BY_ID[fragment.fossilId];
      toast(`mounted: ${f.name} ${fragment.bone}`, PALETTE.good);
      if (complete) {
        toast(`${f.name} skeleton complete!`, RARITY_COLORS[f.rarity]);
        overlay = { type: 'reveal', spec: f, t: 0 };
        if (fragment.fossilId === MISSION_ID) { missionBanner = 6; sfx.mission(); fx.shake(4); }
        else sfx.reveal();
      }
      persist();
    }
  }

  function failStation({ fragment }) {
    satchel.remove(fragment.uid);
    toast('the fragment crumbled — lost', PALETTE.danger);
    sfx.crumble();
  }

  function glintPockets() {
    if (Math.random() > 0.05) return;
    const b = cam.bounds();
    const vis = world.pockets.filter(p => world.pocketAt(p.tx, p.ty) && p.tx >= b.x0 && p.tx <= b.x1 && p.ty >= b.y0 && p.ty <= b.y1);
    if (!vis.length) return;
    const p = vis[(Math.random() * vis.length) | 0];
    particles.burst((p.tx + 0.5) * TILE, (p.ty + 0.5) * TILE, PALETTE.bone, 1, 24);
  }

  function decayToasts(dt) { for (let i = toasts.length - 1; i >= 0; i--) { toasts[i].life -= dt; if (toasts[i].life <= 0) toasts.splice(i, 1); } }

  function updateCollectionInput() {
    if (pressed('Escape')) { collectionOpen = false; sfx.uiBack(); return; }
    if (pressed('MouseLeft')) {
      const cell = collectionCellAt(mouse.x, mouse.y);
      if (cell && collection.started(cell.id)) { overlay = { type: 'dex', spec: FOSSILS_BY_ID[cell.id], t: 0 }; collectionOpen = false; sfx.ui(); }
    }
  }

  // --------------------------------------------------------------- render
  function render(rtime) {
    const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    g.addColorStop(0, PALETTE.sky);
    g.addColorStop(1, PALETTE.skyDusk);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.save();
    cam.apply(ctx);
    const b = cam.bounds();

    drawScenery(rtime, b);
    drawTiles(b);
    drawPockets(b, rtime);
    pulley.draw(ctx, player, rtime);
    particles.draw(ctx);
    drawBeam(rtime);
    drawProbe(ctx, player.x + player.w / 2, player.y, player.facing, rtime,
      player.swingT, player.swingAim, player.vx, player.walkT,
      pulley.active ? { dangle: pulley.dangleAngle() } : { firing: !!player.beam });
    drawDarkness();
    ctx.restore();

    drawHUD();
    if (banner && banner.life > 0) drawBanner();
    if (missionBanner > 0) drawMissionBanner();
    drawToasts();
    drawMiniCards(rtime);
    if (collectionOpen) drawCollection();
    if (overlay) drawOverlay(rtime);
    if (minigame) minigame.game.render(ctx, rtime);
  }

  function drawScenery(rtime, b) {
    for (let c = 0; c < 5; c++) {
      const cw = WORLD_W * TILE;
      const cx = ((c * 811 + rtime * (5 + c * 2)) % (cw + 300)) - 150;
      cloud(cx, 30 + (c * 47 % 120));
    }
    for (let tx = Math.max(0, b.x0); tx <= Math.min(WORLD_W - 1, b.x1); tx++) {
      const baseY = world.surface[tx] * TILE;
      const biome = biomeAtX(tx, WORLD_W);
      if (hashCol(tx, 55) > 0.93 && Math.abs(tx - spawnCol) > 6) drawTree(tx * TILE + TILE / 2, baseY, biome, tx);
      else if (hashCol(tx, 40) > 0.9 && Math.abs(tx - spawnCol) > 4) drawDressing(tx * TILE + TILE / 2, baseY, tx);
      if (hashCol(tx, 88) > 0.3) tuft(tx * TILE + TILE / 2, baseY, tx, biome);
    }
    const campY = world.surface[spawnCol] * TILE;
    tent(spawnCol * TILE + TILE / 2 - 6, campY);
    drawStations();
    drawMuseum(campY);
  }

  function drawTiles(b) {
    const y0 = Math.max(0, b.y0), y1 = Math.min(WORLD_H - 1, b.y1);
    const x0 = Math.max(0, b.x0), x1 = Math.min(WORLD_W - 1, b.x1);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = world.tiles[ty * WORLD_W + tx];
        const dx = tx * TILE, dy = ty * TILE;
        const depth = world.depthOfRow(tx, ty);
        if (t === T_AIR) {
          // BACK WALL: below the surface, carved-out air still shows darkened rock
          if (depth >= 0 && ty < WORLD_H - 3) tileset.drawBack(ctx, world.stratumIndexAt(tx, ty), tx, ty, dx, dy);
          continue;
        }
        if (t === T_BEDROCK) { ctx.fillStyle = '#4A4038'; ctx.fillRect(dx, dy, TILE, TILE); continue; }
        if (t === T_PLACED) tileset.drawPlaced(ctx, (tx ^ ty) & 7, dx, dy);
        else tileset.drawTile(ctx, world.stratumIndexAt(tx, ty), tx, ty, dx, dy);

        // grass cap on the surface row
        if (ty === world.surface[tx]) {
          const biome = biomeAtX(tx, WORLD_W);
          ctx.fillStyle = biome.id === 'tundra' ? '#9DB8AE' : biome.id === 'coast' ? PALETTE.grassDeep : PALETTE.grass;
          ctx.fillRect(dx, dy, TILE, 4);
          ctx.fillStyle = PALETTE.grassDeep;
          ctx.fillRect(dx, dy + 3, TILE, 1);
        }

        // edge outline where rock meets air (reads the carve)
        ctx.fillStyle = 'rgba(30,22,18,0.38)';
        if (world.tileAt(tx, ty - 1) === T_AIR && ty !== world.surface[tx]) ctx.fillRect(dx, dy, TILE, 2);
        if (world.tileAt(tx, ty + 1) === T_AIR) ctx.fillRect(dx, dy + TILE - 2, TILE, 2);
        if (world.tileAt(tx - 1, ty) === T_AIR) ctx.fillRect(dx, dy, 2, TILE);
        if (world.tileAt(tx + 1, ty) === T_AIR) ctx.fillRect(dx + TILE - 2, dy, 2, TILE);
      }
    }
  }

  // buried bones: tiny nubs, not full skeletons
  function drawPockets(b, rtime) {
    for (const p of world.pockets) {
      if (p.tx < b.x0 || p.tx > b.x1 || p.ty < b.y0 || p.ty > b.y1) continue;
      if (!world.pocketAt(p.tx, p.ty)) continue;
      const exposed = world.tileAt(p.tx - 1, p.ty) === T_AIR || world.tileAt(p.tx + 1, p.ty) === T_AIR ||
        world.tileAt(p.tx, p.ty - 1) === T_AIR || world.tileAt(p.tx, p.ty + 1) === T_AIR;
      drawBoneNub(ctx, p, p.tx * TILE, p.ty * TILE, exposed);
    }
  }

  function drawBeam(rtime) {
    if (!player.beam) return;
    const lx = player.cx() + player.facing * 4, ly = player.y + 8;
    const { x, y } = player.beam;
    // outer glow
    ctx.strokeStyle = 'rgba(224,162,74,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    // core
    ctx.strokeStyle = '#FFF3D0';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(x, y); ctx.stroke();
    // impact flash
    ctx.fillStyle = 'rgba(255,240,200,0.7)';
    ctx.beginPath(); ctx.arc(x, y, 3 + Math.sin(rtime * 40) * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  function drawDarkness() {
    const depth = world.depthOfRow(player.tx(), Math.floor(player.cy() / TILE));
    const ambient = Math.min(0.8, Math.max(0, (depth - 4) / 60) * 0.8);
    if (ambient < 0.02) return;
    const wx = player.cx(), wy = player.cy();
    const grad = ctx.createRadialGradient(wx, wy, TILE * 2.5, wx, wy, TILE * 9);
    grad.addColorStop(0, 'rgba(20,14,24,0)');
    grad.addColorStop(1, `rgba(20,14,24,${ambient})`);
    ctx.fillStyle = grad;
    ctx.fillRect(cam.x - TILE, cam.y - TILE, VIEW_W + TILE * 2, VIEW_H + TILE * 2);
    const warm = ctx.createRadialGradient(wx, wy, 0, wx, wy, TILE * 4);
    warm.addColorStop(0, `rgba(255,233,184,${0.14 * (ambient / 0.8)})`);
    warm.addColorStop(1, 'rgba(255,233,184,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(cam.x - TILE, cam.y - TILE, VIEW_W + TILE * 2, VIEW_H + TILE * 2);
  }

  // ---- scenery primitives ----
  function cloud(px, py) {
    ctx.fillStyle = PALETTE.cloud;
    for (const [ox, oy, r] of [[0, 0, 12], [10, -4, 10], [20, 2, 11], [30, 0, 8]]) { ctx.beginPath(); ctx.arc(px + ox, py + oy, r, 0, Math.PI * 2); ctx.fill(); }
  }
  function tuft(px, baseY, sx, biome) {
    ctx.strokeStyle = biome.id === 'tundra' ? PALETTE.tundraGrass : biome.id === 'coast' ? PALETTE.grassDeep : PALETTE.grass;
    ctx.lineWidth = 1.5;
    const blades = 2 + Math.floor(hashCol(sx, 9) * 2);
    ctx.beginPath();
    for (let bl = 0; bl < blades; bl++) {
      const ox = (bl - blades / 2) * 3 + hashCol(sx + bl, 1) * 2;
      const bh = 4 + hashCol(sx + bl, 5) * 4, bend = (hashCol(sx + bl, 7) - 0.5) * 5;
      ctx.moveTo(px + ox, baseY); ctx.quadraticCurveTo(px + ox + bend, baseY - bh * 0.6, px + ox + bend, baseY - bh);
    }
    ctx.stroke();
  }
  function drawTree(px, baseY, biome, sx) {
    const id = biome.id === 'tundra' ? 'tree-conifer' : biome.id === 'coast' ? 'tree-palm' : 'tree-badlands';
    if (hasSprite('scenery', id)) { drawSprite(ctx, 'scenery', id, px, baseY + 2, 56, 72); return; }
    // procedural fallback
    ctx.fillStyle = PALETTE.wood;
    const h = 3 + Math.floor(hashCol(px, 3) * 3);
    ctx.fillRect(px - 2, baseY - h * TILE, 4, h * TILE);
    ctx.fillStyle = biome.id === 'tundra' ? '#8FB0A2' : PALETTE.grassDeep;
    const cy = baseY - h * TILE;
    for (const [ox, oy, r] of [[0, -6, 13], [-9, 0, 10], [9, -1, 10], [0, 6, 9]]) { ctx.beginPath(); ctx.arc(px + ox, cy + oy, r, 0, Math.PI * 2); ctx.fill(); }
  }
  function drawDressing(px, baseY, sx) {
    const r = hashCol(sx, 71);
    const id = r > 0.66 ? 'bush' : r > 0.33 ? 'boulder' : 'flowers';
    if (hasSprite('scenery', id)) { drawSprite(ctx, 'scenery', id, px, baseY + 2, 28, 22); return; }
    if (id === 'boulder') { ctx.fillStyle = '#9A93A0'; ctx.beginPath(); ctx.ellipse(px, baseY - 5, 9, 6, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.fillStyle = id === 'flowers' ? '#C98BA8' : PALETTE.grassDeep; ctx.beginPath(); ctx.arc(px, baseY - 5, 6, 0, Math.PI * 2); ctx.fill(); }
  }
  function tent(px, baseY) {
    ctx.fillStyle = PALETTE.tent;
    ctx.beginPath(); ctx.moveTo(px, baseY - 20); ctx.lineTo(px - 18, baseY); ctx.lineTo(px + 18, baseY); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALETTE.tentShadow;
    ctx.beginPath(); ctx.moveTo(px, baseY - 9); ctx.lineTo(px - 5, baseY); ctx.lineTo(px + 5, baseY); ctx.closePath(); ctx.fill();
  }

  function drawStations() {
    for (const st of lab.instances) {
      const x = st.x, y = st.groundY;
      if (hasSprite('stations', st.spec.sprite)) drawSprite(ctx, 'stations', st.spec.sprite, x, y + 2, 40, 40);
      else { chip(ctx, x - 15, y - 21, 30, 21, { fill: st.spec.tint, r: 5 }); stationGlyph(st.spec.icon, x, y - 10); }
      if (st.active) {
        const frag = satchel.firstAtState(st.spec.input);
        chip(ctx, x - 40, y - 50, 80, 18, { fill: PALETTE.frameDark, r: 8, border: null });
        text(ctx, frag ? `E · ${st.spec.name}` : st.spec.name, x, y - 46, { size: 9, bold: true, align: 'center', color: frag ? PALETTE.parchment : PALETTE.creamDim });
      }
    }
  }
  function stationGlyph(icon, x, y) {
    ctx.strokeStyle = PALETTE.ink; ctx.fillStyle = PALETTE.ink; ctx.lineWidth = 1.5;
    if (icon === 'brush') { ctx.fillRect(x - 1, y - 5, 2, 6); ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.lineTo(x + 3, y + 3); ctx.lineTo(x, y + 6); ctx.closePath(); ctx.fill(); }
    else if (icon === 'lens') { ctx.beginPath(); ctx.arc(x - 1, y - 1, 4, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + 5, y + 5); ctx.stroke(); }
    else if (icon === 'drop') { ctx.beginPath(); ctx.arc(x, y + 1, 3.5, 0, Math.PI * 2); ctx.moveTo(x, y - 5); ctx.lineTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.fill(); }
    else { ctx.strokeRect(x - 4, y - 5, 8, 10); ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); }
  }

  // museum: each species' skeleton ghosts in at bonesMounted/needed alpha
  function drawMuseum(campY) {
    const started = FOSSILS.filter(f => collection.started(f.id));
    if (!started.length) return;
    const shelfX = (spawnCol - 11) * TILE;
    ctx.fillStyle = PALETTE.wood;
    ctx.fillRect(shelfX - 4, campY - 4, 7 * TILE + 8, 4);
    started.slice(0, 7).forEach((f, i) => {
      const frac = collection.fraction(f.id);
      ctx.globalAlpha = 0.2 + frac * 0.8;
      drawFossil(ctx, f, shelfX + i * TILE, campY - 4 - TILE, makeCanvas, 0.5);
      ctx.globalAlpha = 1;
      if (frac >= 1) { ctx.fillStyle = PALETTE.good; ctx.fillRect(shelfX + i * TILE + 6, campY - 6, 3, 3); }
    });
  }

  // --------------------------------------------------------------- HUD
  function drawHUD() {
    const depth = Math.max(0, world.depthOfRow(player.tx(), Math.floor((player.y + player.h) / TILE)));
    const stratum = world.stratumAt(player.tx(), Math.floor(player.cy() / TILE));

    chip(ctx, 12, 12, 196, 48, { r: 10 });
    text(ctx, `${depth} m`, 26, 20, { size: 20, bold: true, color: PALETTE.amber });
    text(ctx, stratum.era, 26, 42, { size: 11, color: PALETTE.creamDim });
    ctx.fillStyle = stratum.colors.base; ctx.fillRect(186, 22, 12, 28);

    if (!collection.isComplete(MISSION_ID)) {
      const got = collection.bonesMounted(MISSION_ID), need = collection.bonesNeeded(MISSION_ID);
      const mtext = `MISSION · Tyrannosaurus  ${got}/${need} bones`;
      const mw = measure(ctx, mtext, 10, true);
      chip(ctx, VIEW_W / 2 - mw / 2 - 12, 12, mw + 24, 22, { r: 8, fill: PALETTE.frameDark });
      text(ctx, mtext, VIEW_W / 2, 18, { size: 10, bold: true, align: 'center', color: PALETTE.amberSoft });
    }

    // satchel: just a count (uncapped)
    const nBones = satchel.count();
    chip(ctx, VIEW_W - 150, 12, 138, 30, { r: 8 });
    ctx.save(); ctx.translate(VIEW_W - 138, 27); ctx.rotate(-0.4);
    ctx.fillStyle = PALETTE.parchment; ctx.fillRect(-6, -2, 12, 4); ctx.beginPath(); ctx.arc(-6, 0, 2.5, 0, 7); ctx.arc(6, 0, 2.5, 0, 7); ctx.fill();
    ctx.restore();
    text(ctx, `${nBones} bone${nBones === 1 ? '' : 's'} in satchel`, VIEW_W - 122, 20, { size: 12, color: PALETTE.cream });

    chip(ctx, 12, VIEW_H - 38, 210, 26, { r: 8 });
    text(ctx, `skeletons ${collection.completedCount()}/${collection.total()} · ${collection.score()} pts`, 22, VIEW_H - 32, { size: 11, color: PALETTE.cream });

    const hint = pulley.active ? 'A/D swing · SPACE let go'
      : 'walk into walls to laser · S dig down · K winch home · E lab · TAB collection';
    const tw = measure(ctx, hint, 11);
    chip(ctx, VIEW_W / 2 - tw / 2 - 10, VIEW_H - 30, tw + 20, 20, { r: 8, border: null, fill: 'rgba(74,52,33,0.85)' });
    text(ctx, hint, VIEW_W / 2, VIEW_H - 25, { size: 11, align: 'center', color: PALETTE.parchment });
  }

  function drawBanner() {
    const a = Math.min(1, banner.life) * Math.min(1, (3 - banner.life) * 3);
    ctx.globalAlpha = a;
    const str = `${banner.era.toUpperCase()} · ${banner.mya[0]}–${banner.mya[1]} mya`;
    const tw = measure(ctx, str, 18, true);
    blueprintPanel(ctx, VIEW_W / 2 - tw / 2 - 26, 74, tw + 52, 46, { frameW: 6, r: 12, deep: true, grid: false });
    text(ctx, str, VIEW_W / 2, 97, { size: 18, bold: true, align: 'center', baseline: 'middle', color: PALETTE.cream });
    ctx.globalAlpha = 1;
  }
  function drawMissionBanner() {
    const a = Math.min(1, missionBanner) * Math.min(1, (6 - missionBanner) * 2);
    ctx.globalAlpha = a;
    blueprintPanel(ctx, VIEW_W / 2 - 240, VIEW_H / 2 - 60, 480, 96, { frameW: 8, r: 16, deep: true });
    text(ctx, 'MISSION COMPLETE', VIEW_W / 2, VIEW_H / 2 - 34, { size: 30, bold: true, align: 'center', color: PALETTE.amber });
    text(ctx, 'the legendary rex stands assembled · transmission sent', VIEW_W / 2, VIEW_H / 2 + 6, { size: 12, align: 'center', color: PALETTE.creamDim });
    ctx.globalAlpha = 1;
  }
  function drawToasts() {
    toasts.forEach((t, i) => {
      ctx.globalAlpha = Math.min(1, t.life * 1.5);
      const tw = measure(ctx, t.text, 13, true);
      const y = 132 + i * 30;
      chip(ctx, VIEW_W / 2 - tw / 2 - 14, y, tw + 28, 24, { r: 12 });
      ctx.fillStyle = t.color; ctx.fillRect(VIEW_W / 2 - tw / 2 - 7, y + 7, 4, 10);
      text(ctx, t.text, VIEW_W / 2 + 2, y + 6, { size: 13, bold: true, align: 'center' });
      ctx.globalAlpha = 1;
    });
  }
  function drawMiniCards(rtime) {
    const W = 290, H = 92;
    miniCards.forEach((mc, i) => {
      const inT = Math.min(1, mc.t / 0.3), outT = Math.max(0, (mc.t - 3.7) / 0.5);
      const ease = 1 - Math.pow(1 - inT, 3);
      const x = VIEW_W - (W + 14) * ease + (W + 14) * outT * outT;
      const y = VIEW_H - 120 - i * (H + 8);
      drawMiniCard(ctx, mc.spec, x + 6, y, W, H, makeCanvas, rtime, mc.bone);
    });
  }

  function drawOverlay(rtime) {
    ctx.fillStyle = 'rgba(20,16,12,0.55)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const cw = 620, chh = 380, cx = VIEW_W / 2 - cw / 2;
    const p = Math.min(1, overlay.t / 0.22), ease = 1 - Math.pow(1 - p, 3);
    const cy = VIEW_H / 2 - chh / 2 + (1 - ease) * 40;
    ctx.globalAlpha = ease;
    drawSpeciesCard(ctx, 'full', overlay.spec, cx, cy, cw, chh, makeCanvas, rtime);
    if (overlay.t > 0.6) text(ctx, 'press any key', VIEW_W / 2, cy + chh + 14, { size: 11, align: 'center', color: PALETTE.creamDim });
    ctx.globalAlpha = 1;
  }

  // --------------------------------------------------------------- collection
  const DEX = { px: 60, py: 40, cols: 7, cellH: 68 };
  function collectionCellAt(mx, my) {
    const pw = VIEW_W - 120, cellW = (pw - 48) / DEX.cols;
    for (let i = 0; i < FOSSILS.length; i++) {
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = DEX.py + 84 + Math.floor(i / DEX.cols) * DEX.cellH;
      if (mx >= cx && mx <= cx + cellW - 8 && my >= cy && my <= cy + DEX.cellH - 8) return FOSSILS[i];
    }
    return null;
  }
  function drawCollection() {
    ctx.fillStyle = 'rgba(20,16,12,0.6)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    const pw = VIEW_W - 120, ph = VIEW_H - 80;
    blueprintPanel(ctx, DEX.px, DEX.py, pw, ph, { frameW: 10, r: 16 });
    text(ctx, 'FIELD JOURNAL', DEX.px + 28, DEX.py + 22, { size: 22, bold: true });
    text(ctx, `${collection.completedCount()} / ${collection.total()} skeletons · ${collection.score()} pts · click a find for its dossier`, DEX.px + 28, DEX.py + 52, { size: 12, color: PALETTE.creamDim });
    const cellW = (pw - 48) / DEX.cols;
    FOSSILS.forEach((f, i) => {
      const cx = DEX.px + 24 + (i % DEX.cols) * cellW, cy = DEX.py + 84 + Math.floor(i / DEX.cols) * DEX.cellH;
      if (cy > DEX.py + ph - 20) return;
      const frac = collection.fraction(f.id), started = collection.started(f.id);
      roundRect(ctx, cx, cy, cellW - 8, DEX.cellH - 8, 8);
      ctx.fillStyle = frac >= 1 ? 'rgba(108,154,84,0.18)' : started ? 'rgba(200,121,30,0.12)' : 'rgba(0,0,0,0.10)';
      ctx.fill();
      if (started) { ctx.lineWidth = 2; ctx.strokeStyle = frac >= 1 ? PALETTE.good : PALETTE.amber; ctx.stroke(); }
      ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cellW - 8, DEX.cellH - 26); ctx.clip();
      ctx.globalAlpha = started ? 0.3 + frac * 0.7 : 0.14;
      drawFossil(ctx, f, cx + (cellW - 8) / 2 - f.footprint[0] * 6, cy + 4, makeCanvas, 0.55);
      ctx.globalAlpha = 1; ctx.restore();
      text(ctx, started ? f.name : '???', cx + (cellW - 8) / 2, cy + DEX.cellH - 22, { size: 9, bold: frac >= 1, align: 'center', color: started ? PALETTE.cream : PALETTE.creamDim });
      text(ctx, `${collection.bonesMounted(f.id)}/${collection.bonesNeeded(f.id)}`, cx + (cellW - 8) / 2, cy + DEX.cellH - 12, { size: 8, align: 'center', color: PALETTE.creamDim });
    });
    text(ctx, 'TAB / ESC to close', DEX.px + pw - 28, DEX.py + ph - 24, { size: 11, align: 'right', color: PALETTE.creamDim });
  }

  function hashCol(x, salt) {
    let n = Math.imul(x | 0, 374761393) + Math.imul(salt | 0, 668265263) + 987;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }
  function shuffle(arr, seed) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (Math.imul(seed + i, 2654435761) >>> 0) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  return { enter() {}, update, render, leave() { persist(); } };
}
