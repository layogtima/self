/**
 * FERMENT — ToolsView, SettingsModal, OnboardingModal Components
 * Utility tools hub, app settings, and first-run onboarding
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

  data() {
    return {
      activeTab: 'brine',
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
        { id: 'brine', label: 'Brine Calculator', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { id: 'scaler', label: 'Batch Scaler', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3' },
        { id: 'timers', label: 'Timers', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'converter', label: 'Unit Converter', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
        { id: 'ph', label: 'pH Reference', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
        { id: 'glossary', label: 'Glossary', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
        { id: 'calendar', label: 'Seasonal Calendar', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
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
      <div>
        <h2 class="font-serif text-3xl text-text-primary dark:text-dark-text">Tools</h2>
        <p class="text-text-muted dark:text-dark-text-secondary mt-1">Calculators, references, and utilities</p>
      </div>

      <!-- Tab Navigation -->
      <div class="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        <button v-for="tab in tabs" :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5',
            activeTab === tab.id
              ? 'bg-accent-brine text-white shadow-warm'
              : 'text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary'
          ]"
        >
          <span>{{ tab.emoji }}</span>
          <span class="hidden sm:inline">{{ tab.label }}</span>
        </button>
      </div>

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

      <!-- Glossary Tab -->
      <div v-show="activeTab === 'glossary'">
        <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
          <div class="bg-accent-aged/10 dark:bg-accent-aged/5 px-6 py-4 border-b border-accent-aged/20">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-2xl">📖</span>
                <div>
                  <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Cultural Glossary</h3>
                  <p class="text-sm text-text-muted dark:text-dark-text-secondary">Fermentation terms from around the world</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Search -->
          <div class="px-5 py-3 border-b border-bg-secondary dark:border-dark-secondary">
            <div class="relative">
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input v-model="glossarySearch" type="text" placeholder="Search terms..."
                class="w-full pl-10 pr-4 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-aged focus:outline-none transition-all text-sm"
              />
            </div>
          </div>

          <!-- Terms List -->
          <div class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary max-h-[60vh] overflow-y-auto">
            <div v-for="item in filteredGlossary" :key="item.term" class="px-6 py-4">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="font-serif text-base text-text-primary dark:text-dark-text">{{ item.term }}</h4>
                <span class="text-xs font-medium text-text-muted bg-bg-secondary dark:bg-dark-secondary rounded-full px-2 py-0.5">{{ item.origin }}</span>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">{{ item.def }}</p>
            </div>
            <div v-if="filteredGlossary.length === 0" class="px-6 py-8 text-center">
              <p class="text-text-muted">No matching terms found.</p>
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
    </div>
  `
};

// ============================================================
// SettingsModal Component
// ============================================================
const SettingsModalComponent = {
  name: 'settings-modal',

  props: {
    settings: {
      type: Object,
      default: () => ({})
    },
    userLevel: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['close', 'update:settings', 'export-data', 'import-data', 'clear-data'],

  data() {
    return {
      localSettings: { ...this.settings },
      showClearConfirm: false,
      storageSize: 0,
    };
  },

  computed: {
    countries() {
      return [
        { code: '', label: 'Not set' },
        { code: 'US', label: 'United States' },
        { code: 'CA', label: 'Canada' },
        { code: 'GB', label: 'United Kingdom' },
        { code: 'DE', label: 'Germany' },
        { code: 'FR', label: 'France' },
        { code: 'IT', label: 'Italy' },
        { code: 'ES', label: 'Spain' },
        { code: 'PT', label: 'Portugal' },
        { code: 'NL', label: 'Netherlands' },
        { code: 'SE', label: 'Sweden' },
        { code: 'NO', label: 'Norway' },
        { code: 'DK', label: 'Denmark' },
        { code: 'PL', label: 'Poland' },
        { code: 'RO', label: 'Romania' },
        { code: 'HU', label: 'Hungary' },
        { code: 'CZ', label: 'Czech Republic' },
        { code: 'TR', label: 'Turkey' },
        { code: 'RU', label: 'Russia' },
        { code: 'KR', label: 'South Korea' },
        { code: 'JP', label: 'Japan' },
        { code: 'CN', label: 'China' },
        { code: 'IN', label: 'India' },
        { code: 'TH', label: 'Thailand' },
        { code: 'VN', label: 'Vietnam' },
        { code: 'ID', label: 'Indonesia' },
        { code: 'PH', label: 'Philippines' },
        { code: 'AU', label: 'Australia' },
        { code: 'NZ', label: 'New Zealand' },
        { code: 'BR', label: 'Brazil' },
        { code: 'MX', label: 'Mexico' },
        { code: 'AR', label: 'Argentina' },
        { code: 'CO', label: 'Colombia' },
        { code: 'ZA', label: 'South Africa' },
        { code: 'NG', label: 'Nigeria' },
        { code: 'KE', label: 'Kenya' },
        { code: 'ET', label: 'Ethiopia' },
        { code: 'EG', label: 'Egypt' },
        { code: 'IL', label: 'Israel' },
        { code: 'SA', label: 'Saudi Arabia' },
        { code: 'AE', label: 'UAE' },
      ].sort((a, b) => a.label.localeCompare(b.label));
    },

    storageSizeDisplay() {
      const bytes = this.storageSize;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    storagePercent() {
      const maxBytes = 5 * 1024 * 1024; // 5MB localStorage limit
      return Math.min(100, Math.round((this.storageSize / maxBytes) * 100));
    },
  },

  watch: {
    localSettings: {
      handler(newVal) {
        this.$emit('update:settings', { ...newVal });
      },
      deep: true
    }
  },

  methods: {
    triggerImport() {
      this.$refs.importInput.click();
    },

    onImportFile(e) {
      const file = e.target.files[0];
      if (file) {
        this.$emit('import-data', file);
      }
    },

    confirmClear() {
      this.showClearConfirm = true;
    },

    executeClear() {
      this.$emit('clear-data');
      this.showClearConfirm = false;
    },

    handleBackdropClick(e) {
      if (e.target === e.currentTarget) {
        this.$emit('close');
      }
    },
  },

  mounted() {
    this.storageSize = FermentStore.getStorageSize();
    document.body.style.overflow = 'hidden';
  },

  beforeUnmount() {
    document.body.style.overflow = '';
  },

  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click="handleBackdropClick">
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-xl w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-bg-secondary dark:border-dark-secondary">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-brine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h2 class="font-serif text-xl text-text-primary dark:text-dark-text">Settings</h2>
          </div>
          <button @click="$emit('close')" class="p-2 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all" aria-label="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-5 space-y-6">
          <!-- Region -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Region</label>
            <select v-model="localSettings.region"
              class="w-full px-3 py-2.5 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-brine focus:outline-none transition-all"
            >
              <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
            </select>
          </div>

          <!-- Units -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Units</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button @click="localSettings.units = 'metric'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.units === 'metric' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Metric</button>
              <button @click="localSettings.units = 'imperial'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.units === 'imperial' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Imperial</button>
            </div>
          </div>

          <!-- Theme -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Theme</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button v-for="t in ['light', 'dark', 'auto']" :key="t"
                @click="localSettings.theme = t"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize', localSettings.theme === t ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >{{ t }}</button>
            </div>
          </div>

          <!-- Expert Mode -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-text-primary dark:text-dark-text">Expert Mode</span>
              <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5">Show advanced details and options</p>
            </div>
            <button @click="localSettings.expertMode = !localSettings.expertMode"
              :class="['w-11 h-6 rounded-full transition-all relative', localSettings.expertMode ? 'bg-accent-brine' : 'bg-text-muted/30']"
            >
              <div :class="['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', localSettings.expertMode ? 'left-6' : 'left-1']"></div>
            </button>
          </div>

          <!-- Default View -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Default View</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button @click="localSettings.defaultView = 'cards'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.defaultView === 'cards' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Cards</button>
              <button @click="localSettings.defaultView = 'list'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.defaultView === 'list' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >List</button>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-bg-secondary dark:border-dark-secondary" />

          <!-- Data Management -->
          <div>
            <h3 class="font-medium text-text-primary dark:text-dark-text mb-3">Data Management</h3>
            <div class="space-y-3">
              <button @click="$emit('export-data')"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
              >
                <svg class="w-5 h-5 text-accent-culture" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <div>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Export Data (JSON)</span>
                  <p class="text-xs text-text-muted">Download a backup of all your data</p>
                </div>
              </button>

              <button @click="triggerImport"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
              >
                <svg class="w-5 h-5 text-accent-brine" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <div>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Import Data (JSON)</span>
                  <p class="text-xs text-text-muted">Restore from a backup file</p>
                </div>
              </button>
              <input ref="importInput" type="file" accept=".json" @change="onImportFile" class="hidden" />

              <button @click="confirmClear"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-ferment/5 hover:bg-accent-ferment/10 transition-all text-left border border-accent-ferment/20"
              >
                <svg class="w-5 h-5 text-accent-ferment" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <div>
                  <span class="text-sm font-medium text-accent-ferment">Clear All Data</span>
                  <p class="text-xs text-text-muted">Permanently delete all data</p>
                </div>
              </button>

              <!-- Clear Confirmation -->
              <div v-if="showClearConfirm" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4 space-y-3">
                <p class="text-sm text-accent-ferment font-medium">Are you sure? This will delete all your pantry items, journal entries, favorites, and settings.</p>
                <div class="flex gap-2">
                  <button @click="showClearConfirm = false" class="flex-1 px-4 py-2 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary transition-all">Cancel</button>
                  <button @click="executeClear" class="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-accent-ferment text-white transition-all">Yes, Clear Everything</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage Usage -->
          <div class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Storage Used</span>
              <span class="font-mono text-sm text-text-primary dark:text-dark-text">{{ storageSizeDisplay }}</span>
            </div>
            <div class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-2">
              <div class="bg-accent-brine rounded-full h-2 transition-all" :style="{ width: storagePercent + '%' }"></div>
            </div>
            <p class="text-xs text-text-muted mt-1">{{ storagePercent }}% of ~5 MB limit</p>
          </div>

          <!-- About -->
          <div class="text-center pt-2">
            <p class="text-2xl mb-1">🫙</p>
            <p class="font-serif text-lg text-text-primary dark:text-dark-text">FERMENT</p>
            <p class="text-xs text-text-muted">v1.0 — Your Fermentation Companion</p>
            <p class="text-xs text-text-muted mt-1">Made with salt, patience, and good bacteria.</p>
            <div v-if="userLevel.level > 0" class="mt-2">
              <span class="text-xs bg-bg-secondary dark:bg-dark-secondary rounded-full px-3 py-1 text-text-secondary dark:text-dark-text-secondary">
                Level {{ userLevel.level }}: {{ userLevel.title }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

// ============================================================
// OnboardingModal Component
// ============================================================
const OnboardingModalComponent = {
  name: 'onboarding-modal',

  props: {
    settings: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['complete'],

  data() {
    return {
      step: 0,
      localSettings: {
        region: this.settings.region || 'IN',
        units: this.settings.units || 'metric',
        theme: this.settings.theme || 'light',
      },
    };
  },

  computed: {
    steps() {
      return [
        { id: 'welcome', title: 'Welcome' },
        { id: 'region', title: 'Region' },
        { id: 'units', title: 'Units' },
        { id: 'tour', title: 'Tour' },
      ];
    },

    countries() {
      return [
        { code: '', label: 'Skip for now' },
        { code: 'IN', label: 'India' },
        { code: 'US', label: 'United States' },
        { code: 'CA', label: 'Canada' },
        { code: 'GB', label: 'United Kingdom' },
        { code: 'DE', label: 'Germany' },
        { code: 'FR', label: 'France' },
        { code: 'IT', label: 'Italy' },
        { code: 'ES', label: 'Spain' },
        { code: 'KR', label: 'South Korea' },
        { code: 'JP', label: 'Japan' },
        { code: 'CN', label: 'China' },
        { code: 'TH', label: 'Thailand' },
        { code: 'TR', label: 'Turkey' },
        { code: 'MX', label: 'Mexico' },
        { code: 'BR', label: 'Brazil' },
        { code: 'AU', label: 'Australia' },
      ];
    },

    features() {
      return [
        { emoji: '📚', title: 'Browse Recipes', desc: 'Explore fermentation recipes from cultures around the world.' },
        { emoji: '🧺', title: 'Pantry Tracking', desc: 'Add your ingredients and see what you can make right now.' },
        { emoji: '📓', title: 'Fermentation Journal', desc: 'Track your batches, log checks, and build your fermentation journey.' },
        { emoji: '🧰', title: 'Tools', desc: 'Brine calculator, batch scaler, timers, and reference guides.' },
      ];
    },
  },

  methods: {
    next() {
      if (this.step < this.steps.length - 1) {
        this.step++;
      }
    },

    prev() {
      if (this.step > 0) {
        this.step--;
      }
    },

    finish() {
      this.$emit('complete', {
        region: this.localSettings.region,
        units: this.localSettings.units,
        theme: this.localSettings.theme,
        onboardingComplete: true,
      });
    },
  },

  mounted() {
    document.body.style.overflow = 'hidden';
  },

  beforeUnmount() {
    document.body.style.overflow = '';
  },

  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-xl w-full max-w-md overflow-hidden">
        <!-- Progress Dots -->
        <div class="flex justify-center gap-2 pt-5 pb-2">
          <div v-for="(s, i) in steps" :key="s.id"
            :class="[
              'w-2 h-2 rounded-full transition-all duration-300',
              i === step ? 'bg-accent-brine w-6' : i < step ? 'bg-accent-culture' : 'bg-text-muted/30'
            ]"
          ></div>
        </div>

        <!-- Step Content -->
        <div class="px-8 py-6">
          <!-- Welcome -->
          <div v-if="step === 0" class="text-center space-y-4">
            <div class="text-6xl">🫙</div>
            <h2 class="font-serif text-3xl text-text-primary dark:text-dark-text">Welcome to FERMENT</h2>
            <p class="text-text-secondary dark:text-dark-text-secondary leading-relaxed">
              Your companion for the ancient, living art of fermentation. From sauerkraut to kimchi, from miso to hot sauce
              — explore recipes from cultures around the world and start your own fermentation journey.
            </p>
            <p class="text-sm text-text-muted italic font-serif">
              "May your cultures be strong, your brine be clear, and your jars never explode."
            </p>
          </div>

          <!-- Region -->
          <div v-if="step === 1" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl mb-2">🌍</div>
              <h3 class="font-serif text-2xl text-text-primary dark:text-dark-text">Where are you?</h3>
              <p class="text-sm text-text-muted dark:text-dark-text-secondary mt-1">
                This helps us show ingredient availability and local fermentation traditions. Totally optional!
              </p>
            </div>
            <select v-model="localSettings.region"
              class="w-full px-4 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-brine focus:outline-none transition-all"
            >
              <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
            </select>
          </div>

          <!-- Units -->
          <div v-if="step === 2" class="space-y-4">
            <div class="text-center">
              <div class="text-4xl mb-2">📏</div>
              <h3 class="font-serif text-2xl text-text-primary dark:text-dark-text">Preferred Units</h3>
              <p class="text-sm text-text-muted dark:text-dark-text-secondary mt-1">
                Choose your measurement system. You can always change this later.
              </p>
            </div>
            <div class="flex gap-4">
              <button @click="localSettings.units = 'metric'"
                :class="[
                  'flex-1 p-5 rounded-xl border-2 text-center transition-all',
                  localSettings.units === 'metric'
                    ? 'border-accent-brine bg-accent-brine/10'
                    : 'border-bg-secondary dark:border-dark-secondary'
                ]"
              >
                <div class="text-2xl mb-2">🇪🇺</div>
                <div class="font-medium text-text-primary dark:text-dark-text">Metric</div>
                <div class="text-xs text-text-muted mt-1">g, kg, ml, L, °C</div>
              </button>
              <button @click="localSettings.units = 'imperial'"
                :class="[
                  'flex-1 p-5 rounded-xl border-2 text-center transition-all',
                  localSettings.units === 'imperial'
                    ? 'border-accent-brine bg-accent-brine/10'
                    : 'border-bg-secondary dark:border-dark-secondary'
                ]"
              >
                <div class="text-2xl mb-2">🇺🇸</div>
                <div class="font-medium text-text-primary dark:text-dark-text">Imperial</div>
                <div class="text-xs text-text-muted mt-1">oz, lb, cups, °F</div>
              </button>
            </div>
          </div>

          <!-- Tour -->
          <div v-if="step === 3" class="space-y-4">
            <div class="text-center mb-2">
              <h3 class="font-serif text-2xl text-text-primary dark:text-dark-text">Here's what you can do</h3>
            </div>
            <div class="space-y-3">
              <div v-for="feature in features" :key="feature.title"
                class="flex items-start gap-3 bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl p-3"
              >
                <span class="text-2xl flex-shrink-0">{{ feature.emoji }}</span>
                <div>
                  <h4 class="font-medium text-sm text-text-primary dark:text-dark-text">{{ feature.title }}</h4>
                  <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5">{{ feature.desc }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="px-8 pb-6 flex items-center justify-between gap-3">
          <button v-if="step > 0" @click="prev"
            class="px-4 py-2.5 rounded-xl text-sm text-text-secondary dark:text-dark-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all"
          >Back</button>
          <div v-else></div>

          <button v-if="step < steps.length - 1" @click="next"
            class="px-6 py-2.5 rounded-xl text-sm font-medium bg-accent-brine text-white shadow-warm hover:shadow-warm-lg transition-all"
          >Continue</button>
          <button v-else @click="finish"
            class="px-6 py-2.5 rounded-xl text-sm font-medium bg-accent-culture text-white shadow-warm hover:shadow-warm-lg transition-all"
          >Let's Get Fermenting!</button>
        </div>
      </div>
    </div>
  `
};
