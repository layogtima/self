import * as THREE from 'three';
import gsap from 'gsap';
import { createPlanet, VOID_PALETTES } from './space.js';
import { makeRng } from './rng.js';
import { ATRIUM } from './config.js';
import { sfx } from './audio.js';

// Nova's powers. Each is real — it changes the world, not a toast.
// ctx: { scene, camera, space, lights, atmosphere, post, walk, manage, build,
//        getMode, setMode, toast }

const rng = makeRng(4242);

const PLANET_PALETTES = [
  { a: 0xc86a4a, b: 0x5e2c1e, c: 0xe8c9a0 }, // rust giant
  { a: 0x6fb87f, b: 0x2c5e3d, c: 0xc9e8d0 }, // jade world
  { a: 0x8a6ab8, b: 0x3d2c5e, c: 0xd6c9e8 }, // amethyst
  { a: 0xb8a44a, b: 0x5e522c, c: 0xe8e0c9 }, // amber
  { a: 0x4a8ab8, b: 0x1e3a5e, c: 0xa0d0e8 }, // classic blue
  { a: 0xd85a3a, b: 0x6e1a10, c: 0xffb060 }, // ember world
  { a: 0x3ab8a8, b: 0x0e4a44, c: 0xa0e8dd }, // verdigris
  { a: 0xd88ab8, b: 0x5e2c4a, c: 0xf0d0e0 }, // rose giant
];

function makeShockwave(scene, position, radius) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const ctx2 = cv.getContext('2d');
  const g = ctx2.createRadialGradient(64, 64, 40, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.8, 'rgba(180,220,255,0.9)');
  g.addColorStop(1, 'rgba(120,180,255,0)');
  ctx2.fillStyle = g;
  ctx2.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending });
  const s = new THREE.Sprite(mat);
  s.position.copy(position);
  s.scale.setScalar(radius * 1.4);
  scene.add(s);
  gsap.to(s.scale, { x: radius * 7, y: radius * 7, z: radius * 7, duration: 1.6, ease: 'power3.out' });
  gsap.to(mat, { opacity: 0, duration: 1.6, ease: 'power2.out', onComplete: () => { scene.remove(s); mat.dispose(); tex.dispose(); } });
}

export function createPowers(ctx) {
  const spawned = [];
  let paletteIdx = 0;
  let timeWarping = false;
  let charging = false;

  const powers = [
    {
      key: 'planet', hotkey: '1', name: 'Blink Planet',
      lines: [
        'Feel that pull? That\'s a planet clearing its throat.',
        'I made this one slightly illegal. Enjoy.',
        'It has weather now. Don\'t ask what kind.',
      ],
      execute() {
        if (charging) return 'one cosmos at a time, Director';
        charging = true;
        sfx('planetCharge');
        const vig = ctx.post.vignette;
        // 1.2s gravitational charge: the whole view pinches…
        gsap.to(vig.uniforms.get('darkness'), { value: 0.95, duration: 1.15, ease: 'power2.in' });
        gsap.delayedCall(1.2, () => {
          if (spawned.length >= 6) {
            const old = spawned.shift();
            gsap.to(old.group.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.6, ease: 'back.in(2)', onComplete: () => old.dispose() });
          }
          const u = rng.next() * 2 - 1;
          const theta = rng.next() * Math.PI * 2;
          const dist = rng.range(3000, 7500);
          const s = Math.sqrt(1 - u * u);
          const radius = rng.range(150, 2200);
          const p = createPlanet({
            position: new THREE.Vector3(dist * s * Math.cos(theta), dist * u * 0.6 + 400, dist * s * Math.sin(theta)),
            radius,
            seed: Math.floor(rng.next() * 1e6),
            tilt: rng.range(0.2, 0.9),
            rings: rng.chance(0.6),
            palette: rng.pick(PLANET_PALETTES),
          });
          // 40% get a moon on an eternal gsap orbit
          if (rng.chance(0.4)) {
            const pivot = new THREE.Group();
            const moon = new THREE.Mesh(
              new THREE.SphereGeometry(radius * rng.range(0.1, 0.2), 20, 14),
              new THREE.MeshStandardMaterial({ color: 0xa8adb6, roughness: 1 })
            );
            moon.position.x = radius * rng.range(1.9, 2.8);
            pivot.add(moon);
            pivot.rotation.x = rng.range(-0.4, 0.4);
            p.group.add(pivot);
            gsap.to(pivot.rotation, { y: Math.PI * 2, duration: rng.range(30, 80), repeat: -1, ease: 'none' });
          }
          ctx.scene.add(p.group);
          p.group.scale.setScalar(0.001);
          gsap.to(p.group.scale, { x: 1, y: 1, z: 1, duration: 1.1, ease: 'elastic.out(1, 0.45)' });
          spawned.push(p);
          // …then SNAPS: shockwave + boom + chroma kick + vignette release
          makeShockwave(ctx.scene, p.group.position, radius);
          sfx('planetBoom');
          gsap.to(vig.uniforms.get('darkness'), { value: 0.52, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
          const ch = ctx.post.chroma.offset;
          gsap.fromTo(ch, { x: 0.006, y: 0.004 }, { x: 0, y: 0, duration: 0.7, ease: 'power2.out' });
          charging = false;
        });
      },
    },
    {
      key: 'gravity', hotkey: '2', name: 'Gravity: Optional',
      lines: [
        'Gravity is a lifestyle choice, and today we\'re choosing whimsy.',
        'Gravity restored. The floor missed you.',
      ],
      lineIndexBy: () => (ctx.walk.getGravity() ? 0 : 1),
      execute() {
        ctx.walk.setGravity(!ctx.walk.getGravity());
        return ctx.walk.getGravity() ? 'gravity: ON' : 'gravity: OFF — the floor is now a suggestion';
      },
    },
    {
      key: 'timewarp', hotkey: '3', name: 'Time Warp',
      lines: ['Let\'s skip ahead. Time is a suggestion I routinely ignore.'],
      execute() {
        if (timeWarping) return 'time is already warping';
        timeWarping = true;
        const sun = ctx.lights.sun;
        const r = sun.position.length();
        const state = { a: Math.atan2(sun.position.y, sun.position.x) };
        gsap.to(state, {
          a: state.a + Math.PI * 2, duration: 20, ease: 'power1.inOut',
          onUpdate() {
            sun.position.set(Math.cos(state.a) * r * 0.8, Math.sin(state.a) * r * 0.7 + 150, sun.position.z);
            sun.intensity = 3.1 * Math.max(0.12, Math.sin(state.a) * 0.5 + 0.6);
          },
          onComplete() { timeWarping = false; },
        });
      },
    },
    {
      key: 'warp', hotkey: '4', name: 'Warp Drive',
      lines: ['Hold onto your churros.'],
      execute() {
        sfx('warp');
        ctx.space.hyperspaceSweep({});
        const cam = ctx.camera;
        const chroma = ctx.post.chroma;
        const stars = ctx.space.starGroup;
        const t = { f: 0 };
        gsap.timeline()
          .to(cam, { fov: 86, duration: 1.2, ease: 'power2.in', onUpdate: () => cam.updateProjectionMatrix() })
          .to(t, {
            f: 1, duration: 2.6, ease: 'none',
            onUpdate() {
              stars.rotation.y += 0.06 * t.f;
              chroma.offset.set(0.004 * Math.sin(t.f * 40), 0.004 * Math.cos(t.f * 31));
              cam.position.x += (Math.random() - 0.5) * 0.6 * t.f;
              cam.position.y += (Math.random() - 0.5) * 0.6 * t.f;
            },
          }, '<0.4')
          .to(cam, { fov: 52, duration: 1.4, ease: 'elastic.out(1, 0.6)', onUpdate: () => cam.updateProjectionMatrix() })
          .to(chroma.offset, { x: 0, y: 0, duration: 0.5 }, '<');
      },
    },
    {
      key: 'disco', hotkey: '5', name: 'Disco Nova',
      lines: ['The void invented disco. I was there. Hit it.'],
      execute() {
        ctx.atmosphere.startDisco(10);
        const bloom = ctx.post.bloom;
        gsap.to(bloom, { intensity: 1.5, duration: 0.4, yoyo: true, repeat: 19, ease: 'sine.inOut' });
      },
    },
    {
      key: 'teleport', hotkey: '6', name: 'Teleport',
      lines: ['Zip! Try to keep your shoes on.'],
      execute() {
        const spots = [{ name: 'The Atrium', walk: true, pos: new THREE.Vector3(0, 1.75, 52), look: new THREE.Vector3(0, 12, 0) }];
        for (const piece of ctx.growth.pieces.values()) {
          if (piece.kind === 'atrium') continue;
          if (piece.kind === 'bay' && piece.sealed) continue;
          spots.push({
            name: piece.kind === 'bay' ? 'an observation bay' : piece.kind === 'hall' ? 'a hallway' : 'a grown chamber',
            walk: true,
            pos: new THREE.Vector3(piece.x, 1.75, piece.z + 18),
            look: new THREE.Vector3(piece.x, 6, piece.z),
          });
        }
        spots.push({ name: 'outside, above the Monolith', walk: false, pos: new THREE.Vector3(520, 420, -520), look: new THREE.Vector3(0, 30, 0) });
        this._i = ((this._i ?? -1) + 1) % spots.length;
        const spot = spots[this._i];
        if (spot.walk) {
          if (ctx.getMode() !== 'walk') ctx.setMode('walk', { spawn: spot.pos, look: spot.look });
          else ctx.walk.teleport(spot.pos, spot.look);
        } else {
          if (ctx.getMode() === 'walk') ctx.setMode('manage');
          ctx.manage.setLookAt(spot.pos.x, spot.pos.y, spot.pos.z, spot.look.x, spot.look.y, spot.look.z, true);
        }
        return `→ ${spot.name}`;
      },
    },
    {
      key: 'scale', hotkey: '7', name: 'Scale Shift',
      lines: ['Size is a rumour.'],
      execute() {
        if (ctx.getMode() !== 'walk') ctx.setMode('walk', {});
        const s = ctx.walk.cycleScale();
        return `you are now: ${s}`;
      },
    },
    {
      key: 'paint', hotkey: '8', name: 'Paint the Void',
      lines: ['Mm, the void was due a repaint anyway.'],
      execute() {
        paletteIdx = (paletteIdx + 1) % VOID_PALETTES.length;
        const p = VOID_PALETTES[paletteIdx];
        ctx.space.applyPalette(p, ctx.scene);
        return `void: ${p.name}`;
      },
    },
    {
      key: 'growChamber', hotkey: '9', name: 'Grow Chamber',
      lines: [
        'Pick a spot beside something that exists. I\'ll handle the existing part.',
        'A chamber costs ⬡ 18,000. Wonder was never free, Director.',
      ],
      execute() {
        if (ctx.getMode() === 'walk') ctx.setMode('manage');
        ctx.growth.setGrowKind('chamber');
        return 'click a glowing slot — esc to cancel';
      },
    },
    {
      key: 'growHall', hotkey: '0', name: 'Grow Hall',
      lines: [
        'Hallways: the connective tissue of ambition. ⬡ 6,000.',
        'Somewhere to be between somewheres. Choose.',
      ],
      execute() {
        if (ctx.getMode() === 'walk') ctx.setMode('manage');
        ctx.growth.setGrowKind('hall');
        return 'click a glowing slot — esc to cancel';
      },
    },
  ];

  function fire(key) {
    const p = powers.find((x) => x.key === key);
    if (!p) return null;
    const detail = p.execute();
    const li = p.lineIndexBy ? p.lineIndexBy() : Math.floor(Math.random() * p.lines.length);
    return { line: p.lines[Math.min(li, p.lines.length - 1)], detail };
  }

  return { powers, fire };
}
