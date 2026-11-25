// App state, mirrored into the URL hash so every view is linkable, plus a little localStorage.

const KEY = 'material.prefs';
const DEFAULTS = {
  q: '',
  sort: 'made',
  classes: [],
  country: '',
  detail: null,
  compare: [],
  calm: false,
  theme: 'auto',
  level: 4,
  sections: null,
  icons: true,
  perPerson: false,
  scaleObject: 'auto',
};

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
  // Array membership, not `in`. `#sort=constructor` would otherwise pass validation.
  if (VALID_SORTS.includes(params.get('sort'))) out.sort = params.get('sort');
  else if (Object.hasOwn(RETIRED_VIEWS, params.get('view') ?? '')) out.sort = RETIRED_VIEWS[params.get('view')];
  if (params.has('class')) out.classes = params.get('class').split(',').filter(Boolean);
  if (params.has('from')) out.country = params.get('from');
  if (params.has('vs')) out.compare = params.get('vs').split(',').filter(Boolean).slice(0, 4);
  out.detail = params.get('m') || null;
  return out;
}

function writeHash() {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.sort !== DEFAULTS.sort) params.set('sort', state.sort);
  if (state.classes.length) params.set('class', state.classes.join(','));
  if (state.country) params.set('from', state.country);
  if (state.compare.length) params.set('vs', state.compare.join(','));
  if (state.detail) params.set('m', state.detail);
  const hash = params.toString();
  const next = hash ? `#${hash}` : location.pathname + location.search;
  if (location.hash.replace(/^#/, '') !== hash) history.replaceState(null, '', next);
}

function savePrefs() {
  try {
    const { calm, sort, theme, level, sections, icons, perPerson, scaleObject } = state;
    localStorage.setItem(KEY, JSON.stringify({ calm, sort, theme, level, sections, icons, perPerson, scaleObject }));
  } catch {
    /* private mode, storage full, preferences just don't persist */
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
    // 'auto' means keep following the OS. It only stops on an explicit choice.
    theme: ['light', 'dark'].includes(prefs.theme) ? prefs.theme : 'auto',
    // `sections` null means "follow the slider"; an array means the reader picked their own.
    level: Number.isInteger(prefs.level) && prefs.level >= 0 && prefs.level <= 4 ? prefs.level : DEFAULTS.level,
    sections: Array.isArray(prefs.sections) ? prefs.sections : null,
    icons: typeof prefs.icons === 'boolean' ? prefs.icons : DEFAULTS.icons,
    perPerson: typeof prefs.perPerson === 'boolean' ? prefs.perPerson : DEFAULTS.perPerson,
    scaleObject: typeof prefs.scaleObject === 'string' ? prefs.scaleObject : DEFAULTS.scaleObject,
  }, isStateHash() ? parseHash() : {});

  // Keep matching the OS while the reader has not picked a side.
  window.matchMedia?.('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (state.theme === 'auto') emit(['theme']);
  });

  window.addEventListener('hashchange', () => {
    if (applying) return;
    // In-page anchors ("Browse all materials", the wordmark) must not reset the filters.
    if (!isStateHash()) return;
    applying = true;
    const from = parseHash();
    const changed = [];
    const { calm, theme, level, sections, icons, perPerson, scaleObject, compare } = state;
    const keep = { calm, theme, level, sections, icons, perPerson, scaleObject, compare };
    for (const [k, v] of Object.entries({ ...DEFAULTS, ...from, ...keep })) {
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
