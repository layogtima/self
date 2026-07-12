// ui.js — wordless. A single start-ring you click to descend, a faint
// crosshair, and a fade layer for seamless level transitions. No HUD, no text.
export function makeUI() {
  const start = document.getElementById('start');
  const crosshair = document.getElementById('crosshair');
  const fade = document.getElementById('fade');

  let startCb = null;
  start.addEventListener('click', () => { if (startCb) { const h = startCb; startCb = null; h(); } });

  return {
    onStart(cb) { startCb = cb; },
    hideStart() { start.classList.add('gone'); },
    showStart() { start.classList.remove('gone'); },
    showCrosshair() { crosshair.classList.remove('hidden'); },
    hideCrosshair() { crosshair.classList.add('hidden'); },

    // fade to black, run swap() while hidden, fade back in — seamless
    transition(swap, done) {
      fade.classList.add('black');
      setTimeout(() => {
        swap();
        // next tick so the swap paints before we lift the veil
        requestAnimationFrame(() => requestAnimationFrame(() => {
          fade.classList.remove('black');
          if (done) setTimeout(done, 700);
        }));
      }, 720);
    },

    // start from black and lift (used on first descend)
    liftFromBlack() {
      fade.classList.add('black');
      requestAnimationFrame(() => requestAnimationFrame(() => fade.classList.remove('black')));
    },
  };
}
