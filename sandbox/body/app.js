/* BODY — app logic.
   Raw values live in data/*.js; everything judgmental (status, deltas,
   trends, region colors) is computed here so ingesting a new report
   stays a pure transcription job. */

(function () {
  const { createApp, ref, computed, watch } = Vue;

  const PREFS_KEY = 'body.prefs';

  function loadPrefs() {
    try { return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function savePrefs(patch) {
    const next = Object.assign(loadPrefs(), patch);
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)); } catch (e) { }
  }

  /* ---------- figures ----------
     Matte front-facing silhouettes, viewBox 220x460. Same skeleton,
     tailored proportions: broader shoulders (m) vs broader hips + waist (f). */

  const FIGURES = {
    m: {
      viewBox: '0 0 220 460',
      parts:
        '<ellipse cx="110" cy="40" rx="25" ry="28"/>' +
        '<rect x="99" y="58" width="22" height="24" rx="8"/>' +
        // torso: shoulders -> waist -> hips
        '<path d="M70,88 Q110,74 150,88 Q160,94 161,110 Q162,150 152,190 Q148,215 152,240 Q154,262 140,268 L80,268 Q66,262 68,240 Q72,215 68,190 Q58,150 59,110 Q60,94 70,88 Z"/>' +
        // arms
        '<path d="M62,92 Q50,98 48,118 L42,218 Q41,232 51,235 Q61,237 63,223 L70,128 Q72,104 62,92 Z"/>' +
        '<path d="M158,92 Q170,98 172,118 L178,218 Q179,232 169,235 Q159,237 157,223 L150,128 Q148,104 158,92 Z"/>' +
        // legs + feet
        '<rect x="80" y="252" width="27" height="185" rx="13"/>' +
        '<rect x="113" y="252" width="27" height="185" rx="13"/>' +
        '<ellipse cx="92" cy="441" rx="17" ry="8"/>' +
        '<ellipse cx="128" cy="441" rx="17" ry="8"/>',
      pos: {
        brain: { x: 110, y: 38 },
        thyroid: { x: 110, y: 74 },
        heart: { x: 122, y: 116 },
        blood: { x: 55, y: 170 },
        liver: { x: 92, y: 168 },
        pancreas: { x: 112, y: 198 },
        kidneys: { x: 132, y: 186 },
        hormones: { x: 110, y: 244 },
        bones: { x: 94, y: 310 }
      }
    },
    f: {
      viewBox: '0 0 220 460',
      parts:
        '<ellipse cx="110" cy="40" rx="23" ry="27"/>' +
        '<rect x="100" y="58" width="20" height="24" rx="8"/>' +
        // torso: narrower shoulders, pinched waist, wider hips
        '<path d="M78,88 Q110,76 142,88 Q151,94 152,110 Q152,145 142,172 Q136,200 149,228 Q160,256 142,266 L78,266 Q60,256 71,228 Q84,200 78,172 Q68,145 68,110 Q69,94 78,88 Z"/>' +
        // arms
        '<path d="M68,92 Q57,98 55,118 L48,216 Q47,230 56,233 Q65,235 67,221 L75,128 Q77,104 68,92 Z"/>' +
        '<path d="M152,92 Q163,98 165,118 L172,216 Q173,230 164,233 Q155,235 153,221 L145,128 Q143,104 152,92 Z"/>' +
        // legs + feet
        '<rect x="82" y="250" width="26" height="185" rx="13"/>' +
        '<rect x="112" y="250" width="26" height="185" rx="13"/>' +
        '<ellipse cx="93" cy="439" rx="16" ry="8"/>' +
        '<ellipse cx="127" cy="439" rx="16" ry="8"/>',
      pos: {
        brain: { x: 110, y: 38 },
        thyroid: { x: 110, y: 74 },
        heart: { x: 121, y: 114 },
        blood: { x: 61, y: 168 },
        liver: { x: 93, y: 164 },
        pancreas: { x: 112, y: 194 },
        kidneys: { x: 130, y: 182 },
        hormones: { x: 110, y: 240 },
        bones: { x: 95, y: 308 }
      }
    }
  };

  /* ---------- status + trend math ---------- */

  const STATUS_RANK = { ok: 0, borderline: 1, out: 2 };
  const BORDERLINE_FRACTION = 0.1; // in-range but within 10% of the ref span of a bound

  function resolveRef(markerId, patient) {
    const def = BODY.markers[markerId] || {};
    const override = (patient.refOverrides || {})[markerId];
    if (override) return override;
    const ref = def.ref || {};
    const bySex = ref[patient.sex] || ref.all || null;
    if (!bySex) return { low: null, high: null, label: def.refLabel || '' };
    return { low: bySex[0], high: bySex[1], label: bySex.label || null };
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

  /* ---------- app ---------- */

  createApp({
    components: { spark: Spark },
    setup() {
      const prefs = loadPrefs();
      // URL overrides (?p=aparna&mode=expert) for testing and sharing views
      let q = { get: function () { return null; } };
      try { q = new URLSearchParams(location.search); } catch (e) { }
      const patients = BODY.patients;
      const wantPatient = q.get('p') || prefs.patient;
      const patientId = ref(patients.some(function (p) { return p.id === wantPatient; }) ? wantPatient : patients[0].id);
      const wantMode = q.get('mode') || prefs.mode;
      const mode = ref(wantMode === 'expert' ? 'expert' : 'human');
      const theme = ref(document.documentElement.dataset.theme || 'light');
      const activeRegion = ref(q.get('region') || null);

      const rawPatient = computed(function () {
        return patients.find(function (p) { return p.id === patientId.value; });
      });

      /* --- marker rows: raw values -> judged view-model --- */
      const rows = computed(function () {
        const p = rawPatient.value;
        return Object.keys(p.results).map(function (id) {
          const def = BODY.markers[id] || { name: id, panel: 'other', regions: [] };
          const refR = resolveRef(id, p);
          const values = p.results[id];
          const series = p.draws
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
        const lastDraw = p.draws[p.draws.length - 1];
        return Object.assign({}, p, {
          sexLabel: p.sex === 'f' ? 'Female' : 'Male',
          lastTested: lastDraw.label,
          latestDrawId: lastDraw.id,
          recordsLabel: p.records.length + ' record' + (p.records.length === 1 ? '' : 's'),
          vitalsLabel: p.vitals.heightLabel + ' · ' + p.vitals.weightKg + ' kg · BMI ' + p.vitals.bmi,
          scoreDelta: p.prevHealthScore != null ? p.healthScore - p.prevHealthScore : null,
          overallSummary: p.summary,
          markerCount: rows.value.length,
          drawsNote: p.draws.map(function (d) { return d.label; }).join(' → ')
        });
      });

      const figure = computed(function () { return FIGURES[rawPatient.value.sex] || FIGURES.m; });

      const scoreDash = computed(function () {
        const c = 2 * Math.PI * 40;
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
        savePrefs({ patient: id });
      }
      function setMode(m) {
        mode.value = m;
        savePrefs({ mode: m });
      }
      function toggleTheme() {
        theme.value = theme.value === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = theme.value;
        document.documentElement.style.colorScheme = theme.value;
        savePrefs({ theme: theme.value });
      }
      function selectRegion(id) {
        activeRegion.value = activeRegion.value === id ? null : id;
      }

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
        return { improving: '▲ improving', worsening: '▼ worsening', stable: '– stable', new: '● new finding', resolved: '✓ resolved' }[t] || t;
      }
      function pos(r) {
        return figure.value.pos[r.id] || { x: 110, y: 230 };
      }

      // Esc anywhere closes the region panel
      window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') activeRegion.value = null;
      });

      return {
        patients: patients, patientId: patientId, patient: patient, mode: mode, theme: theme,
        activeRegion: activeRegion, activeRegionData: activeRegionData,
        rows: rows, flagged: flagged, inRangeCount: inRangeCount,
        visibleRegions: visibleRegions, panelTables: panelTables,
        figure: figure, scoreDash: scoreDash, patientAccentStyle: patientAccentStyle,
        switchPatient: switchPatient, setMode: setMode, toggleTheme: toggleTheme, selectRegion: selectRegion,
        statusColor: statusColor, statusWord: statusWord, scoreColor: scoreColor, trendLabel: trendLabel, pos: pos
      };
    }
  }).mount('#app');
})();
