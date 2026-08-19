// App state, mirrored into the URL hash so every view is linkable, plus a little localStorage.

const KEY = 'material.prefs';
const DEFAULTS = { q: '', sort: 'made', classes: [], detail: null, calm: false, theme: 'system' };

const listeners = new Set();
export const state = { ...DEFAULTS };

let applying = false;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(changed) {
  for (const fn of listeners) fn(state, changed);
}

export function set(patch, { silent = false } = {}) {
  const changed = [];
  for (const [k, v] of Object.entries(patch)) {
    if (JSON.stringify(state[k]) === JSON.stringify(v)) continue;
    state[k] = v;
    changed.push(k);
  }
  if (!changed.length) return;
  if (!silent) {
    // Safari rate-limits replaceState; a throw here must not strand the UI mid-update.
    try {
      writeHash();
    } catch (err) {
      console.warn('MATERIALS: could not sync the URL.', err);
    }
    savePrefs();
    emit(changed);
  }
}

const VALID_SORTS = ['made', 'stock', 'crust', 'name', 'year'];
// 'system' is not a colour, it is the absence of an override: the stylesheet decides.
const VALID_THEMES = ['system', 'light', 'dark'];
// The three lists collapsed into one. Old links carrying ?view= still resolve; the
// two retired lists survive as sort orders, so point them at the equivalent one.
const RETIRED_VIEWS = { crust: 'crust', made: 'stock', flow: 'made' };

/** Our state hash always contains '='. Plain anchors (#grid, #about) are not state. */
function isStateHash() {
  return location.hash.includes('=');
}

function parseHash() {
  const raw = location.hash.replace(/^#/, '');
  const out = {};
  if (!raw) return out;
  const params = new URLSearchParams(raw);
  if (params.has('q')) out.q = params.get('q');
  // Array membership, not `in` — `#sort=constructor` would otherwise pass validation.
  if (VALID_SORTS.includes(params.get('sort'))) out.sort = params.get('sort');
  else if (Object.hasOwn(RETIRED_VIEWS, params.get('view') ?? '')) out.sort = RETIRED_VIEWS[params.get('view')];
  if (params.has('class')) out.classes = params.get('class').split(',').filter(Boolean);
  out.detail = params.get('m') || null;
  return out;
}

function writeHash() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.sort !== DEFAULTS.sort) params.set('sort', state.sort);
  if (state.classes.length) params.set('class', state.classes.join(','));
  if (state.detail) params.set('m', state.detail);
  const hash = params.toString();
  const next = hash ? `#${hash}` : location.pathname + location.search;
  if (location.hash.replace(/^#/, '') !== hash) history.replaceState(null, '', next);
}

function savePrefs() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ calm: state.calm, sort: state.sort, theme: state.theme }));
  } catch {
    /* private mode, storage full — preferences just don't persist */
  }
}

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

/** Read hash + storage into state once at boot, then keep listening for back/forward. */
export function initState() {
  const prefs = loadPrefs();
  const prefersCalm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  Object.assign(state, DEFAULTS, {
    calm: typeof prefs.calm === 'boolean' ? prefs.calm : prefersCalm,
    sort: VALID_SORTS.includes(prefs.sort) ? prefs.sort : DEFAULTS.sort,
    theme: VALID_THEMES.includes(prefs.theme) ? prefs.theme : DEFAULTS.theme,
  }, isStateHash() ? parseHash() : {});

  window.addEventListener('hashchange', () => {
    if (applying) return;
    // In-page anchors ("Browse all materials", the wordmark) must not reset the filters.
    if (!isStateHash()) return;
    applying = true;
    const from = parseHash();
    const changed = [];
    for (const [k, v] of Object.entries({ ...DEFAULTS, ...from, calm: state.calm, theme: state.theme })) {
      if (JSON.stringify(state[k]) === JSON.stringify(v)) continue;
      state[k] = v;
      changed.push(k);
    }
    applying = false;
    if (changed.length) emit(changed);
  });

  writeHash();
  return state;
}
