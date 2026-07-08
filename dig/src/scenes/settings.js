// Settings / pause panel — blueprint dossier style. SFX + music sliders,
// screen-shake toggle, reset save. Doubles as the pause menu via {overlay:true}.

import { VIEW_W, VIEW_H } from '../config.js';
import { PALETTE } from '../render/palette.js';
import { text, blueprintPanel, roundRect } from '../render/text.js';
import { mouse, pressed } from '../core/input.js';
import { setVolume, setMusicVolume, sfx } from '../core/audio.js';
import { clearSave, writeSave } from '../core/save.js';

export function makeSettingsScene(services, opts = {}) {
  const { ctx, settings } = services;
  const back = opts.back || 'title';
  const px = VIEW_W / 2 - 220, py = 74, pw = 440, ph = 380;

  const sfxSlider = { x: px + 160, y: py + 84, w: 210, h: 8, key: 'volume', apply: setVolume, label: 'SFX' };
  const musSlider = { x: px + 160, y: py + 134, w: 210, h: 8, key: 'music', apply: setMusicVolume, label: 'Music' };
  const shakeBox = { x: px + 160, y: py + 172, w: 24, h: 24 };
  const filterBox = { x: px + 160, y: py + 202, w: 24, h: 24 };
  const resetBtn = { x: px + 40, y: py + 262, w: 165, h: 42 };
  const backBtn = { x: px + pw - 205, y: py + 262, w: 165, h: 42 };

  let resetFlash = 0;
  let dragging = null;
  const hit = b => mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;

  function persist() {
    const s = services.save || {};
    writeSave({ ...s, settings: { ...settings } });
  }
  function goBack() { sfx.uiBack(); persist(); services.go(back); }

  function sliderHit(sl) {
    return mouse.x >= sl.x - 8 && mouse.x <= sl.x + sl.w + 8 && Math.abs(mouse.y - sl.y - 2) < 14;
  }
  function setFromMouse(sl) {
    settings[sl.key] = Math.max(0, Math.min(1, (mouse.x - sl.x) / sl.w));
    sl.apply(settings[sl.key]);
  }

  return {
    update(dt) {
      resetFlash = Math.max(0, resetFlash - dt);
      if (pressed('Escape')) { goBack(); return; }
      if (pressed('MouseLeft')) {
        if (sliderHit(sfxSlider)) { dragging = sfxSlider; setFromMouse(sfxSlider); sfx.ui(); persist(); }
        else if (sliderHit(musSlider)) { dragging = musSlider; setFromMouse(musSlider); persist(); }
        else if (hit(shakeBox)) { settings.shake = !settings.shake; sfx.ui(); persist(); }
        else if (hit(filterBox)) { settings.filter = settings.filter === false; sfx.ui(); persist(); }
        else if (hit(resetBtn)) { clearSave(); services.save = null; resetFlash = 1.2; sfx.uiBack(); }
        else if (hit(backBtn)) { goBack(); }
      }
      if (dragging) {
        if (mouse.left) setFromMouse(dragging);
        else { dragging = null; persist(); }
      }
    },
    render() {
      if (opts.overlay && opts.backdrop) {
        ctx.drawImage(opts.backdrop, 0, 0);                  // frozen game frame
        ctx.fillStyle = 'rgba(20,25,38,0.55)';
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      } else {
        ctx.fillStyle = PALETTE.skyDusk;
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      }

      blueprintPanel(ctx, px, py, pw, ph, { frameW: 8, r: 16 });
      text(ctx, opts.overlay ? 'PAUSED' : 'SETTINGS', px + pw / 2, py + 26, { size: 24, bold: true, align: 'center' });

      for (const sl of [sfxSlider, musSlider]) {
        text(ctx, sl.label, px + 42, sl.y - 6, { size: 15, bold: true });
        roundRect(ctx, sl.x, sl.y - 2, sl.w, sl.h + 4, 5);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        ctx.fillStyle = PALETTE.amber;
        ctx.fillRect(sl.x + 2, sl.y, (sl.w - 4) * settings[sl.key], sl.h);
        ctx.beginPath();
        ctx.arc(sl.x + 2 + (sl.w - 4) * settings[sl.key], sl.y + 4, 9, 0, Math.PI * 2);
        ctx.fillStyle = PALETTE.cream; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = PALETTE.frameDark; ctx.stroke();
      }

      text(ctx, 'Screen shake', px + 42, shakeBox.y + 4, { size: 15, bold: true });
      roundRect(ctx, shakeBox.x, shakeBox.y, shakeBox.w, shakeBox.h, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = PALETTE.frameLight; ctx.stroke();
      if (settings.shake) {
        ctx.fillStyle = PALETTE.amber;
        ctx.fillRect(shakeBox.x + 5, shakeBox.y + 5, shakeBox.w - 10, shakeBox.h - 10);
      }

      text(ctx, 'Film filter', px + 42, filterBox.y + 4, { size: 15, bold: true });
      roundRect(ctx, filterBox.x, filterBox.y, filterBox.w, filterBox.h, 6);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = PALETTE.frameLight; ctx.stroke();
      if (settings.filter !== false) {
        ctx.fillStyle = PALETTE.amber;
        ctx.fillRect(filterBox.x + 5, filterBox.y + 5, filterBox.w - 10, filterBox.h - 10);
      }

      for (const [b, label, primary] of [[resetBtn, resetFlash > 0 ? 'Save cleared' : 'Reset save', false], [backBtn, opts.overlay ? 'Resume' : 'Back', true]]) {
        roundRect(ctx, b.x, b.y, b.w, b.h, 10);
        ctx.fillStyle = primary ? PALETTE.amber : PALETTE.frameDark;
        ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = hit(b) ? PALETTE.cream : PALETTE.frameDark; ctx.stroke();
        text(ctx, label, b.x + b.w / 2, b.y + b.h / 2, { size: 15, bold: true, align: 'center', baseline: 'middle', color: primary ? '#3B2F16' : PALETTE.cream });
      }

      text(ctx, 'ESC to close', px + pw / 2, py + ph - 26, { size: 11, align: 'center', color: PALETTE.creamDim });
    },
  };
}
