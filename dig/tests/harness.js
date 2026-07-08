// Headless test harness: stub the browser globals the game touches, so modules
// can be imported and driven under node. Rendering is stubbed to no-ops; logic
// runs for real.

export function installStubs() {
  const noop = () => {};

  // a chainable canvas 2D context stub
  function makeCtx() {
    const grad = { addColorStop: noop };
    const imageData = (w = 1, h = 1) => ({ width: w, height: h, data: new Uint8ClampedArray(w * h * 4) });
    return new Proxy({}, {
      get(_, k) {
        if (k === 'measureText') return () => ({ width: 100 });
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => grad;
        if (k === 'createImageData') return (w, h) => imageData(w, h);
        if (k === 'getImageData') return (x, y, w, h) => imageData(w, h);
        if (k === 'canvas') return null;
        return noop;
      },
      set() { return true; },
    });
  }

  function makeCanvas(w = 0, h = 0) {
    return { width: w, height: h, getContext: () => makeCtx() };
  }

  globalThis.document = {
    getElementById: () => makeCanvas(960, 540),
    createElement: () => makeCanvas(),
  };
  globalThis.window = globalThis;

  class ImageStub { constructor() { this.onload = null; this.onerror = null; } set src(_) { /* never loads in tests */ } }
  globalThis.Image = ImageStub;

  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
    clear: () => store.clear(),
  };

  let t = 0;
  globalThis.performance = { now: () => (t += 16.67) };
  globalThis.requestAnimationFrame = noop;
  globalThis.AudioContext = undefined;   // audio no-ops without a context

  return { makeCanvas, makeCtx };
}

// minimal assert with a running tally
export function makeAsserter() {
  let passed = 0, failed = 0;
  const failures = [];
  return {
    ok(cond, msg) { if (cond) { passed++; console.log('  ✓', msg); } else { failed++; failures.push(msg); console.error('  ✗', msg); } },
    eq(a, b, msg) { this.ok(a === b, `${msg} (got ${a}, want ${b})`); },
    done() {
      console.log(`\n${failed ? '✗' : '✓'} ${passed} passed, ${failed} failed`);
      if (failed) { console.error('failures:\n - ' + failures.join('\n - ')); process.exit(1); }
    },
  };
}
