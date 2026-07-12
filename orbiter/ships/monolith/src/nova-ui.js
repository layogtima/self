import { attachPortrait } from './nova-entity.js';

// The Nova Console: power chips + her voice. N toggles, hotkeys 1-9 fire
// while open. Every activation ripples through her 3D form (onFire hook).

export function createNovaUI(powersApi, { toast, onFire }) {
  const root = document.getElementById('nova-console');
  const list = document.getElementById('nova-powers');
  const lineEl = document.getElementById('nova-line');
  const portrait = document.getElementById('nova-portrait');
  attachPortrait(portrait);

  let open = false;
  let typing = null;

  function say(text) {
    clearInterval(typing);
    lineEl.textContent = '';
    let i = 0;
    typing = setInterval(() => {
      lineEl.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typing);
    }, 12);
  }

  for (const p of powersApi.powers) {
    const chip = document.createElement('div');
    chip.className = 'nova-chip';
    chip.innerHTML = `<b>${p.hotkey}</b> ${p.name}`;
    chip.addEventListener('click', () => fire(p.key));
    list.appendChild(chip);
  }

  function fire(key) {
    const res = powersApi.fire(key);
    if (!res) return;
    say(res.line);
    if (res.detail) toast(res.detail);
    onFire?.(key);
  }

  const IDLE_HINTS = [
    'Go on. Press a number. The universe is load-bearing but flexible.',
    'Reality here is a suggestion I make to physics. Physics agrees. It knows better.',
    'Nothing you break is anything I can\'t rebuild before you notice. Usually before you press it.',
  ];

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    const p = powersApi.powers.find((x) => x.hotkey === e.key);
    if (p) fire(p.key);
  });

  return {
    toggle(force) {
      open = force !== undefined ? force : !open;
      root.classList.toggle('show', open);
      if (open) say(IDLE_HINTS[Math.floor(Math.random() * IDLE_HINTS.length)]);
      return open;
    },
    isOpen: () => open,
    say,
  };
}
