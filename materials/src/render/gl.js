// Live 3D, kept deliberately small: the hero cloud and the open detail specimen, nothing
// else. Both are single objects in a shared scene drawn into a scissor rect over their DOM
// slot, so they track scrolling exactly. When neither is on screen the loop draws nothing —
// browsing the grid costs no GPU at all.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeMesh } from './specimens.js';

const HERO_COUNT = 16; // a cloud, not an inventory

export function createRenderer() {
  const canvas = document.getElementById('gl');
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'default' });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;

  // 2x device pixel ratio quadruples the fragment work for very little visible gain here.
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearAlpha(0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const scene = new THREE.Scene();
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(2.5, 3.5, 2.5);
  scene.add(key);

  /** At most two entries: the hero and the open dialog. */
  const views = new Map();
  const nav = document.getElementById('nav');
  let calm = false;
  let dirty = true;
  let running = true;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = views.get(e.target);
        if (v) v.visible = e.isIntersecting;
      }
      dirty = true;
    },
    { rootMargin: '80px' }
  );

  function addView(el, view) {
    views.set(el, { visible: false, ...view });
    io.observe(el);
    dirty = true;
  }

  function removeView(el) {
    const v = views.get(el);
    if (!v) return;
    v.controls?.dispose();
    io.unobserve(el);
    views.delete(el);
    dirty = true;
  }

  function addHero(materials, el) {
    if (!el) return;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 14);
    const group = new THREE.Group();

    // Curated for texture and colour variety — a shop window, not a sample of the list.
    const WANTED = [
      'gold', 'concrete', 'roundwood', 'copper', 'glass', 'coal', 'iron-ore', 'cotton',
      'steel', 'sulfur', 'brick', 'silicon', 'natural-rubber', 'bauxite', 'plastics', 'graphite',
    ];
    const byId = new Map(materials.map((m) => [m.id, m]));
    const picks = WANTED.map((id) => byId.get(id)).filter(Boolean);
    for (const m of materials) {
      if (picks.length >= HERO_COUNT) break;
      if (!picks.includes(m)) picks.push(m);
    }
    picks.length = Math.min(picks.length, HERO_COUNT);

    const golden = Math.PI * (3 - Math.sqrt(5));
    picks.forEach((m, i) => {
      const mesh = makeMesh(m, 'card');
      const y = 1 - (i / Math.max(1, picks.length - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const shell = 2.6 + (i % 3) * 0.55;
      mesh.position.set(Math.cos(theta) * r * shell, y * 3.1, Math.sin(theta) * r * shell - 1);
      mesh.scale.setScalar(0.5 + (m.specimen.seed % 5) * 0.05);
      mesh.userData.spin = 0.1 + (m.specimen.seed % 7) * 0.02;
      group.add(mesh);
    });

    addView(el, {
      object: group,
      camera,
      layer: 'hero',
      update: (t) => {
        group.rotation.y = t * 0.045;
        group.rotation.x = Math.sin(t * 0.09) * 0.09;
        for (const mesh of group.children) {
          mesh.rotation.y += mesh.userData.spin * 0.01;
          mesh.rotation.x += mesh.userData.spin * 0.004;
        }
      },
    });
  }

  let detailEl = null;
  function addDetail(material, el) {
    if (!el) return;
    removeDetail();
    const mesh = makeMesh(material, 'detail');
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
    camera.position.set(0, 0.35, 5.4);
    const controls = new OrbitControls(camera, el);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.7;
    controls.addEventListener('change', () => {
      dirty = true;
    });
    detailEl = el;
    addView(el, {
      object: mesh,
      camera,
      layer: 'dialog',
      controls,
      update: (t) => {
        mesh.rotation.y = material.specimen.seed * 0.7 + t * 0.12;
        controls.update();
      },
    });
  }

  function removeDetail() {
    if (detailEl) removeView(detailEl);
    detailEl = null;
  }

  function resize() {
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setSize(innerWidth, innerHeight, false);
    dirty = true;
  }
  addEventListener('resize', resize, { passive: true });
  addEventListener('scroll', () => {
    dirty = true;
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    dirty = true;
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    running = false;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    running = true;
    resize();
  });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!running || document.hidden) return;

    const dialogOpen = !!detailEl && views.has(detailEl);
    const active = [];
    for (const [el, v] of views) {
      if (!v.visible) continue;
      if (dialogOpen ? v.layer !== 'dialog' : v.layer === 'dialog') continue;
      active.push([el, v]);
    }
    // Nothing on screen worth drawing: skip the frame entirely rather than clearing.
    if (!active.length) return;
    if (calm && !dirty) return;
    dirty = false;

    const t = now / 1000;
    const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
    const height = innerHeight;

    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);

    for (const [el, v] of active) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.bottom <= 0 || r.top >= height) continue;
      const top = Math.max(r.top, v.layer === 'dialog' ? 0 : navBottom);
      const bottom = Math.min(r.bottom, height);
      const h = bottom - top;
      if (h <= 1) continue;

      if (!calm) v.update(t);

      v.camera.aspect = r.width / Math.max(1, r.height);
      v.camera.updateProjectionMatrix();
      v.camera.setViewOffset(r.width, r.height, 0, top - r.top, r.width, h);

      scene.add(v.object);
      renderer.setViewport(r.left, height - bottom, r.width, h);
      renderer.setScissor(r.left, height - bottom, r.width, h);
      renderer.render(scene, v.camera);
      scene.remove(v.object);
    }
    renderer.setScissorTest(false);
  }
  requestAnimationFrame(frame);

  return {
    addHero,
    addDetail,
    removeDetail,
    markDirty() {
      dirty = true;
    },
    setCalm(v) {
      calm = v;
      dirty = true;
    },
    renderer,
    viewCount: () => views.size,
  };
}
