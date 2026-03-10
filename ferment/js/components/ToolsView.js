/**
 * FERMENT — ToolsView Component
 * Utility tools hub: brine calculator, batch scaler, timers, unit converter, pH reference, glossary, seasonal calendar
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

  data() {
    return {
      activeTab: null,
      // Unit Converter state
      converter: {
        mode: 'weight',
        fromValue: '',
        fromUnit: 'g',
        toUnit: 'oz',
      },
      // Glossary state
      glossarySearch: '',
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
        { id: 'glossary', label: 'Glossary', emoji: '📖', desc: 'Fermentation terms from cultures worldwide', accent: 'accent-aged' },
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

    // Glossary
    glossaryTerms() {
      return [
        { term: 'Kimjang', origin: 'Korea', def: 'The traditional communal process of making large quantities of kimchi, typically in late autumn, to last through winter. Recognized by UNESCO as cultural heritage.' },
        { term: 'Onggi', origin: 'Korea', def: 'Traditional breathable earthenware pots used for fermenting and storing food. The porous clay allows air circulation while keeping contents protected.' },
        { term: 'Tsukemono', origin: 'Japan', def: 'Japanese preserved vegetables, encompassing a wide range of pickling and fermenting techniques including salt, rice bran (nukazuke), and miso pickling.' },
        { term: 'Nukazuke', origin: 'Japan', def: 'A type of Japanese pickle made by fermenting vegetables in a rice bran (nuka) bed. The nuka bed is a living culture maintained for years or even generations.' },
        { term: 'Achaar', origin: 'South Asia', def: 'Pickled preparations common across South Asia, typically using oil, salt, and spices. Techniques and recipes vary widely by region and family tradition.' },
        { term: 'Tursu', origin: 'Turkey', def: 'Turkish pickled vegetables, commonly made with a salt-vinegar brine. Popular varieties include pickled peppers, cucumbers, and cabbage.' },
        { term: 'Curtido', origin: 'El Salvador', def: 'A lightly fermented cabbage relish, similar to sauerkraut but with Central American flavors including oregano and red pepper flakes.' },
        { term: 'Lacto-fermentation', origin: 'Global', def: 'Fermentation driven by lactic acid bacteria (Lactobacillus), which convert sugars to lactic acid. The foundation of most vegetable ferments.' },
        { term: 'Brine', origin: 'Global', def: 'A solution of salt and water used to submerge vegetables for fermentation. Concentration typically ranges from 2-10% by weight.' },
        { term: 'Pellicle', origin: 'Global', def: 'A thin film that can form on the surface of fermenting liquids. In kombucha, this is the SCOBY. In vegetable ferments, it may be kahm yeast (harmless but undesirable).' },
        { term: 'Kahm Yeast', origin: 'Global', def: 'A harmless white film of wild yeast that can form on ferments. Not dangerous but can affect flavor. Remove and ensure vegetables stay submerged.' },
        { term: 'SCOBY', origin: 'Global', def: 'Symbiotic Culture of Bacteria and Yeast. The cellulose mat used in kombucha brewing. Houses the microorganisms that drive fermentation.' },
        { term: 'Starter Culture', origin: 'Global', def: 'A preparation used to inoculate a new ferment with beneficial microorganisms. Can be brine from a previous batch, whey, or commercial cultures.' },
        { term: 'Gochugaru', origin: 'Korea', def: 'Korean red pepper flakes, essential for kimchi. Made from sun-dried red peppers, providing a smoky, slightly sweet heat distinct from other chili flakes.' },
        { term: 'Jeotgal', origin: 'Korea', def: 'Korean salted and fermented seafood. Commonly used as a flavor component in kimchi, particularly saeujeot (fermented shrimp) and myeolchi-jeot (fermented anchovies).' },
        { term: 'Doenjang', origin: 'Korea', def: 'Korean fermented soybean paste, similar to but distinct from Japanese miso. Made from meju (fermented soybean blocks) and brine.' },
        { term: 'Miso', origin: 'Japan', def: 'Japanese fermented soybean paste made with koji (Aspergillus oryzae). Varieties range from light and sweet (shiro) to dark and robust (hatcho).' },
        { term: 'Koji', origin: 'Japan', def: 'Aspergillus oryzae mold grown on grains (usually rice or barley). The foundation of many East Asian ferments including miso, soy sauce, sake, and mirin.' },
        { term: 'Shio Koji', origin: 'Japan', def: 'A versatile seasoning made by fermenting koji rice with salt and water. Used as a marinade, tenderizer, and umami booster.' },
        { term: 'Sauerkraut', origin: 'Germany', def: 'Finely shredded cabbage fermented by lactic acid bacteria. One of the simplest and most ancient fermented foods, requiring only cabbage and salt.' },
      ];
    },

    filteredGlossary() {
      if (!this.glossarySearch.trim()) return this.glossaryTerms;
      const q = this.glossarySearch.toLowerCase();
      return this.glossaryTerms.filter(t =>
        t.term.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q) ||
        t.def.toLowerCase().includes(q)
      );
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
            @click="activeTab = tab.id"
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
        <button @click="activeTab = null"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all mb-4">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          Back to Tools
        </button>

      <!-- Brine Calculator Tab -->
      <div v-show="activeTab === 'brine'">
        <brine-calculator></brine-calculator>
      </div>

      <!-- Batch Scaler Tab -->
      <div v-show="activeTab === 'scaler'">
        <batch-scaler :recipes="recipes"></batch-scaler>
      </div>

      <!-- Timers Tab -->
      <div v-show="activeTab === 'timers'">
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
                    {{ convertedValue || '—' }}
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
                  <span class="font-mono text-xs text-text-muted">{{ range.min }} — {{ range.max }}</span>
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

      <!-- Glossary Tab (now redirects to Wiki) -->
      <div v-show="activeTab === 'glossary'">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
          <div class="px-6 py-12 text-center">
            <span class="text-4xl mb-4 block">📖</span>
            <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2">Glossary Has Moved to the Wiki</h3>
            <p class="text-sm text-text-secondary dark:text-dark-text-secondary mb-6 max-w-md mx-auto">
              All fermentation terms — from Kimjang to Kahm Yeast — now live in richly detailed wiki articles with citations, images, and cross-links to recipes.
            </p>
            <button @click="$emit('open-wiki')"
              class="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-brine/10 hover:bg-accent-brine/20 text-accent-aged dark:text-accent-brine rounded-xl text-sm font-medium transition-colors border border-accent-brine/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              Open the Wiki
            </button>
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
      </div>
    </div>
  `
};
