/**
 * FERMENT - ToolsView Component
 * Utility tools hub: brine calculator, batch scaler, timers, unit converter, pH reference, seasonal calendar
 */

// ============================================================
// ToolsView Component
// ============================================================
const ToolsViewComponent = {
  name: 'tools-view',

  props: {
    settings: {
      type: Object,
      default: () => ({})
    },
    recipes: {
      type: Array,
      default: () => []
    }
  },

  emits: ['open-wiki'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Tool error in', info, err);
    this.toolError = (err && err.message) || 'An error occurred in this tool.';
    return false; // prevent propagation
  },

  data() {
    return {
      activeTab: null,
      toolError: null,
      // Unit Converter state
      converter: {
        mode: 'weight',
        fromValue: '',
        fromUnit: 'g',
        toUnit: 'oz',
      },
      // Calendar state
      calendarMonth: new Date().getMonth(),
    };
  },

  computed: {
    tabs() {
      return [
        { id: 'brine', label: 'Brine Calculator', emoji: '🧂', desc: 'Calculate salt and brine ratios for any ferment', accent: 'accent-brine' },
        { id: 'scaler', label: 'Batch Scaler', emoji: '⚖️', desc: 'Scale recipes up or down with precision', accent: 'accent-aged' },
        { id: 'timers', label: 'Timers', emoji: '⏱️', desc: 'Track and manage your active ferments', accent: 'accent-culture' },
        { id: 'converter', label: 'Unit Converter', emoji: '🔄', desc: 'Convert between weight, volume, and temperature', accent: 'accent-ferment' },
        { id: 'ph', label: 'pH Reference', emoji: '🧪', desc: 'Target pH ranges for safe fermentation', accent: 'accent-culture' },
        { id: 'calendar', label: 'Seasonal Calendar', emoji: '📅', desc: 'What to ferment and when throughout the year', accent: 'accent-culture' },
      ];
    },

    // Unit Converter
    converterModes() {
      return [
        { id: 'weight', label: 'Weight', units: ['g', 'kg', 'oz', 'lb'] },
        { id: 'volume', label: 'Volume', units: ['ml', 'l', 'fl oz', 'cup', 'tbsp', 'tsp'] },
        { id: 'temperature', label: 'Temperature', units: ['°C', '°F'] },
      ];
    },

    currentConverterUnits() {
      const mode = this.converterModes.find(m => m.id === this.converter.mode);
      return mode ? mode.units : [];
    },

    convertedValue() {
      const val = parseFloat(this.converter.fromValue);
      if (isNaN(val)) return '';
      const result = FermentFormat.convertUnit(val, this.converter.fromUnit, this.converter.toUnit);
      return result < 0.01 ? result.toFixed(4) : result < 1 ? result.toFixed(2) : result < 100 ? result.toFixed(1) : Math.round(result);
    },

    // pH Reference
    phScale() {
      return [
        { ph: 1, label: 'Battery acid', color: '#FF0000' },
        { ph: 2, label: 'Lemon juice', color: '#FF3300' },
        { ph: 3, label: 'Vinegar', color: '#FF6600' },
        { ph: 4, label: 'Sauerkraut', color: '#FFAA00' },
        { ph: 5, label: 'Coffee', color: '#CCCC00' },
        { ph: 6, label: 'Milk', color: '#99CC00' },
        { ph: 7, label: 'Pure water', color: '#66CC33' },
        { ph: 8, label: 'Sea water', color: '#33CC66' },
        { ph: 9, label: 'Baking soda', color: '#00CC99' },
        { ph: 10, label: 'Milk of magnesia', color: '#0099CC' },
        { ph: 11, label: 'Ammonia', color: '#0066CC' },
        { ph: 12, label: 'Soapy water', color: '#3333CC' },
        { ph: 13, label: 'Bleach', color: '#6600CC' },
        { ph: 14, label: 'Drain cleaner', color: '#9900CC' },
      ];
    },

    fermentPHRanges() {
      // Colors match the pH scale rainbow at the midpoint of each range
      return [
        { name: 'Kombucha', min: 2.5, max: 3.5, color: null },
        { name: 'Sauerkraut', min: 3.0, max: 3.5, color: null },
        { name: 'Pickles (brine)', min: 3.0, max: 3.5, color: null },
        { name: 'Hot Sauce', min: 3.0, max: 3.8, color: null },
        { name: 'Kimchi', min: 3.5, max: 4.2, color: null },
        { name: 'Yogurt', min: 4.0, max: 4.6, color: null },
        { name: 'Miso', min: 4.5, max: 5.0, color: null },
      ];
    },

    // Seasonal Calendar
    monthNames() {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    },

    seasonalGuide() {
      return [
        { months: [0, 1, 2], label: 'Winter', items: ['Sauerkraut', 'Preserved lemons', 'Root vegetable kimchi', 'Miso', 'Hot sauce'], emoji: '❄️' },
        { months: [3, 4, 5], label: 'Spring', items: ['Ramp kimchi', 'Pickled radishes', 'Green garlic ferment', 'Flower pickles', 'Herb pastes'], emoji: '🌱' },
        { months: [6, 7, 8], label: 'Summer', items: ['Cucumber pickles', 'Fermented hot sauce', 'Salsa', 'Berry shrubs', 'Corn relish'], emoji: '☀️' },
        { months: [9, 10, 11], label: 'Autumn', items: ['Kimjang kimchi', 'Apple cider vinegar', 'Fermented cranberry', 'Pumpkin/squash ferments', 'Chutney'], emoji: '🍂' },
      ];
    },

    currentSeason() {
      const m = this.calendarMonth;
      return this.seasonalGuide.find(s => s.months.includes(m));
    },
  },

  methods: {
    switchTool(id) {
      this.toolError = null;
      this.activeTab = id;
    },
    switchConverterMode(mode) {
      this.converter.mode = mode;
      const units = this.converterModes.find(m => m.id === mode).units;
      this.converter.fromUnit = units[0];
      this.converter.toUnit = units[1];
      this.converter.fromValue = '';
    },

    swapUnits() {
      const temp = this.converter.fromUnit;
      this.converter.fromUnit = this.converter.toUnit;
      this.converter.toUnit = temp;
    },

    phBarStyle(range) {
      const totalRange = 14;
      const left = ((range.min - 0) / totalRange) * 100;
      const width = ((range.max - range.min) / totalRange) * 100;
      // Derive color from pH scale at the midpoint
      const midPH = (range.min + range.max) / 2;
      const phIndex = Math.max(0, Math.min(13, Math.round(midPH) - 1));
      const phColor = this.phScale[phIndex] ? this.phScale[phIndex].color : '#FFAA00';
      return { left: left + '%', width: Math.max(width, 2) + '%', backgroundColor: phColor };
    },
  },

  template: `
    <div class="space-y-6">

      <!-- ===== MENU GRID (no tool selected) ===== -->
      <div v-if="activeTab === null">
        <div class="mb-6">
          <h2 class="font-serif text-3xl text-text-primary dark:text-dark-text">Tools</h2>
          <p class="text-text-muted dark:text-dark-text-secondary mt-1">Calculators, references, and utilities for every ferment</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button v-for="tab in tabs" :key="tab.id"
            @click="switchTool(tab.id)"
            class="tool-menu-card group text-left p-5 rounded-2xl border border-bg-secondary dark:border-dark-secondary bg-bg-card dark:bg-dark-card hover:border-accent-brine/40 transition-all duration-300">
            <div class="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{{ tab.emoji }}</div>
            <h3 class="font-serif text-lg text-text-primary dark:text-dark-text mb-1 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">{{ tab.label }}</h3>
            <p class="text-sm text-text-muted dark:text-dark-text-secondary leading-relaxed">{{ tab.desc }}</p>
            <div class="mt-3 flex items-center gap-1 text-xs text-text-muted group-hover:text-accent-brine transition-colors">
              <span>Open</span>
              <svg class="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ===== TOOL PAGE (tool selected) ===== -->
      <div v-else>
        <!-- Back to Tools Menu -->
        <button @click="activeTab = null; toolError = null"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Tools
        </button>

      <!-- Tool Error Display -->
      <div v-if="toolError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4 mb-4">
        <p class="text-sm text-accent-ferment font-medium">This tool encountered an error and has been isolated.</p>
        <p class="text-xs text-text-muted mt-1">{{ toolError }}</p>
        <button @click="toolError = null; activeTab = null" class="mt-2 text-xs text-accent-ferment underline">Back to tools</button>
      </div>
      <template v-else>

      <!-- Brine Calculator Tab -->
      <div v-if="activeTab === 'brine'">
        <brine-calculator></brine-calculator>
      </div>

      <!-- Batch Scaler Tab -->
      <div v-if="activeTab === 'scaler'">
        <batch-scaler :recipes="recipes"></batch-scaler>
      </div>

      <!-- Timers Tab -->
      <div v-if="activeTab === 'timers'">
        <timer-manager></timer-manager>
      </div>

      <!-- Unit Converter Tab -->
      <div v-show="activeTab === 'converter'">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
          <div class="bg-accent-ferment/10 dark:bg-accent-ferment/5 px-6 py-4 border-b border-accent-ferment/20">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🔄</span>
              <div>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Unit Converter</h3>
                <p class="text-sm text-text-muted dark:text-dark-text-secondary">Convert between common fermentation units</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <!-- Mode Tabs -->
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button v-for="mode in converterModes" :key="mode.id"
                @click="switchConverterMode(mode.id)"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  converter.mode === mode.id ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-ferment' : 'text-text-secondary dark:text-dark-text-secondary'
                ]"
              >{{ mode.label }}</button>
            </div>

            <!-- Converter Input -->
            <div class="flex items-center gap-4">
              <div class="flex-1">
                <label class="block text-xs text-text-muted mb-1">From</label>
                <div class="flex gap-2">
                  <input type="number" v-model="converter.fromValue" step="any"
                    class="flex-1 px-4 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:outline-none font-mono text-lg"
                    placeholder="0"
                  />
                  <select v-model="converter.fromUnit"
                    class="px-3 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:outline-none font-mono"
                  >
                    <option v-for="u in currentConverterUnits" :key="u" :value="u">{{ u }}</option>
                  </select>
                </div>
              </div>

              <button @click="swapUnits" class="p-2 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all mt-5">
                <svg class="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
              </button>

              <div class="flex-1">
                <label class="block text-xs text-text-muted mb-1">To</label>
                <div class="flex gap-2">
                  <div class="flex-1 px-4 py-3 rounded-xl bg-accent-ferment/10 dark:bg-accent-ferment/5 font-mono text-lg text-accent-ferment min-h-[52px] flex items-center">
                    {{ convertedValue || '-' }}
                  </div>
                  <select v-model="converter.toUnit"
                    class="px-3 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-ferment focus:outline-none font-mono"
                  >
                    <option v-for="u in currentConverterUnits" :key="u" :value="u">{{ u }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- pH Reference Tab -->
      <div v-show="activeTab === 'ph'">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
          <div class="bg-accent-culture/10 dark:bg-accent-culture/5 px-6 py-4 border-b border-accent-culture/20">
            <div class="flex items-center gap-3">
              <span class="text-2xl">🧪</span>
              <div>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">pH Reference Scale</h3>
                <p class="text-sm text-text-muted dark:text-dark-text-secondary">Target pH ranges for different ferments</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <!-- Visual pH Scale -->
            <div>
              <div class="flex rounded-xl overflow-hidden h-10">
                <div v-for="item in phScale" :key="item.ph"
                  class="flex-1 flex items-end justify-center pb-1 relative group cursor-default"
                  :style="{ backgroundColor: item.color }"
                >
                  <span class="text-xs font-mono font-medium text-white drop-shadow-sm">{{ item.ph }}</span>
                  <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-text-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    {{ item.label }}
                  </div>
                </div>
              </div>
              <div class="flex justify-between text-xs text-text-muted mt-10">
                <span>Acidic</span>
                <span>Neutral</span>
                <span>Alkaline</span>
              </div>
            </div>

            <!-- Ferment Target Ranges -->
            <div class="space-y-3">
              <h4 class="font-serif text-base text-text-primary dark:text-dark-text">Target pH Ranges</h4>
              <div v-for="range in fermentPHRanges" :key="range.name" class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-text-primary dark:text-dark-text">{{ range.name }}</span>
                  <span class="font-mono text-xs text-text-muted">{{ range.min }} - {{ range.max }}</span>
                </div>
                <div class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-3 relative">
                  <div class="h-3 rounded-full absolute transition-all"
                    :style="phBarStyle(range)"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Safety Note -->
            <div class="bg-accent-ferment/5 border border-accent-ferment/20 rounded-xl p-4">
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary">
                <strong class="text-accent-ferment">Safety note:</strong> A pH below 4.6 is generally considered safe for long-term storage, as it inhibits the growth of harmful bacteria including Clostridium botulinum.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Seasonal Calendar Tab -->
      <div v-show="activeTab === 'calendar'">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
          <div class="bg-accent-culture/10 dark:bg-accent-culture/5 px-6 py-4 border-b border-accent-culture/20">
            <div class="flex items-center gap-3">
              <span class="text-2xl">📅</span>
              <div>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Seasonal Calendar</h3>
                <p class="text-sm text-text-muted dark:text-dark-text-secondary">What to ferment and when (Northern Hemisphere)</p>
              </div>
            </div>
          </div>

          <div class="p-6 space-y-6">
            <!-- Month Grid -->
            <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
              <button v-for="(name, i) in monthNames" :key="i"
                @click="calendarMonth = i"
                :class="[
                  'px-2 py-3 rounded-xl text-sm font-medium transition-all text-center',
                  calendarMonth === i
                    ? 'bg-accent-culture text-white shadow-warm'
                    : i === new Date().getMonth()
                      ? 'bg-accent-culture/10 text-accent-culture border border-accent-culture/30'
                      : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary hover:bg-accent-culture/10'
                ]"
              >{{ name }}</button>
            </div>

            <!-- Current Season Info -->
            <div v-if="currentSeason" class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-2xl p-5">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">{{ currentSeason.emoji }}</span>
                <h4 class="font-serif text-lg text-text-primary dark:text-dark-text">{{ currentSeason.label }} Ferments</h4>
              </div>
              <ul class="space-y-2">
                <li v-for="item in currentSeason.items" :key="item" class="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-text-secondary">
                  <span class="w-1.5 h-1.5 rounded-full bg-accent-culture flex-shrink-0"></span>
                  {{ item }}
                </li>
              </ul>
            </div>

            <!-- All Seasons Overview -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-for="season in seasonalGuide" :key="season.label"
                :class="[
                  'rounded-xl border p-4 transition-all',
                  season.months.includes(calendarMonth) ? 'border-accent-culture/50 bg-accent-culture/5' : 'border-bg-secondary dark:border-dark-secondary'
                ]"
              >
                <div class="flex items-center gap-2 mb-2">
                  <span>{{ season.emoji }}</span>
                  <span class="font-medium text-sm text-text-primary dark:text-dark-text">{{ season.label }}</span>
                  <span class="text-xs text-text-muted">({{ season.months.map(m => monthNames[m]).join(', ') }})</span>
                </div>
                <div class="flex flex-wrap gap-1">
                  <span v-for="item in season.items" :key="item"
                    class="text-xs bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary px-2 py-0.5 rounded-full"
                  >{{ item }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </template>
      </div>
    </div>
  `
};
