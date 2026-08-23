/* BODY — app logic.
   Raw values live in data/*.js; everything judgmental (status, deltas,
   trends, region colors) is computed here so ingesting a new report
   stays a pure transcription job. */

(function () {
  const { createApp, ref, reactive, computed, watch } = Vue;

  const PREFS_KEY = 'body.prefs';
  const EDITS_KEY = 'body.edits';

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function savePrefs(patch) {
    const next = Object.assign(loadPrefs(), patch);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch (e) { }
  }

  /* ---------- manual-edits overlay ----------
     Shape: { patients: { amit: { vitals: {weightKg, heightCm},
                                  results: { markerId: { 'YYYY-MM-DD': value } } } } }
     Loaded from data/manual.js (machine-written file), then localStorage on
     top. The curated patient files are never touched by the UI. */

  function loadLocalEdits() {
    try { return JSON.parse(localStorage.getItem(EDITS_KEY) || 'null'); } catch (e) { return null; }
  }
  function persistLocalEdits(o) {
    try { localStorage.setItem(EDITS_KEY, JSON.stringify(o)); } catch (e) { }
  }
  function mergeEdits(base, extra) {
    const out = JSON.parse(JSON.stringify(base && base.patients ? base : { patients: {} }));
    if (extra && extra.patients) {
      Object.keys(extra.patients).forEach(function (pid) {
        const src = extra.patients[pid];
        const dst = out.patients[pid] = out.patients[pid] || {};
        if (src.vitals) dst.vitals = Object.assign({}, dst.vitals, src.vitals);
        if (src.insurance) dst.insurance = Object.assign({}, dst.insurance, src.insurance);
        if (src.activity) dst.activity = Object.assign({}, dst.activity, src.activity);
        if (src.results) {
          dst.results = dst.results || {};
          Object.keys(src.results).forEach(function (mid) {
            dst.results[mid] = Object.assign({}, dst.results[mid], src.results[mid]);
          });
        }
      });
    }
    return out;
  }

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDrawLabel(iso) {
    const p = iso.split('-');
    return parseInt(p[2], 10) + ' ' + (MONTHS[parseInt(p[1], 10) - 1] || p[1]) + ' ’' + p[0].slice(2) + ' ✎';
  }

  /* figures live in data/figures.js (window.BODY_FIGURES) */

  /* ---------- the clock ----------
     The scene no longer changes with the hour: two deliberate themes, and the
     time is simply told, not performed. */

  function clockParts(d) {
    const h = d.getHours(), m = d.getMinutes();
    return {
      time: (((h + 11) % 12) + 1) + ':' + String(m).padStart(2, '0'),
      suffix: h < 12 ? 'am' : 'pm',
      part: h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'
    };
  }

  /* ---------- status + trend math ---------- */

  const STATUS_RANK = { ok: 0, borderline: 1, out: 2 };
  const BORDERLINE_FRACTION = 0.1; // in-range but within 10% of the ref span of a bound

  function resolveRef(markerId, patient) {
    const def = BODY.markers[markerId] || {};
    const override = (patient.refOverrides || {})[markerId];
    if (override) return override;
    const ref = def.ref || {};
    const bySex = ref[patient.sex] || ref.all || null;
    if (!bySex) return { low: null, high: null, label: def.refDisplay || '' };
    return { low: bySex[0], high: bySex[1], label: def.refDisplay || null };
  }

  function statusFor(value, low, high) {
    if (typeof value !== 'number') return 'ok';
    if (low != null && value < low) return 'out';
    if (high != null && value > high) return 'out';
    const span = (high != null && low != null) ? (high - low)
      : (high != null ? high : (low != null ? low : 0));
    const margin = span * BORDERLINE_FRACTION;
    if (high != null && value > high - margin && value <= high) return 'borderline';
    if (low != null && low !== 0 && value < low + margin && value >= low) return 'borderline';
    return 'ok';
  }

  function fmtNum(n) {
    if (typeof n !== 'number') return String(n);
    return (Math.round(n * 100) / 100).toString();
  }

  /* ---------- sparkline component ---------- */

  const Spark = {
    props: { marker: { type: Object, required: true }, width: { type: Number, default: 100 }, height: { type: Number, default: 26 } },
    computed: {
      series() { return this.marker.series.filter(function (p) { return typeof p.value === 'number'; }); },
      geom() {
        const w = this.width, h = this.height, pad = 5;
        const s = this.series;
        const low = this.marker.refLow, high = this.marker.refHigh;
        let vals = s.map(function (p) { return p.value; });
        if (low != null) vals = vals.concat([low]);
        if (high != null) vals = vals.concat([high]);
        if (!vals.length) return null;
        let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
        if (min === max) { min -= 1; max += 1; }
        const range = max - min;
        min -= range * 0.12; max += range * 0.12;
        const y = function (v) { return h - pad - ((v - min) / (max - min)) * (h - pad * 2); };
        const n = s.length;
        const x = function (i) { return n === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (n - 1); };
        return {
          points: s.map(function (p, i) { return { x: x(i), y: y(p.value), status: p.status, label: p.label + ' · ' + fmtNum(p.value) }; }),
          bandY: high != null ? y(high) : 0,
          bandH: (function () {
            const top = high != null ? y(high) : 0;
            const bottom = low != null ? y(low) : h;
            return Math.max(0, bottom - top);
          })()
        };
      },
      polyPoints() {
        return this.geom ? this.geom.points.map(function (p) { return p.x + ',' + p.y; }).join(' ') : '';
      },
      ariaLabel() {
        const s = this.series;
        if (!s.length) return 'no numeric history';
        return this.marker.name + ': ' + s.map(function (p) { return fmtNum(p.value); }).join(', ') +
          (this.marker.refLabel ? '; reference ' + this.marker.refLabel : '');
      }
    },
    template:
      '<svg v-if="geom" class="spark" :width="width" :height="height" role="img" :aria-label="ariaLabel">' +
      '<rect class="refband" x="0" :y="geom.bandY" :width="width" :height="geom.bandH" rx="3"></rect>' +
      '<polyline v-if="geom.points.length > 1" :points="polyPoints"></polyline>' +
      '<circle v-for="(p, i) in geom.points" :key="i" class="pt" ' +
      ':class="[p.status, { hollow: p.status !== \'ok\' && i < geom.points.length - 1 }]" ' +
      ':cx="p.x" :cy="p.y" :r="i === geom.points.length - 1 ? 3.4 : 2.6">' +
      '<title>{{ p.label }}</title></circle>' +
      '</svg><span v-else class="spark"></span>'
  };

  /* ---------- store ----------
     One store shared by the root app and every card component, so cards can
     be moved between columns without prop plumbing. */

  function buildStore() {
      const prefs = loadPrefs();
      // URL overrides (?p=aparna&mode=expert) for testing and sharing views
      let q = { get: function () { return null; } };
      try { q = new URLSearchParams(location.search); } catch (e) { }
      /* Real records are gated. Without ?lovesey the app shows a demo body
         with invented (but coherent) numbers, so it can be opened, shown and
         explored without exposing anyone. Once unlocked it stays unlocked on
         this device; ?lovesey=off locks it again. */
      const lovesey = (function () {
        const v = q.get('lovesey');
        if (v === 'off' || v === '0') { savePrefs({ lovesey: false }); return false; }
        if (q.has('lovesey')) { savePrefs({ lovesey: true }); return true; }
        return !!prefs.lovesey;
      })();
      const patients = BODY.patients.filter(function (p) { return lovesey ? !p.demo : !!p.demo; });
      const wantPatient = q.get('p') || prefs.patient;
      const patientId = ref(patients.some(function (p) { return p.id === wantPatient; }) ? wantPatient : patients[0].id);
      const wantMode = q.get('mode') || prefs.mode;
      const mode = ref(wantMode === 'expert' ? 'expert' : 'human');
      const theme = ref(document.documentElement.dataset.theme || 'light');

      const activeRegion = ref(q.get('region') || null);
      const editMode = ref(q.get('edit') === '1');

      /* --- the clock --- */
      const now = ref(new Date());
      const themeMode = ref((q.get('theme') || prefs.theme) === 'dark' ? 'dark' : 'light');
      const clock = computed(function () { return clockParts(now.value); });
      // the range behind the garden follows the real hour; ?hour= previews one
      const simHour = ref(q.get('hour') != null ? parseFloat(q.get('hour')) : null);
      const hour = computed(function () {
        if (simHour.value != null) return simHour.value;
        const d = now.value;
        return d.getHours() + d.getMinutes() / 60;
      });
      function setSimHour(h) { simHour.value = h; }
      function goLive() { simHour.value = null; now.value = new Date(); }
      const clockLabel = computed(function () { return clock.value.time + ' ' + clock.value.suffix; });
      const dateLabel = computed(function () {
        const d = now.value;
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()] +
          ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()];
      });
      const greeting = computed(function () {
        const p = rawPatient.value;
        return 'Good ' + clock.value.part + (p.id === 'you' ? '' : ', ' + p.shortName);
      });

      function applyTheme(t) {
        const el = document.documentElement;
        el.classList.add('theme-anim');
        el.dataset.theme = t;
        el.style.colorScheme = t;
        theme.value = t;
        clearTimeout(applyTheme._t);
        applyTheme._t = setTimeout(function () { el.classList.remove('theme-anim'); }, 700);
      }
      function setThemeMode(m) {
        themeMode.value = (m === 'dark') ? 'dark' : 'light';
        savePrefs({ theme: themeMode.value });
        applyTheme(themeMode.value);
      }
      applyTheme(themeMode.value);

      setInterval(function () { now.value = new Date(); }, 30000);
      document.addEventListener('visibilitychange', function () {
        if (!document.hidden) now.value = new Date();
      });

      /* --- settings --- */
      const settingsOpen = ref(q.get('settings') === '1');
      const settingsTab = ref('sky');
      const settingsTabs = [
        { id: 'sky', label: 'Sky', icon: '☀' },
        { id: 'read', label: 'Reading', icon: '◫' },
        { id: 'people', label: 'People', icon: '◍' },
        { id: 'export', label: 'Export', icon: '⎙' },
        { id: 'about', label: 'About', icon: '❦' }
      ];
      const mods = reactive(Object.assign(
        { landscape: true, motion: true, tips: true },
        prefs.mods || {}));
      watch(mods, function () { savePrefs({ mods: JSON.parse(JSON.stringify(mods)) }); }, { deep: true });

      const textScale = ref(prefs.textScale || 100);
      function setTextScale(s) {
        textScale.value = s;
        savePrefs({ textScale: s });
        document.documentElement.style.setProperty('--text-scale', (s / 100).toFixed(2));
      }
      setTextScale(textScale.value);

      const insuranceFields = [
        { k: 'provider', label: 'Insurer', hint: 'e.g. Star Health' },
        { k: 'policyNo', label: 'Policy number', hint: '' },
        { k: 'type', label: 'Plan type', hint: 'Family floater / Individual' },
        { k: 'sumInsured', label: 'Sum insured', hint: '₹' },
        { k: 'validTill', label: 'Valid till', hint: 'Mar 2027' },
        { k: 'tpa', label: 'TPA', hint: '' },
        { k: 'helpline', label: 'Helpline', hint: '' },
        { k: 'note', label: 'Note', hint: 'anything worth remembering' }
      ];

      /* --- the vista: drawer + what you walked up to --- */
      const sheetState = ref(q.get('drawer') === '1' ? 'full' : 'closed');
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      const drawerOpen = computed({
        get: function () { return sheetState.value !== 'closed'; },
        set: function (v) { sheetState.value = v ? (coarse ? 'half' : 'full') : 'closed'; }
      });
      const drawerTab = ref(q.get('tab') || 'schedule');
      const openIssueId = ref(q.get('issue') || null);
      const exporting = ref(q.get('export') === '1');
      function startExport() {
        settingsOpen.value = false;
        sheetState.value = 'closed';
        exporting.value = true;
        document.body.classList.add('exporting');
      }
      function doPrint() { window.print(); }
      watch(exporting, function (v) { document.body.classList.toggle('exporting', v); });

      const drawerTabs = computed(function () {
        const expert = mode.value === 'expert';
        const t = expert
          ? [{ id: 'records', label: 'Records' },
             { id: 'schedule', label: 'Schedule' },
             { id: 'results', label: 'All results' }]
          : [{ id: 'schedule', label: 'This week' },
             { id: 'results', label: 'How things stand' },
             { id: 'records', label: 'Records' }];
        if (editMode.value) t.push({ id: 'log', label: 'Log & save' });
        return t;
      });
      // opening the drawer lands on the lens's first panel unless asked otherwise
      const drawerTabTouched = ref(!!q.get('tab'));
      watch(drawerTabs, function (tabs) {
        if (!drawerTabTouched.value && tabs.length) drawerTab.value = tabs[0].id;
      }, { immediate: true });
      function toggleDrawer() { drawerOpen.value = !drawerOpen.value; }
      function drawerTo(tab) { drawerTab.value = tab; drawerOpen.value = true; }
      function closeSheet() { sheetState.value = 'closed'; }
      function setSheet(s) { sheetState.value = s; }
      /* tapping the scene puts the sheet away — same as Esc, one layer at a time */
      function dismissLayers() {
        if (openIssueId.value) { openIssueId.value = null; return; }
        if (activeRegion.value) { activeRegion.value = null; return; }
        if (drawerOpen.value) closeSheet();
      }
      function openIssue(id) {
        openIssueId.value = (openIssueId.value === id) ? null : id;
        if (openIssueId.value) activeRegion.value = null;
      }

      const rawPatient = computed(function () {
        return patients.find(function (p) { return p.id === patientId.value; });
      });

      /* --- edits overlay state --- */
      const edits = ref(mergeEdits(window.BODY.manual, loadLocalEdits()));
      function editsFor(pid) { return (edits.value.patients || {})[pid] || {}; }
      function mutateEdits(fn) {
        const next = JSON.parse(JSON.stringify(edits.value));
        if (!next.patients) next.patients = {};
        if (!next.patients[patientId.value]) next.patients[patientId.value] = {};
        fn(next.patients[patientId.value]);
        edits.value = next;
        persistLocalEdits(next);
        saveStatus.value = { msg: '', ok: false };
      }

      /* draws = report draws + any manually-logged dates, chronological */
      const mergedDraws = computed(function () {
        const p = rawPatient.value;
        const pe = editsFor(p.id);
        const known = {};
        p.draws.forEach(function (d) { known[d.id] = true; });
        const extra = {};
        Object.keys(pe.results || {}).forEach(function (mid) {
          Object.keys(pe.results[mid]).forEach(function (d) { if (!known[d]) extra[d] = true; });
        });
        return p.draws
          .concat(Object.keys(extra).map(function (d) { return { id: d, label: fmtDrawLabel(d), manual: true }; }))
          .sort(function (a, b) { return a.id < b.id ? -1 : 1; });
      });

      /* --- marker rows: raw values (+ manual overlay) -> judged view-model --- */
      const rows = computed(function () {
        const p = rawPatient.value;
        const er = editsFor(p.id).results || {};
        const ids = Object.keys(p.results).concat(
          Object.keys(er).filter(function (id) { return !(id in p.results); }));
        return ids.map(function (id) {
          const def = BODY.markers[id] || { name: id, panel: 'other', regions: [] };
          const refR = resolveRef(id, p);
          const manual = er[id] || {};
          const values = Object.assign({}, p.results[id], manual);
          const series = mergedDraws.value
            .filter(function (d) { return values[d.id] != null; })
            .map(function (d) {
              return {
                draw: d.id, label: d.label, value: values[d.id],
                status: statusFor(values[d.id], refR.low, refR.high)
              };
            });
          const latest = series.length ? series[series.length - 1] : null;
          const prev = series.length > 1 ? series[series.length - 2] : null;
          const numericPair = latest && prev && typeof latest.value === 'number' && typeof prev.value === 'number';
          const delta = numericPair ? latest.value - prev.value : null;
          return {
            id: id,
            name: def.name,
            unit: def.unit || '',
            panel: def.panel,
            regions: def.regions || [],
            worse: def.worse || 'high',
            human: def.human || '',
            refLow: refR.low, refHigh: refR.high,
            refLabel: refR.label || (refR.low != null || refR.high != null
              ? (refR.low != null ? fmtNum(refR.low) : '0') + '–' + (refR.high != null ? fmtNum(refR.high) : '∞')
              : ''),
            values: values,
            manual: manual,
            series: series,
            status: latest ? latest.status : 'ok',
            latestValue: latest ? latest.value : null,
            latestDisplay: latest ? (fmtNum(latest.value) + (def.unit ? ' ' + def.unit : '')) : '—',
            delta: delta,
            deltaDir: delta == null ? null : (delta > 0 ? 'up' : 'down'),
            deltaDisplay: delta == null ? '' : fmtNum(Math.abs(delta)),
            deviation: (function () {
              if (!latest || typeof latest.value !== 'number') return 0;
              if (refR.high != null && latest.value > refR.high) {
                return refR.high === 0 ? latest.value : (latest.value - refR.high) / Math.abs(refR.high);
              }
              if (refR.low != null && latest.value < refR.low) {
                return refR.low === 0 ? 1 : (refR.low - latest.value) / Math.abs(refR.low);
              }
              return 0;
            })()
          };
        });
      });

      const flagged = computed(function () {
        return rows.value
          .filter(function (r) { return r.status !== 'ok'; })
          .sort(function (a, b) {
            return (STATUS_RANK[b.status] - STATUS_RANK[a.status]) || (b.deviation - a.deviation);
          });
      });

      const inRangeCount = computed(function () {
        return rows.value.filter(function (r) { return r.status === 'ok'; }).length;
      });

      /* --- regions --- */
      const visibleRegions = computed(function () {
        return BODY.regions
          .map(function (reg) {
            const members = rows.value.filter(function (r) { return r.regions.indexOf(reg.id) !== -1; });
            if (!members.length) return null;
            const worst = members.reduce(function (acc, r) {
              return STATUS_RANK[r.status] > STATUS_RANK[acc] ? r.status : acc;
            }, 'ok');
            return Object.assign({}, reg, { members: members, worstStatus: worst });
          })
          .filter(Boolean);
      });

      const activeRegionData = computed(function () {
        if (!activeRegion.value) return null;
        const reg = visibleRegions.value.find(function (r) { return r.id === activeRegion.value; });
        if (!reg) return null;
        const markers = reg.members.slice().sort(function (a, b) {
          return STATUS_RANK[b.status] - STATUS_RANK[a.status] || b.deviation - a.deviation;
        });
        return Object.assign({}, reg, {
          markers: markers,
          okMarkers: markers.filter(function (r) { return r.status === 'ok'; }),
          issues: rawPatient.value.issues.filter(function (i) { return i.regions.indexOf(reg.id) !== -1; })
        });
      });

      /* --- panel tables (expert full results) --- */
      const panelTables = computed(function () {
        return BODY.panels
          .map(function (panel) {
            const panelRows = rows.value
              .filter(function (r) { return r.panel === panel.id; })
              .sort(function (a, b) { return STATUS_RANK[b.status] - STATUS_RANK[a.status] || a.name.localeCompare(b.name); });
            return panelRows.length ? { id: panel.id, label: panel.label, rows: panelRows } : null;
          })
          .filter(Boolean);
      });

      /* --- patient view-model --- */
      const patient = computed(function () {
        const p = rawPatient.value;
        const draws = mergedDraws.value;
        const lastDraw = draws[draws.length - 1];
        const ev = editsFor(p.id).vitals || {};
        const weightKg = ev.weightKg != null ? ev.weightKg : p.vitals.weightKg;
        const heightCm = ev.heightCm != null ? ev.heightCm : p.vitals.heightCm;
        let bmi = p.vitals.bmi;
        if ((ev.weightKg != null || ev.heightCm != null) && heightCm > 0) {
          bmi = Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
        }
        return Object.assign({}, p, {
          draws: draws,
          sexLabel: p.sex === 'f' ? 'Female' : 'Male',
          lastTested: lastDraw.label,
          latestDrawId: lastDraw.id,
          weightKg: weightKg,
          heightCm: heightCm,
          bmi: bmi,
          recordsLabel: p.records.length + ' record' + (p.records.length === 1 ? '' : 's'),
          vitalsLabel: (ev.heightCm != null ? heightCm + ' cm' : p.vitals.heightLabel) +
            ' · ' + weightKg + ' kg · BMI ' + bmi,
          scoreDelta: p.prevHealthScore != null ? p.healthScore - p.prevHealthScore : null,
          overallSummary: p.summary,
          markerCount: rows.value.length,
          drawsNote: draws.map(function (d) { return d.label; }).join(' → ')
        });
      });

      const figure = computed(function () {
        const f = BODY_FIGURES.figures[rawPatient.value.sex] || BODY_FIGURES.figures.m;
        // each view has its own traced outline now — front and back really differ
        return Object.assign({}, f, { body: f.bodies[bodyView.value] || f.bodies.front });
      });
      const figureAspect = computed(function () {
        const vb = figure.value.viewBox.split(' ');
        return vb[2] + ' / ' + vb[3];
      });

      /* front/back plate views — kidneys and the spine live on the verso */
      const bodyView = ref('front');
      function setView(v) { bodyView.value = v; }
      // a region opened via ?region= may live on the other side — turn around
      if (activeRegion.value) {
        const initOrgan = (BODY_FIGURES.figures[rawPatient.value.sex] || {}).organs || {};
        const io = initOrgan[activeRegion.value];
        if (io && !io.front) bodyView.value = 'back';
      }

      function placementFor(regionId) {
        const o = figure.value.organs[regionId];
        return o ? o[bodyView.value] : null;
      }
      /* the anatomy plates on show, each carrying its region's status */
      const anatomyPlates = computed(function () {
        const plates = (BODY_FIGURES.anatomy || {})[bodyView.value] || [];
        const byRegion = {};
        visibleRegions.value.forEach(function (r) { byRegion[r.id] = r.worstStatus; });
        return plates.map(function (p) {
          return Object.assign({}, p, { status: byRegion[p.region] || 'ok' });
        });
      });

      /* which regions are already drawn by an anatomy plate on this view */
      const plateRegions = computed(function () {
        const out = {};
        anatomyPlates.value.forEach(function (p) { out[p.region] = true; });
        return out;
      });

      /* regions with an organ layer on the current view of the current figure */
      const placedRegions = computed(function () {
        return visibleRegions.value.filter(function (r) { return placementFor(r.id); });
      });
      function organTransform(r) {
        const o = placementFor(r.id);
        // glyphs are drawn in a 100x100 unit box centered on (50,50)
        return 'translate(' + (o.x - 50 * o.s) + ',' + (o.y - 50 * o.s) + ') scale(' + o.s + ')';
      }
      function iconFor(id) { return BODY_FIGURES.icons[id] || null; }
      function issueIcon(issue) { return iconFor((issue.regions || [])[0]); }

      function glyphFor(r) {
        const o = placementFor(r.id);
        return BODY_FIGURES.glyphs[o.glyph || r.id] || '';
      }
      /* a small organ icon for issue cards — visual anchor before words */
      function issueGlyph(issue) {
        const rid = (issue.regions || [])[0];
        if (!rid) return '';
        const org = figure.value.organs[rid];
        const pl = org && (org.front || org.back);
        const g = (pl && pl.glyph) || rid;
        return BODY_FIGURES.glyphs[g] || '';
      }

      /* --- the garden reads the numbers ---
         Nothing random: every count and opacity comes from the current
         patient's own data, so the scene means something. */
      const scene = computed(function () {
        const p = rawPatient.value;
        const all = rows.value;
        const ok = all.filter(function (r) { return r.status === 'ok'; }).length;
        const share = all.length ? ok / all.length : 1;
        const issues = p.issues || [];
        const improving = issues.filter(function (i) { return i.trend === 'improving'; }).length;
        const urgent = issues.filter(function (i) { return i.severity === 'priority'; }).length;

        // stones: one per issue, sized and placed by how much it weighs on you
        const SEV_W = { priority: 1, attention: 0.72, watch: 0.52 };
        const stones = issues.slice(0, 6).map(function (is, i) {
          const w = SEV_W[is.severity] || 0.5;
          return {
            id: is.id,
            x: [14, 84, 27, 72, 8, 92][i],
            y: [72, 66, 52, 47, 38, 35][i],
            s: w,
            moss: is.trend === 'improving' || is.trend === 'resolved'
          };
        });

        // raked rings ripple outward from each stone; more rings = calmer water
        const rings = Math.max(2, Math.round(share * 5));

        // petals drift when something is getting better
        const petals = [];
        for (let i = 0; i < Math.min(improving * 2, 7); i++) {
          petals.push({
            i: i,
            x: 8 + ((i * 27) % 84),
            delay: (i * 2.6).toFixed(1),
            dur: (16 + (i % 4) * 5).toFixed(0),
            drift: 6 + (i % 5) * 4
          });
        }

        // bamboo at the edges, taller when there is more to be calm about
        const stalks = [];
        for (let i = 0; i < 3 + urgent; i++) {
          stalks.push({ i: i, x: i % 2 ? 4 + i * 1.6 : 96 - i * 1.9, h: 46 + (i % 3) * 13, delay: (i * 1.3).toFixed(1) });
        }

        return { stones: stones, rings: rings, petals: petals, stalks: stalks, share: share, urgent: urgent };
      });

      /* --- the answer, in two seconds --- */
      const verdict = computed(function () {
        const p = rawPatient.value;
        const urgent = p.issues.filter(function (i) { return i.severity === 'priority'; });
        const watch = p.issues.filter(function (i) { return i.severity !== 'priority'; });
        const be = p.id === 'you' ? ' are' : ' is';   // "You are", "Amit is"
        const headline = urgent.length === 0
          ? p.shortName + be + ' doing well.'
          : (p.healthScore >= 85 ? p.shortName + be + ' doing well overall.'
            : p.shortName + be + ' mostly steady.');
        let sub;
        if (urgent.length === 1) {
          sub = 'One thing needs tending: ' + urgent[0].tag + '.';
        } else if (urgent.length > 1) {
          sub = urgent.length + ' things need tending, starting with ' + urgent[0].tag + '.';
        } else if (watch.length) {
          sub = 'Nothing urgent — ' + watch.length + ' things worth an eye.';
        } else {
          sub = 'Nothing needs attention right now.';
        }
        return { headline: headline, sub: sub };
      });

      /* --- issues standing in the field: nearer & larger = more urgent --- */
      const SLOTS = [
        { left: 15, bottom: 3, scale: 1.00 },
        { left: 82, bottom: 6, scale: 0.95 },
        { left: 27, bottom: 21, scale: 0.79 },
        { left: 71, bottom: 24, scale: 0.75 },
        { left: 10, bottom: 33, scale: 0.64 },
        { left: 88, bottom: 36, scale: 0.60 }
      ];
      // ranks start at 1: `|| 9` would swallow a 0 and sort the worst issue last
      const SEV_RANK = { priority: 1, attention: 2, watch: 3 };
      const cairns = computed(function () {
        return rawPatient.value.issues
          .slice()
          .sort(function (a, b) { return (SEV_RANK[a.severity] || 9) - (SEV_RANK[b.severity] || 9); })
          .slice(0, SLOTS.length)
          .map(function (issue, i) {
            const s = SLOTS[i];
            return {
              issue: issue,
              style: {
                left: s.left + '%',
                bottom: s.bottom + '%',
                '--near': s.scale,
                zIndex: String(20 - i)
              }
            };
          });
      });
      const openIssue_ = computed(function () {
        if (!openIssueId.value) return null;
        return rawPatient.value.issues.find(function (i) { return i.id === openIssueId.value; }) || null;
      });
      function issueMarkers(issue) {
        const ids = issue.markers || [];
        return rows.value
          .filter(function (r) { return ids.indexOf(r.id) !== -1; })
          .sort(function (a, b) { return STATUS_RANK[b.status] - STATUS_RANK[a.status]; });
      }
      /* expert markers show a number, not a mood: the issue's own headline
         marker if it names one, else whatever is furthest out of range */
      function cairnReadout(issue) {
        const ms = issueMarkers(issue);
        if (!ms.length) return '';
        const named = issue.headline && ms.find(function (r) { return r.id === issue.headline; });
        if (named) return named.latestDisplay;
        const worst = ms.slice().sort(function (a, b) { return b.deviation - a.deviation; })[0];
        return worst ? worst.latestDisplay : '';
      }
      function trendWord(t) {
        return { improving: 'getting better', worsening: 'needs care', stable: 'steady',
          new: 'new', resolved: 'sorted' }[t] || t;
      }

      const scoreDash = computed(function () {
        const c = 2 * Math.PI * 50;
        return (c * patient.value.healthScore / 100) + ' ' + c;
      });

      const patientAccentStyle = computed(function () {
        const p = rawPatient.value;
        return { '--patient-accent': p.accent, '--patient-accent-soft': p.accentSoft };
      });

      /* --- actions --- */
      function switchPatient(id) {
        if (id === patientId.value) return;
        patientId.value = id;
        activeRegion.value = null;
        openIssueId.value = null;
        bodyView.value = 'front';
        savePrefs({ patient: id });
      }
      function setMode(m) {
        mode.value = m;
        savePrefs({ mode: m });
      }
      function toggleTheme() { setThemeMode(themeMode.value === 'dark' ? 'light' : 'dark'); }
      function selectRegion(id) {
        activeRegion.value = activeRegion.value === id ? null : id;
        // if the region's layer lives on the other side of the body, turn around
        if (activeRegion.value) {
          const o = figure.value.organs[id];
          if (o && !o[bodyView.value]) {
            bodyView.value = o.front ? 'front' : 'back';
          }
        }
      }
      function toggleEdit() {
        editMode.value = !editMode.value;
        if (editMode.value) { drawerTab.value = 'log'; drawerOpen.value = true; }
        else if (drawerTab.value === 'log') { drawerTab.value = 'records'; }
      }

      /* --- edit-mode actions --- */
      const saveStatus = ref({ msg: '', ok: false });
      const logForm = reactive({ marker: '', date: new Date().toISOString().slice(0, 10), value: '' });

      /* insurance lives in the same local overlay as measurements: typed here,
         saved to this browser and to data/manual.js, never into the repo */
      const insurance = computed(function () {
        return Object.assign({}, rawPatient.value.insurance || {},
          (editsFor(patientId.value).insurance || {}));
      });
      function setInsurance(key, val) {
        mutateEdits(function (pe) {
          pe.insurance = pe.insurance || {};
          if (val) pe.insurance[key] = val; else delete pe.insurance[key];
        });
      }

      function setVital(key, val) {
        const n = parseFloat(val);
        if (!isFinite(n) || n <= 0) return;
        mutateEdits(function (pe) { pe.vitals = pe.vitals || {}; pe.vitals[key] = n; });
      }
      function addMeasurement() {
        const id = logForm.marker, d = logForm.date, v = parseFloat(logForm.value);
        if (!id || !d || !isFinite(v)) return;
        mutateEdits(function (pe) {
          pe.results = pe.results || {};
          pe.results[id] = pe.results[id] || {};
          pe.results[id][d] = v;
        });
        logForm.value = '';
      }
      function removeMeasurement(id, d) {
        mutateEdits(function (pe) {
          if (pe.results && pe.results[id]) {
            delete pe.results[id][d];
            if (!Object.keys(pe.results[id]).length) delete pe.results[id];
          }
        });
      }

      /* --- the week of movement ---
         Sessions live in the patient file; ticks live in the local overlay
         keyed by the actual date, so "done" means done on that day. */
      const DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      function isoOf(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
          '-' + String(d.getDate()).padStart(2, '0');
      }
      function prettyTime(t) {
        const p = t.split(':'), h = +p[0];
        return (((h + 11) % 12) + 1) + (p[1] === '00' ? '' : ':' + p[1]) + (h < 12 ? 'am' : 'pm');
      }
      const week = computed(function () {
        const p = rawPatient.value;
        const acts = editsFor(p.id).activity || {};
        const today = now.value;
        const monday = new Date(today);
        monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));  // week starts Monday
        const out = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const key = DAY_KEYS[d.getDay()];
          const iso = isoOf(d);
          const doneList = acts[iso] || [];
          out.push({
            key: key, iso: iso,
            today: iso === isoOf(today),
            past: d < today && iso !== isoOf(today),
            sessions: (p.routine || []).filter(function (s) { return s.day === key; })
              .map(function (s) {
                return Object.assign({}, s, {
                  pretty: prettyTime(s.time),
                  done: doneList.indexOf(s.id) !== -1
                });
              })
          });
        }
        return out;
      });
      function toggleSession(id, iso) {
        mutateEdits(function (pe) {
          pe.activity = pe.activity || {};
          const list = (pe.activity[iso] || []).slice();
          const i = list.indexOf(id);
          if (i === -1) list.push(id); else list.splice(i, 1);
          if (list.length) pe.activity[iso] = list; else delete pe.activity[iso];
        });
      }
      /* the one session standing between you and bedtime */
      const todaySession = computed(function () {
        const d = week.value.find(function (x) { return x.today; });
        return d && d.sessions.length ? Object.assign({ iso: d.iso }, d.sessions[0]) : null;
      });

      /* "how things stand", grouped the way a person thinks about their body */
      const systemSummary = computed(function () {
        return BODY.regions.map(function (reg) {
          const members = rows.value.filter(function (r) { return r.regions.indexOf(reg.id) !== -1; });
          if (!members.length) return null;
          const out = members.filter(function (r) { return r.status === 'out'; });
          const near = members.filter(function (r) { return r.status === 'borderline'; });
          const ok = members.length - out.length - near.length;
          const worst = out.length ? 'out' : near.length ? 'borderline' : 'ok';
          const note = out.length
            ? out.slice(0, 2).map(function (r) { return r.name; }).join(', ') +
              (out.length > 2 ? ' and ' + (out.length - 2) + ' more' : '')
            : near.length ? near.slice(0, 2).map(function (r) { return r.name; }).join(', ') + ' near the edge'
            : 'all clear';
          return {
            id: reg.id, label: reg.label, icon: iconFor(reg.id),
            total: members.length, ok: ok, out: out.length, near: near.length,
            pct: Math.round(ok / members.length * 100),
            worst: worst, note: note
          };
        }).filter(Boolean).sort(function (a, b) {
          return (b.out - a.out) || (b.near - a.near) || a.label.localeCompare(b.label);
        });
      });

      const filledInsurance = computed(function () {
        const ins = insurance.value;
        return insuranceFields
          .filter(function (f) { return !!ins[f.k]; })
          .map(function (f) { return { k: f.k, label: f.label, value: ins[f.k] }; });
      });
      const hasInsurance = computed(function () {
        const ins = insurance.value;
        return Object.keys(ins).some(function (k) { return !!ins[k]; });
      });

      /* --- tooltips: plain words for a coloured dot --- */
      const tip = ref(null);
      function showTip(row, ev) {
        if (!mods.tips || !row) return;
        const r = ev.currentTarget.getBoundingClientRect();
        const word = row.status === 'out'
          ? (row.worse === 'low' ? 'low' : 'high')
          : row.status === 'borderline' ? 'close to the edge' : 'in range';
        tip.value = {
          x: Math.round(r.left + r.width / 2),
          y: Math.round(r.top),
          name: row.name,
          word: word,
          value: row.latestDisplay,
          human: row.human || ''
        };
      }
      function hideTip() { tip.value = null; }

      const markerOptions = computed(function () {
        return Object.keys(BODY.markers)
          .map(function (id) { return { id: id, name: BODY.markers[id].name }; })
          .sort(function (a, b) { return a.name.localeCompare(b.name); });
      });
      const selfMarkers = computed(function () {
        return markerOptions.value.filter(function (m) { return BODY.markers[m.id].self; });
      });
      const labMarkers = computed(function () {
        return markerOptions.value.filter(function (m) { return !BODY.markers[m.id].self; });
      });
      const logHint = computed(function () {
        const d = BODY.markers[logForm.marker];
        if (!d) return '';
        const r = resolveRef(logForm.marker, rawPatient.value);
        const range = r.label || (r.low != null || r.high != null
          ? 'usual range ' + (r.low != null ? fmtNum(r.low) : '0') + '–' + (r.high != null ? fmtNum(r.high) : '∞') + (d.unit ? ' ' + d.unit : '')
          : '');
        return [d.human, range].filter(Boolean).join(' · ');
      });

      const manualEntries = computed(function () {
        const pe = editsFor(patientId.value);
        const out = [];
        Object.keys(pe.results || {}).forEach(function (mid) {
          Object.keys(pe.results[mid]).forEach(function (d) {
            out.push({
              markerId: mid, date: d, value: pe.results[mid][d],
              name: (BODY.markers[mid] || { name: mid }).name
            });
          });
        });
        return out.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
      });
      const hasEdits = computed(function () {
        const ps = edits.value.patients || {};
        return Object.keys(ps).some(function (pid) {
          const pe = ps[pid];
          return (pe.vitals && Object.keys(pe.vitals).length > 0) ||
            (pe.results && Object.keys(pe.results).length > 0);
        });
      });

      /* --- persistence to data/manual.js --- */
      const canSaveToFile = ('showSaveFilePicker' in window) && window.isSecureContext;
      let fileHandle = null;
      function manualFileContent() {
        return '/* Machine-written by body. edit mode — do not hand-edit.\n' +
          '   Curated content lives in data/amit.js and data/aparna.js. */\n' +
          'window.BODY.manual = ' + JSON.stringify(edits.value, null, 2) + ';\n';
      }
      async function saveToFile() {
        try {
          if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
              suggestedName: 'manual.js',
              types: [{ description: 'JavaScript data', accept: { 'text/javascript': ['.js'] } }]
            });
          }
          const w = await fileHandle.createWritable();
          await w.write(manualFileContent());
          await w.close();
          saveStatus.value = { msg: 'Saved to disk — the file now loads on every reload, in any browser.', ok: true };
        } catch (e) {
          if (e && e.name === 'AbortError') return;
          fileHandle = null;
          saveStatus.value = { msg: 'Save failed: ' + (e && e.message ? e.message : e), ok: false };
        }
      }
      function downloadManual() {
        const blob = new Blob([manualFileContent()], { type: 'text/javascript' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'manual.js';
        a.click();
        URL.revokeObjectURL(a.href);
        saveStatus.value = { msg: 'Downloaded — move it into data/ to make it permanent.', ok: true };
      }
      function clearEdits() {
        if (!confirm('Clear all locally-logged edits? (data/manual.js on disk is not touched)')) return;
        try { localStorage.removeItem(EDITS_KEY); } catch (e) { }
        edits.value = mergeEdits(window.BODY.manual, null);
      }
      const saveHint = canSaveToFile
        ? 'Logged values live in this browser. “Save to data/manual.js” writes them into the project (pick the file once).'
        : 'Logged values live in this browser. Download manual.js and drop it into data/ — direct save needs Chrome/Edge over localhost.';

      /* --- tiny display helpers --- */
      function statusColor(s) {
        return s === 'out' ? 'var(--concern)' : s === 'borderline' ? 'var(--borderline)' : 'var(--good)';
      }
      function statusWord(s) {
        return s === 'out' ? 'needs attention' : s === 'borderline' ? 'borderline' : 'all good';
      }
      function scoreColor(p) {
        return p.healthScore >= 85 ? 'var(--good)' : p.healthScore >= 70 ? 'var(--borderline)' : 'var(--concern)';
      }
      function trendLabel(t) {
        const human = { improving: '▲ on the mend', worsening: '▼ needs care', stable: '– steady', new: '● new', resolved: '✓ recovered' };
        const expert = { improving: '▲ improving', worsening: '▼ worsening', stable: '– stable', new: '● new finding', resolved: '✓ resolved' };
        return (mode.value === 'human' ? human : expert)[t] || t;
      }
      /* state that CSS needs, reflected onto <body> and :root */
      watch([mode, drawerOpen, sheetState, function () { return mods.motion; },
        function () { return rawPatient.value.id; }], function () {
          const b = document.body;
          b.classList.toggle('mode-expert', mode.value === 'expert');
          b.classList.toggle('drawer-open', drawerOpen.value);
          b.classList.toggle('motion-on', !!mods.motion);
          ['closed', 'half', 'full'].forEach(function (s) {
            b.classList.toggle('sheet-' + s, sheetState.value === s);
          });
          const st = document.documentElement.style;
          st.setProperty('--patient-accent', rawPatient.value.accent);
          st.setProperty('--patient-accent-soft', rawPatient.value.accentSoft);
        }, { immediate: true });

      /* the generated range: time of day for the light, body state for the
         depth, roughness and haze */
      watch([hour, function () { return scene.value.share; },
             function () { return rawPatient.value.id; },
             function () { return mods.motion; }], function () {
        if (!window.BODY_LANDSCAPE) return;
        const pid = rawPatient.value.id;
        let seed = 0;
        for (let i = 0; i < pid.length; i++) seed = (seed * 31 + pid.charCodeAt(i)) >>> 0;
        window.BODY_LANDSCAPE.update({
          hour: hour.value,
          health: scene.value.share,
          seed: seed,
          motion: !!mods.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        });
      }, { immediate: true });

      /* the tab, the phone status bar and the icon all follow what's on screen */
      watch([patient, theme], function () {
        document.title = 'body.';
        const p = patient.value;
        const accent = p.id === 'aparna' ? '%23c1922c' : p.id === 'you' ? '%232f8f74' : '%23cd5f22';
        const desc = document.querySelector('meta[name="description"]');
        if (desc) {
          desc.setAttribute('content', lovesey
            ? p.name + ' — health record: what needs tending, what is flourishing, and every report underneath.'
            : 'A health record shaped like a place you stand in. Showing a demo body with sample data.');
        }
        const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
        document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
          m.removeAttribute('media');
          if (bg) m.setAttribute('content', bg);
        });
        const icon = document.querySelector('link[rel="icon"]');
        if (icon) {
          icon.setAttribute('href',
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='9' fill='%23295c4a'/%3E%3Ccircle cx='16' cy='13' r='6' fill='" +
            accent + "'/%3E%3Cpath d='M2 26 L11 18 L18 24 L25 19 L32 25 L32 32 L2 32 Z' fill='%23f2e8c8'/%3E%3C/svg%3E");
        }
      }, { immediate: true });

      // Esc backs out one layer at a time: look-card, then drawer
      window.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (exporting.value) { exporting.value = false; return; }
        if (settingsOpen.value) { settingsOpen.value = false; return; }
        if (openIssueId.value) { openIssueId.value = null; return; }
        if (activeRegion.value) { activeRegion.value = null; return; }
        closeSheet();
      });

      return {
        patients: patients, patientId: patientId, patient: patient, mode: mode, theme: theme,
        activeRegion: activeRegion, activeRegionData: activeRegionData,
        rows: rows, flagged: flagged, inRangeCount: inRangeCount,
        visibleRegions: visibleRegions, panelTables: panelTables,
        figure: figure, figureAspect: figureAspect, placedRegions: placedRegions, organTransform: organTransform, glyphFor: glyphFor,
        iconFor: iconFor, issueIcon: issueIcon, anatomyPlates: anatomyPlates, plateRegions: plateRegions,
        bodyView: bodyView, setView: setView,
        scoreDash: scoreDash, patientAccentStyle: patientAccentStyle,
        switchPatient: switchPatient, setMode: setMode, toggleTheme: toggleTheme, selectRegion: selectRegion,
        statusColor: statusColor, statusWord: statusWord, scoreColor: scoreColor, trendLabel: trendLabel,
        editMode: editMode, toggleEdit: toggleEdit, setVital: setVital,
        logForm: logForm, addMeasurement: addMeasurement, removeMeasurement: removeMeasurement,
        markerOptions: markerOptions, manualEntries: manualEntries, hasEdits: hasEdits,
        canSaveToFile: canSaveToFile, saveToFile: saveToFile, downloadManual: downloadManual,
        clearEdits: clearEdits, saveStatus: saveStatus, saveHint: saveHint,
        issueGlyph: issueGlyph, verdict: verdict, cairns: cairns,
        openIssueId: openIssueId, openIssue: openIssue, openIssue_: openIssue_,
        issueMarkers: issueMarkers, cairnReadout: cairnReadout, trendWord: trendWord,
        drawerOpen: drawerOpen, drawerTab: drawerTab, drawerTabs: drawerTabs,
        toggleDrawer: toggleDrawer, drawerTo: drawerTo,
        sheetState: sheetState, closeSheet: closeSheet, setSheet: setSheet,
        dismissLayers: dismissLayers,
        now: now, themeMode: themeMode, clock: clock, greeting: greeting,
        hour: hour, simHour: simHour, setSimHour: setSimHour, goLive: goLive,
        clockLabel: clockLabel, dateLabel: dateLabel,
        scene: scene,
        setThemeMode: setThemeMode,
        lovesey: lovesey,
        settingsOpen: settingsOpen, settingsTab: settingsTab, settingsTabs: settingsTabs,
        mods: mods, textScale: textScale, setTextScale: setTextScale,
        insurance: insurance, insuranceFields: insuranceFields, setInsurance: setInsurance,
        exporting: exporting, startExport: startExport, doPrint: doPrint,
        week: week, toggleSession: toggleSession, todaySession: todaySession,
        hasInsurance: hasInsurance, filledInsurance: filledInsurance, systemSummary: systemSummary,
        selfMarkers: selfMarkers, labMarkers: labMarkers, logHint: logHint,
        tip: tip, showTip: showTip, hideTip: hideTip
      };
  }

  /* ---------- the sheet drag ----------
     Touch only, and deliberately outside Vue: during a drag we write
     transform straight to the element so the finger is never a frame behind.
     Vue only learns where it landed. */
  function wireSheet(store) {
    const el = document.querySelector('.drawer');
    const handle = document.querySelector('.drawer-handle');
    const body = document.querySelector('.drawer-body');
    if (!el || !handle) return;

    let startY = 0, startTop = 0, dragging = false, decided = false, samples = [];
    let pos = {}, maxY = 0;

    function currentTop() {
      const H = el.offsetHeight;
      const s = store.sheetState.value;
      return s === 'full' ? 0 : s === 'half' ? H - window.innerHeight * 0.52 : H - 62;
    }
    function measure() {
      const H = el.offsetHeight;
      pos = { full: 0, half: H - window.innerHeight * 0.52, closed: H - 62 };
      maxY = pos.closed;
    }

    function onStart(e) {
      const t = e.touches[0];
      measure();
      startY = t.clientY;
      startTop = currentTop();
      samples = [{ t: e.timeStamp, y: t.clientY }];
      dragging = false;
      // a drag that begins on scrolled content is a scroll, not a sheet move
      decided = body && body.contains(e.target) && store.sheetState.value === 'full' && body.scrollTop > 0;
    }

    function onMove(e) {
      if (decided) return;
      const t = e.touches[0];
      const dy = t.clientY - startY;
      if (!dragging) {
        if (Math.abs(dy) < 8) return;
        // pulling down inside scrolled-to-top content still drags the sheet
        if (body && body.contains(e.target) && store.sheetState.value === 'full' && dy < 0) {
          decided = true; return;
        }
        dragging = true;
        el.classList.add('dragging');
      }
      e.preventDefault();
      const y = Math.max(0, Math.min(maxY, startTop + dy));
      el.style.transform = 'translateY(' + y + 'px)';
      samples.push({ t: e.timeStamp, y: t.clientY });
      if (samples.length > 5) samples.shift();
    }

    function onEnd(e) {
      if (!dragging) { decided = false; return; }
      dragging = false;
      decided = false;
      el.classList.remove('dragging');

      const first = samples[0], last = samples[samples.length - 1];
      const dt = Math.max(1, last.t - first.t);
      const v = (last.y - first.y) / dt;                    // px per ms
      const y = Math.max(0, Math.min(maxY, startTop + (last.y - startY)));

      const order = ['full', 'half', 'closed'];             // increasing y
      let target;
      if (Math.abs(v) > 0.5) {
        target = v > 0
          ? (order.find(function (k) { return pos[k] > y + 1; }) || 'closed')
          : (order.slice().reverse().find(function (k) { return pos[k] < y - 1; }) || 'full');
      } else {
        target = order.reduce(function (a, b) {
          return Math.abs(pos[b] - y) < Math.abs(pos[a] - y) ? b : a;
        });
      }
      el.style.transform = '';
      store.setSheet(target);
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd, { passive: true });
    if (body) {
      body.addEventListener('touchstart', onStart, { passive: true });
      body.addEventListener('touchmove', onMove, { passive: false });
      body.addEventListener('touchend', onEnd, { passive: true });
    }
    window.addEventListener('resize', measure);
  }

  const store = buildStore();

  const app = createApp({ setup: function () { return store; } });
  app.component('spark', Spark);
  app.component('export-doc', { setup: function () { return store; }, template: window.BODY_EXPORT });
  app.component('settings-panel', { setup: function () { return store; }, template: window.BODY_SETTINGS });
  Object.keys(window.BODY_PANELS).forEach(function (id) {
    app.component('panel-' + id, {
      setup: function () { return store; },
      template: window.BODY_PANELS[id]
    });
  });

  app.mount('#app');
  wireSheet(store);
  (function mountRange() {
    const cv = document.querySelector('.range');
    if (cv && window.BODY_LANDSCAPE) window.BODY_LANDSCAPE.mount(cv);
  })();
})();
