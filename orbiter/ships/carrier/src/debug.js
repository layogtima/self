// Perf bisection panel. Toggle whole subsystems on/off and watch the fps/draw
// readout (top-right) move — this is how you find what's costing the frame.
// Toggle the panel with the O key. Injects its own DOM + styles.

const CSS = `
#dbg-panel {
  position: fixed; right: 12px; top: 40px; z-index: 30; width: 220px;
  font-family: "SF Mono", Menlo, monospace; font-size: 11px; color: #cfe0ef;
  background: rgba(6,10,18,0.9); border: 1px solid rgba(126,224,255,0.25);
  border-radius: 6px; padding: 8px 10px; display: none; user-select: none;
  box-shadow: 0 8px 30px rgba(0,0,0,0.5);
}
#dbg-panel.open { display: block; }
#dbg-panel h4 {
  margin: 8px 0 4px; font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase;
  color: #7ee0ff; font-weight: 600;
}
#dbg-panel h4:first-child { margin-top: 0; }
#dbg-panel label {
  display: flex; align-items: center; gap: 7px; padding: 2px 0; cursor: pointer;
}
#dbg-panel label:hover { color: #fff; }
#dbg-panel input { accent-color: #7ee0ff; margin: 0; }
#dbg-panel .row { display: flex; gap: 5px; margin: 4px 0 2px; }
#dbg-panel .row button {
  flex: 1; cursor: pointer; font: inherit; color: #cfe0ef; padding: 3px 0;
  background: rgba(20,40,60,0.6); border: 1px solid rgba(126,224,255,0.2); border-radius: 3px;
}
#dbg-panel .row button.on { background: rgba(126,224,255,0.28); color: #fff; border-color: #7ee0ff; }
#dbg-panel .hint { color: rgba(207,224,239,0.4); font-size: 9px; margin-top: 8px; }
`;

export function createDebugPanel({ renderer, scene, post, flags, groups }) {
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.id = 'dbg-panel';
  document.body.appendChild(panel);

  // recompile materials (needed after toggling shadows)
  const recompile = () => scene.traverse((o) => {
    if (!o.material) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; });
  });

  // — toggle definitions: [label, isOn(), setOn(bool)] —
  const objectToggle = (label, get) => [label,
    () => { const o = get(); return o ? o.visible : false; },
    (on) => { const o = get(); if (o) o.visible = on; }];

  const objects = [
    objectToggle('Guests (300)', () => groups.guests?.mesh),
    objectToggle('Coaster', () => groups.coaster?.group),
    objectToggle('Ferris wheel', () => groups.ferris?.group),
    objectToggle('Carousel', () => groups.carousel?.group),
    objectToggle('Props · trees · stalls', () => groups.props?.group),
    objectToggle('Ship hull + greebles', () => groups.ship?.group),
    objectToggle('Habitat glass', () => groups.habitat?.group),
    objectToggle('Interior decks', () => groups.interior?.group),
    objectToggle('Deck floor', () => groups.deck?.floor),
    objectToggle('Atmosphere haze', () => groups.atmosphere?.group),
    objectToggle('Starfield / planet', () => groups.space?.group),
  ];

  const rendering = [
    ['Shadows',
      () => renderer.shadowMap.enabled,
      (on) => { renderer.shadowMap.enabled = on; recompile(); }],
    ['Post FX (composer)',
      () => flags.usePost,
      (on) => { flags.usePost = on; }],
    ['Bloom',
      () => post.bloom.enabled,
      (on) => { post.bloom.enabled = on; }],
  ];

  function section(title, toggles) {
    const h = document.createElement('h4'); h.textContent = title; panel.appendChild(h);
    for (const [label, get, set] of toggles) {
      const lab = document.createElement('label');
      const box = document.createElement('input'); box.type = 'checkbox'; box.checked = get();
      box.onchange = () => set(box.checked);
      lab.appendChild(box); lab.appendChild(document.createTextNode(label));
      panel.appendChild(lab);
    }
  }

  section('Scene objects', objects);
  section('Rendering', rendering);

  // resolution row — DPR presets + half-res
  const h = document.createElement('h4'); h.textContent = 'Resolution (DPR)'; panel.appendChild(h);
  const row = document.createElement('div'); row.className = 'row';
  const applyDPR = (v) => {
    renderer.setPixelRatio(v);
    post.resize(innerWidth, innerHeight);
    [...row.children].forEach((b) => b.classList.toggle('on', +b.dataset.dpr === v));
  };
  for (const v of [0.75, 1.0, 1.25, 1.5]) {
    const b = document.createElement('button'); b.textContent = v; b.dataset.dpr = v;
    b.onclick = () => applyDPR(v);
    if (Math.abs(renderer.getPixelRatio() - v) < 0.01) b.classList.add('on');
    row.appendChild(b);
  }
  panel.appendChild(row);

  const hint = document.createElement('div'); hint.className = 'hint';
  hint.textContent = 'O panel · toggle a system, watch fps top-right';
  panel.appendChild(hint);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyO') panel.classList.toggle('open');
  });

  return { open: () => panel.classList.add('open'), el: panel };
}
