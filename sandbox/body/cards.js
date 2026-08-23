/* body. — drawer panels.
   The vista is the home; everything archival lives in the pull-up drawer.
   Each entry here becomes a <panel-*> component sharing the single store. */

/* the settings panel is a dialog, not a drawer panel — its own template */
window.BODY_SETTINGS = `
<div class="panel" role="dialog" aria-label="Settings" @click.stop>
  <header class="panel-head">
    <div class="panel-title">
      <span class="dot"></span><span>body.</span>
      <span class="dim">{{ clockLabel }}</span>
    </div>
    <button class="icon-btn" @click="settingsOpen = false" aria-label="Close settings">✕</button>
  </header>

  <div class="panel-body">
    <nav class="panel-nav" aria-label="Settings sections">
      <button v-for="t in settingsTabs" :key="t.id"
        :class="{ active: settingsTab === t.id }" :aria-pressed="settingsTab === t.id"
        @click="settingsTab = t.id"><span class="ico">{{ t.icon }}</span><span>{{ t.label }}</span></button>
    </nav>

    <div class="panel-content">

      <!-- ── GARDEN ── -->
      <div v-if="settingsTab === 'sky'" class="pane">
        <h2>Light</h2>
        <div class="seg">
          <button :class="{ active: themeMode === 'light' }" @click="setThemeMode('light')">Daylight
            <small>pale sand, dark stones</small></button>
          <button :class="{ active: themeMode === 'dark' }" @click="setThemeMode('dark')">Lamplight
            <small>the same garden after dark</small></button>
        </div>

        <h2 class="sub-h">Time of day</h2>
        <p class="small dim">
          The range behind the garden follows the clock — dawn, noon, dusk, night.
          The reading theme above stays where you put it.
        </p>
        <div class="presets">
          <button v-for="p in [['Dawn',6.6],['Morning',9.5],['Noon',13],['Golden',17.3],['Dusk',19.2],['Night',22]]"
            :key="p[0]" :class="{ active: simHour === p[1] }" @click="setSimHour(p[1])">{{ p[0] }}</button>
          <button :class="{ active: simHour === null }" @click="goLive">● Live</button>
        </div>

        <h2 class="sub-h">The garden</h2>
        <p class="small dim">
          A stone for everything that needs tending — bigger and nearer when it matters more,
          capped with moss once it starts mending. The range recedes further and the haze
          thins as more of your numbers come back into range.
        </p>
        <div class="toggles">
          <label class="toggle check"><input type="checkbox" v-model="mods.landscape" />
            <span>Falling petals</span><small>one pair for each thing on the mend</small></label>
          <label class="toggle check"><input type="checkbox" v-model="mods.motion" />
            <span>Motion</span><small>the range drifts, the water breathes</small></label>
        </div>
      </div>

      <!-- ── READING ── -->
      <div v-if="settingsTab === 'read'" class="pane">
        <h2>How much detail</h2>
        <div class="seg">
          <button :class="{ active: mode === 'human' }" @click="setMode('human')">Human
            <small>plain words, one line each</small></button>
          <button :class="{ active: mode === 'expert' }" @click="setMode('expert')">Expert
            <small>values, ranges, analysis</small></button>
        </div>

        <h2 class="sub-h">Text size</h2>
        <div class="presets">
          <button v-for="s in [100, 115, 130]" :key="s"
            :class="{ active: textScale === s }" @click="setTextScale(s)">{{ s }}%</button>
        </div>

        <h2 class="sub-h">Helpers</h2>
        <div class="toggles">
          <label class="toggle check"><input type="checkbox" v-model="mods.tips" />
            <span>Explain on hover</span><small>plain-language tooltips on dots and markers</small></label>
        </div>
      </div>

      <!-- ── PEOPLE ── -->
      <div v-if="settingsTab === 'people'" class="pane">
        <h2>Who this shows</h2>
        <p class="small" v-if="!lovesey">
          Showing a <strong>demo body</strong> with invented numbers. Real records stay private
          until unlocked with the private link.
        </p>
        <p class="small" v-else>
          Showing <strong>real records</strong> for {{ patients.map(p => p.shortName).join(' and ') }}
          on this device. Add <code>?lovesey=off</code> to hide them again.
        </p>

        <h2 class="sub-h">Health insurance</h2>
        <p class="small dim">Stored only in this browser and in your local <code>data/manual.js</code> — never committed.</p>
        <div class="ins-grid">
          <label v-for="f in insuranceFields" :key="f.k">
            <span>{{ f.label }}</span>
            <input type="text" :value="insurance[f.k] || ''" :placeholder="f.hint"
              @change="setInsurance(f.k, $event.target.value)" />
          </label>
        </div>
      </div>

      <!-- ── EXPORT ── -->
      <div v-if="settingsTab === 'export'" class="pane">
        <h2>Take it with you</h2>
        <p class="small">
          Builds a clean printable summary — the verdict, what needs tending, the schedule,
          the regimen, and every measured value — with a legend that decodes the scene for
          anyone reading it cold.
        </p>
        <div class="btn-row">
          <button class="btn" @click="startExport">Open printable report</button>
        </div>
        <p class="small dim">Then use your browser's Print dialog to save it as a PDF.</p>
      </div>

      <!-- ── ABOUT ── -->
      <div v-if="settingsTab === 'about'" class="pane">
        <h2>body.</h2>
        <p class="small">A shared health record shaped like a place you stand in, rather than a dashboard.</p>
        <p class="small dim" style="margin-top:10px">
          Not medical advice. Every flag is a conversation starter for a doctor, not a conclusion.
        </p>
        <h2 class="sub-h">Credits</h2>
        <p class="small dim">
          Body silhouettes adapted from Wikimedia Commons' <em>Human body diagrams</em>
          (Mikael Häggström) — CC0 / public domain. Organ glyphs, scene and code original.
        </p>
      </div>

    </div>
  </div>

  <footer class="panel-foot">ESC closes · click outside to dismiss</footer>
</div>`;

window.BODY_PANELS = {

  records: `
  <div class="panel-p">
    <div class="panel-grid">
      <article v-for="rec in patient.records" :key="rec.file" class="paper">
        <div class="paper-icon" aria-hidden="true">▤</div>
        <div class="paper-meta">
          <h3>{{ rec.title }}</h3>
          <p class="sub">{{ rec.lab }} · {{ rec.date }} · {{ rec.pages }} pages</p>
          <p v-if="rec.covers" class="sub">Covers {{ rec.covers }}</p>
          <div class="paper-actions">
            <a :href="rec.file" target="_blank" rel="noopener">Open</a>
            <a :href="rec.file" :download="rec.downloadName">Download</a>
          </div>
        </div>
      </article>

      <article class="paper add">
        <div class="paper-icon" aria-hidden="true">+</div>
        <div class="paper-meta">
          <h3>Add a record</h3>
          <p class="sub">Drop the PDF into <code>reports/</code> and ask Claude to ingest it. See README.</p>
        </div>
      </article>
    </div>

    <h3 class="panel-h" style="margin-top:28px">Health insurance</h3>
    <div v-if="hasInsurance" class="ins-card">
      <div v-for="f in insuranceFields" :key="f.k">
        <template v-if="insurance[f.k]">
          <span class="ins-k">{{ f.label }}</span>
          <span class="ins-v">{{ insurance[f.k] }}</span>
        </template>
      </div>
    </div>
    <p v-else class="small dim">
      Nothing saved yet — add your policy in
      <button class="linky" @click="settingsOpen = true; settingsTab = 'people'">Settings › People</button>.
      It stays on this device.
    </p>
  </div>`,

  schedule: `
  <div class="panel-p">
    <h3 class="panel-h">Weekly movement</h3>
    <div class="week">
      <div v-for="d in week" :key="d.key" class="day" :class="{ today: d.today }">
        <span class="dname">{{ d.key }}</span>
        <div v-if="d.sessions.length" class="dslots">
          <button v-for="s in d.sessions" :key="s.id" class="slot"
            :class="{ done: s.done, past: d.past }"
            @click="toggleSession(s.id, d.iso)"
            :aria-pressed="s.done"
            :title="s.done ? 'Done — tap to undo' : 'Tap when done'">
            <span class="stime">{{ s.pretty }}</span>
            <span class="slabel">{{ s.label }}</span>
            <span class="stick">{{ s.done ? '✓' : '○' }}</span>
          </button>
        </div>
        <div v-else class="drest">rest</div>
      </div>
    </div>

    <div class="panel-cols" style="margin-top:26px">
      <section>
        <h3 class="panel-h">{{ mode === 'human' ? 'Coming up' : 'Retest cadence' }}</h3>
        <div v-for="rt in patient.retests" :key="rt.label" class="line">
          <span class="what">{{ rt.label }}</span>
          <span class="when" :class="{ overdue: rt.overdue }">
            <template v-if="mode === 'expert'">every {{ rt.every }} · </template>{{ rt.due }}
          </span>
        </div>
      </section>

      <section>
        <h3 class="panel-h">{{ mode === 'human' ? 'Taking daily' : 'Regimen' }}</h3>
        <div v-if="mode === 'human'" class="chips">
          <span v-for="rg in patient.regimen" :key="rg.name" class="chip">{{ rg.name }}</span>
        </div>
        <div v-else>
          <div v-for="rg in patient.regimen" :key="rg.name" class="line stack">
            <span class="what">{{ rg.name }}</span>
            <span class="when">{{ rg.dose }}<template v-if="rg.note"> · {{ rg.note }}</template></span>
          </div>
        </div>
      </section>
    </div>
  </div>`,

  results: `
  <div class="panel-p">
    <section class="flourish">
      <h3 class="panel-h">Flourishing <span class="since">since {{ patient.winsSince }}</span></h3>
      <p>{{ mode === 'human' ? patient.winsShort : patient.wins }}</p>
    </section>

    <template v-if="mode === 'expert'">
      <h3 class="panel-h">Flagged · {{ flagged.length }} of {{ patient.markerCount }}</h3>
      <div class="table-wrap">
        <table class="results">
          <thead><tr><th>Marker</th><th>Latest · ref</th><th>Δ prev</th><th>Trend</th></tr></thead>
          <tbody>
            <tr v-for="row in flagged" :key="row.id" :class="row.status">
              <td class="marker-name"><span class="status-dot" :class="row.status"></span>{{ row.name }}</td>
              <td class="num"><span class="latest">{{ row.latestDisplay }}</span><span class="ref under">{{ row.refLabel }}</span></td>
              <td>
                <span v-if="row.delta !== null" class="delta" :class="[row.deltaDir, { inverted: row.worse === 'low' }]">
                  {{ row.delta > 0 ? '▲' : '▼' }} {{ row.deltaDisplay }}
                </span>
                <span v-else class="delta neutral">first</span>
              </td>
              <td><spark :marker="row" :width="80" :height="24"></spark></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="draws-note">Every parameter, by panel. Columns are draws: {{ patient.drawsNote }}.</p>
      <div v-for="p in panelTables" :key="p.id" class="panel-section">
        <h3 class="panel-h">{{ p.label }}</h3>
        <div class="table-wrap">
          <table class="results">
            <thead>
              <tr>
                <th class="sticky-col">Marker</th>
                <th v-for="d in patient.draws" :key="d.id">{{ d.label }}</th>
                <th>Ref</th><th>Δ prev</th><th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in p.rows" :key="row.id" :class="row.status">
                <td class="marker-name sticky-col"><span class="status-dot" :class="row.status"></span>{{ row.name }}</td>
                <td v-for="d in patient.draws" :key="d.id" class="num"
                  :class="{ latest: d.id === patient.latestDrawId && row.values[d.id] != null }">
                  <span :class="{ 'manual-val': row.manual[d.id] }"
                    :title="row.manual[d.id] ? 'logged manually' : null">{{ row.values[d.id] != null ? row.values[d.id] : '—' }}</span>
                </td>
                <td class="ref">{{ row.refLabel }}<span v-if="row.unit"> {{ row.unit }}</span></td>
                <td>
                  <span v-if="row.delta !== null" class="delta" :class="[row.deltaDir, { inverted: row.worse === 'low' }]">
                    {{ row.delta > 0 ? '▲' : '▼' }} {{ row.deltaDisplay }}
                  </span>
                  <span v-else class="delta neutral">—</span>
                </td>
                <td><spark :marker="row" :width="80" :height="24"></spark></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template v-else>
      <h3 class="panel-h">How things stand</h3>
      <p class="plain">
        Of {{ patient.markerCount }} things measured, <strong>{{ inRangeCount }}</strong> are where
        they should be. Here is the same thing, part of the body by part of the body.
      </p>

      <div class="sys-list">
        <article v-for="s in systemSummary" :key="s.id" class="sys" :class="s.worst"
          @mouseenter="null">
          <img v-if="s.icon" class="sys-icon" :src="s.icon" alt="" />
          <span v-else class="sys-dot" :class="s.worst"></span>
          <div class="sys-main">
            <div class="sys-head">
              <h4>{{ s.label }}</h4>
              <span class="sys-count">{{ s.ok }} of {{ s.total }} in range</span>
            </div>
            <div class="sys-bar"><span :style="{ width: s.pct + '%' }"></span></div>
            <p class="sys-note">
              <template v-if="s.out">Needs a look: {{ s.note }}.</template>
              <template v-else-if="s.near">{{ s.note }}.</template>
              <template v-else>Everything here is in range.</template>
            </p>
          </div>
        </article>
      </div>

      <p class="small dim" style="margin-top:18px">
        Want the actual numbers, ranges and trends?
        <button class="linky" @click="setMode('expert')">Switch to Expert</button>.
      </p>
    </template>
  </div>`,

  log: `
  <div class="panel-p">
    <div class="panel-cols">
      <section>
        <h3 class="panel-h">Body measurements</h3>
        <div class="line stack">
          <span class="what">Weight</span>
          <span class="when">
            <input class="vital-input" type="number" step="0.1" :value="patient.weightKg"
              @change="setVital('weightKg', $event.target.value)" aria-label="Weight in kg" /> kg
          </span>
        </div>
        <div class="line stack">
          <span class="what">Height</span>
          <span class="when">
            <input class="vital-input" type="number" step="0.1" :value="patient.heightCm"
              @change="setVital('heightCm', $event.target.value)" aria-label="Height in cm" /> cm
          </span>
        </div>
        <div class="line stack"><span class="what">BMI</span><span class="when">{{ patient.bmi }}</span></div>
      </section>

      <section>
        <h3 class="panel-h">Log a measurement</h3>
        <form class="log-form" @submit.prevent="addMeasurement">
          <label for="log-marker">Marker</label>
          <select id="log-marker" v-model="logForm.marker" required>
            <option value="" disabled>Pick a marker…</option>
            <option v-for="m in markerOptions" :key="m.id" :value="m.id">{{ m.name }}</option>
          </select>
          <div class="row2">
            <div>
              <label for="log-date">Date</label>
              <input id="log-date" type="date" v-model="logForm.date" required />
            </div>
            <div>
              <label for="log-value">Value</label>
              <input id="log-value" type="number" step="any" v-model="logForm.value" required />
            </div>
          </div>
          <button class="btn" type="submit">Log it</button>
        </form>

        <div v-if="manualEntries.length" class="manual-list">
          <div v-for="e in manualEntries" :key="e.markerId + e.date" class="line">
            <span class="what">{{ e.name }} · {{ e.value }}</span>
            <span class="when">{{ e.date }}
              <button class="x-inline" @click="removeMeasurement(e.markerId, e.date)"
                :aria-label="'Remove ' + e.name">✕</button>
            </span>
          </div>
        </div>
      </section>
    </div>

    <div class="btn-row">
      <button v-if="canSaveToFile" class="btn secondary" @click="saveToFile">Save to data/manual.js</button>
      <button class="btn secondary" @click="downloadManual">Download manual.js</button>
      <button v-if="hasEdits" class="btn danger" @click="clearEdits">Clear edits</button>
    </div>
    <p class="save-note" :class="{ ok: saveStatus.ok }">{{ saveStatus.msg || saveHint }}</p>
  </div>`
};


/* the printable report — its own always-light document, deliberately not
   sharing the app's tokens (the sky engine mutates those live) */
window.BODY_EXPORT = `
<section class="printout" role="document">
  <div class="printout-bar no-print">
    <span>Printable summary</span>
    <div class="pb-actions">
      <button class="btn" @click="doPrint">Print / Save PDF</button>
      <button class="btn secondary" @click="exporting = false">Close</button>
    </div>
  </div>

  <article class="sheet-a4">
    <header class="p-cover">
      <div class="p-brand">body<span>.</span></div>
      <h1>{{ patient.name }}</h1>
      <p class="p-sub">{{ patient.sexLabel }}, {{ patient.age }} · {{ patient.vitalsLabel }} ·
        last tested {{ patient.lastTested }}</p>

      <div class="p-verdict">
        <svg class="p-score" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="46" fill="none" stroke="#e4dcc4" stroke-width="9" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="#2c7a58" stroke-width="9"
            stroke-linecap="round" :stroke-dasharray="scoreDash" transform="rotate(-90 60 60)" />
          <text x="60" y="60" text-anchor="middle" dominant-baseline="central"
            font-size="34" font-weight="700" fill="#1c1a15">{{ patient.healthScore }}</text>
        </svg>
        <div>
          <h2>{{ verdict.headline }}</h2>
          <p>{{ verdict.sub }}</p>
        </div>
      </div>
    </header>

    <section class="p-block">
      <h3>Needs tending</h3>
      <div v-for="i in patient.issues" :key="i.id" class="p-issue" :class="'sev-' + i.severity">
        <img v-if="issueIcon(i)" class="p-glyph img" :src="issueIcon(i)" alt="" />
        <svg v-else class="p-glyph" viewBox="0 0 100 100" aria-hidden="true" v-html="issueGlyph(i)"></svg>
        <div>
          <h4>{{ i.human.title }} <em>{{ trendLabel(i.trend) }}</em></h4>
          <p>{{ i.human.short }}</p>
          <p class="p-actions" v-if="i.human.actions && i.human.actions.length">
            <span v-for="a in i.human.actions" :key="a">{{ a }}</span>
          </p>
          <p v-if="mode === 'expert'" class="p-clin">{{ i.expert.pattern }}</p>
        </div>
      </div>
    </section>

    <section class="p-block p-good">
      <h3>Flourishing</h3>
      <p>{{ patient.wins }}</p>
    </section>

    <section class="p-block">
      <h3>Weekly movement</h3>
      <table class="p-table">
        <tbody>
          <tr v-for="r in patient.routine" :key="r.id">
            <td class="p-day">{{ r.day }}</td>
            <td>{{ r.label }}</td>
            <td class="p-right">{{ r.time }}<template v-if="r.mins"> · {{ r.mins }} min</template></td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top:16px">Next check-ups</h3>
      <table class="p-table">
        <tbody>
          <tr v-for="rt in patient.retests" :key="rt.label">
            <td>{{ rt.label }}</td>
            <td class="p-right">every {{ rt.every }} · due {{ rt.due }}</td>
          </tr>
        </tbody>
      </table>

      <h3 style="margin-top:16px">Taking daily</h3>
      <table class="p-table">
        <tbody>
          <tr v-for="rg in patient.regimen" :key="rg.name">
            <td>{{ rg.name }}</td>
            <td class="p-right">{{ rg.dose }}</td>
          </tr>
        </tbody>
      </table>

      <template v-if="hasInsurance">
        <h3 style="margin-top:16px">Insurance</h3>
        <table class="p-table">
          <tbody>
            <tr v-for="f in filledInsurance" :key="f.k">
              <td>{{ f.label }}</td><td class="p-right">{{ f.value }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </section>

    <section class="p-block p-legend">
      <h3>How to read this</h3>
      <div class="p-legend-grid">
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="30" cy="30" r="16" fill="#f7d98a" />
            <circle cx="30" cy="30" r="22" fill="none" stroke="#e4dcc4" stroke-width="4" />
            <circle cx="30" cy="30" r="22" fill="none" stroke="#2c7a58" stroke-width="4"
              stroke-dasharray="105 138" transform="rotate(-90 30 30)" stroke-linecap="round" />
          </svg>
          <p><strong>The sun is the score.</strong> In the app the health score hangs in the sky; the ring around it fills as the score rises.</p>
        </div>
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <rect x="4" y="30" width="18" height="18" rx="4" fill="#b5501d" />
            <rect x="27" y="36" width="13" height="13" rx="3" fill="#a87710" opacity=".75" />
            <rect x="45" y="41" width="9" height="9" rx="2" fill="#6b6353" opacity=".5" />
          </svg>
          <p><strong>Distance means urgency.</strong> Things needing attention stand close and large; things merely worth an eye stand small and far away.</p>
        </div>
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <circle cx="14" cy="30" r="8" fill="#2c7a58" />
            <circle cx="34" cy="30" r="8" fill="#a87710" />
            <circle cx="52" cy="30" r="8" fill="#b5501d" />
          </svg>
          <p><strong>Colours.</strong> Green is in range, amber is close to the edge, orange needs attention. There is no red — nothing here is an emergency.</p>
        </div>
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <rect x="6" y="24" width="48" height="14" rx="3" fill="#e7f0e5" />
            <polyline points="8,34 22,30 38,26 52,18" fill="none" stroke="#6b6353" stroke-width="2" />
            <circle cx="8" cy="34" r="2.6" fill="#2c7a58" /><circle cx="22" cy="30" r="2.6" fill="#2c7a58" />
            <circle cx="38" cy="26" r="2.6" fill="#a87710" /><circle cx="52" cy="18" r="3.4" fill="#b5501d" />
          </svg>
          <p><strong>Trend lines.</strong> The pale band is the healthy range; each dot is one test, the last one largest. Rising out of the band means moving away from normal.</p>
        </div>
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <text x="30" y="42" text-anchor="middle" font-size="34" fill="#6b6353">✎</text>
          </svg>
          <p><strong>The pencil mark</strong> means a value was entered by hand at home, not taken from a lab report.</p>
        </div>
        <div>
          <svg viewBox="0 0 60 60" aria-hidden="true">
            <ellipse cx="30" cy="30" rx="15" ry="19" fill="#cfd8c8" />
            <ellipse cx="30" cy="26" rx="7" ry="8" fill="#b5501d" />
          </svg>
          <p><strong>The body.</strong> Each organ lights up with the worst result belonging to it, so you can see at a glance where to look.</p>
        </div>
      </div>
    </section>

    <section class="p-block">
      <h3>Everything measured <em>{{ flagged.length }} of {{ patient.markerCount }} outside range</em></h3>
      <div v-for="p in panelTables" :key="p.id" class="p-panel">
        <h4>{{ p.label }}</h4>
        <table class="p-table p-results">
          <thead>
            <tr>
              <th>Marker</th>
              <th v-for="d in patient.draws" :key="d.id">{{ d.label }}</th>
              <th>Usual range</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in p.rows" :key="row.id" :class="row.status">
              <td>{{ row.name }}</td>
              <td v-for="d in patient.draws" :key="d.id" class="p-num">
                {{ row.values[d.id] != null ? row.values[d.id] : '—' }}<span v-if="row.manual[d.id]"> ✎</span>
              </td>
              <td class="p-ref">{{ row.refLabel }}<template v-if="row.unit"> {{ row.unit }}</template></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <footer class="p-foot">
      <p><strong>Not medical advice.</strong> This summary is a personal record to discuss with a doctor.
        Values are transcribed exactly as reported; flags are computed from the reference ranges printed alongside.</p>
      <p>{{ patient.name }} · generated {{ dateLabel }}, {{ clockLabel }} · body.</p>
    </footer>
  </article>
</section>`;
