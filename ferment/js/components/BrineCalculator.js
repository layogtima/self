/**
 * FERMENT - BrineCalculator Component
 * Salt/brine calculation tool for fermentation
 */

const BrineCalculatorComponent = {
  name: 'brine-calculator',

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] BrineCalculator error in', info, err);
    this.calcError = (err && err.message) || 'An error occurred.';
    return false;
  },

  data() {
    return {
      calcError: null,
      saltPercent: 3,
      vegWeight: 500,
      weightUnit: 'g',
      technique: 'dry',
      ambientTemp: '',
    };
  },

  computed: {
    vegWeightInGrams() {
      return FermentFormat.convertUnit(this.vegWeight, this.weightUnit, 'g');
    },

    saltNeeded() {
      if (this.technique === 'dry') {
        return FermentFormat.calcDrySalt(this.vegWeightInGrams, this.saltPercent);
      } else {
        // For brine: salt based on total brine weight
        return FermentFormat.calcBrineSalt(this.vegWeightInGrams, this.saltPercent);
      }
    },

    saltHuman() {
      try { return FermentFormat.saltToHuman(this.saltNeeded); } catch (e) { return ''; }
    },

    saltInWaterHuman() {
      try { return FermentFormat.saltToHuman(this.saltInWater); } catch (e) { return ''; }
    },

    waterNeeded() {
      if (this.technique !== 'brine') return 0;
      // Water to cover vegetables: roughly equal to veg weight
      return this.vegWeightInGrams;
    },

    saltInWater() {
      if (this.technique !== 'brine') return 0;
      return FermentFormat.calcBrineSalt(this.waterNeeded, this.saltPercent);
    },

    timeEstimate() {
      if (!this.ambientTemp || parseFloat(this.ambientTemp) <= 0) return null;
      // Base: 7 days at 21C for typical lacto-fermentation
      const baseDays = 7;
      const baseTemp = 21;
      const adjusted = FermentFormat.adjustedFermentTime(baseDays, baseTemp, parseFloat(this.ambientTemp));
      return Math.round(adjusted);
    },

    commonPercentages() {
      return [
        { pct: 2, use: 'Light pickles, sauerkraut', emoji: '🥬' },
        { pct: 2.5, use: 'Standard sauerkraut', emoji: '🥒' },
        { pct: 3, use: 'Most vegetable ferments', emoji: '🥕' },
        { pct: 3.5, use: 'Kimchi, pickles', emoji: '🌶️' },
        { pct: 5, use: 'Strong brine pickles', emoji: '🫒' },
        { pct: 7, use: 'Preservation brines', emoji: '🧂' },
        { pct: 10, use: 'Heavy preservation', emoji: '🏺' },
      ];
    },

    weightUnits() {
      return [
        { value: 'g', label: 'Grams' },
        { value: 'oz', label: 'Ounces' },
        { value: 'lb', label: 'Pounds' },
        { value: 'kg', label: 'Kilograms' },
      ];
    },
  },

  methods: {
    setPercent(pct) {
      this.saltPercent = pct;
    },
  },

  template: `
    <div class="space-y-6">
      <div v-if="calcError" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
        <p class="text-sm text-accent-ferment font-medium">Something went wrong.</p>
        <p class="text-xs text-text-muted mt-1">{{ calcError }}</p>
        <button @click="calcError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
      </div>
      <template v-if="!calcError">
      <!-- Calculator Card -->
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
        <!-- Header -->
        <div class="bg-accent-brine/10 dark:bg-accent-brine/5 px-6 py-4 border-b border-accent-brine/20">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🧂</span>
            <div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Brine Calculator</h3>
              <p class="text-sm text-text-muted dark:text-dark-text-secondary">Calculate salt and brine for any ferment</p>
            </div>
          </div>
        </div>

        <div class="p-6 space-y-6">
          <!-- Technique Toggle -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Technique</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button @click="technique = 'dry'"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  technique === 'dry' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary dark:text-dark-text-secondary'
                ]"
              >🧂 Dry Salt</button>
              <button @click="technique = 'brine'"
                :class="[
                  'flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                  technique === 'brine' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary dark:text-dark-text-secondary'
                ]"
              >💧 Brine</button>
            </div>
          </div>

          <!-- Salt Percentage Slider -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-medium text-text-secondary dark:text-dark-text-secondary">Salt Percentage</label>
              <span class="font-mono text-2xl font-medium text-accent-brine">{{ saltPercent }}%</span>
            </div>
            <input type="range" min="0.5" max="10" step="0.5" v-model.number="saltPercent"
              class="w-full h-2 accent-accent-brine"
            />
            <div class="flex justify-between text-xs text-text-muted mt-1">
              <span>0.5%</span>
              <span>5%</span>
              <span>10%</span>
            </div>
          </div>

          <!-- Vegetable Weight -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
              {{ technique === 'dry' ? 'Vegetable Weight' : 'Water Amount' }}
            </label>
            <div class="flex gap-3">
              <div class="flex-1 relative">
                <input type="number" v-model.number="vegWeight" step="1" min="0"
                  class="w-full px-4 py-3 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-brine focus:ring-1 focus:ring-accent-brine focus:outline-none transition-all font-mono text-lg"
                />
              </div>
              <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
                <button v-for="u in weightUnits" :key="u.value"
                  @click="weightUnit = u.value"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    weightUnit === u.value ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-muted'
                  ]"
                >{{ u.value }}</button>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-2xl p-5 space-y-4">
            <h4 class="font-serif text-lg text-text-primary dark:text-dark-text">Results</h4>

            <!-- Salt Needed -->
            <div class="flex items-center justify-between py-2 border-b border-bg-secondary dark:border-dark-secondary">
              <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Salt needed</span>
              <div class="text-right">
                <span class="font-mono text-xl font-medium text-accent-brine">{{ saltNeeded.toFixed(1) }}g</span>
                <span class="block text-xs text-text-muted font-mono">{{ saltHuman }}</span>
              </div>
            </div>

            <!-- Brine-specific results -->
            <template v-if="technique === 'brine'">
              <div class="flex items-center justify-between py-2 border-b border-bg-secondary dark:border-dark-secondary">
                <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Water needed</span>
                <span class="font-mono text-xl font-medium text-text-primary dark:text-dark-text">{{ waterNeeded.toFixed(0) }}ml</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-bg-secondary dark:border-dark-secondary">
                <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Salt in water</span>
                <div class="text-right">
                  <span class="font-mono text-xl font-medium text-accent-brine">{{ saltInWater.toFixed(1) }}g</span>
                  <span class="block text-xs text-text-muted font-mono">{{ saltInWaterHuman }}</span>
                </div>
              </div>
            </template>

            <!-- Technique Note -->
            <p class="text-xs text-text-muted dark:text-dark-text-secondary italic">
              <template v-if="technique === 'dry'">
                Dry salting: Toss salt directly with vegetables and massage until brine forms naturally.
              </template>
              <template v-else>
                Brine method: Dissolve salt in water, then submerge vegetables completely.
              </template>
            </p>
          </div>

          <!-- Temperature-Adjusted Time -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">
              Ambient Temperature (optional)
            </label>
            <div class="flex items-center gap-3">
              <input type="number" v-model="ambientTemp" step="0.5" placeholder="e.g. 22"
                class="w-32 px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-brine focus:outline-none transition-all font-mono"
              />
              <span class="text-sm text-text-muted">°C</span>
              <div v-if="timeEstimate" class="flex-1 text-right">
                <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Estimated time: </span>
                <span class="font-mono font-medium text-accent-aged">~{{ timeEstimate }} days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Common Percentages Reference -->
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
        <div class="px-6 py-4 border-b border-bg-secondary dark:border-dark-secondary">
          <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Common Salt Percentages</h3>
        </div>
        <div class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary">
          <button v-for="ref in commonPercentages" :key="ref.pct"
            @click="setPercent(ref.pct)"
            :class="[
              'w-full flex items-center justify-between px-6 py-3 hover:bg-bg-secondary/30 dark:hover:bg-dark-secondary/30 transition-all text-left',
              saltPercent === ref.pct ? 'bg-accent-brine/5' : ''
            ]"
          >
            <div class="flex items-center gap-3">
              <span class="text-lg">{{ ref.emoji }}</span>
              <span class="text-sm text-text-primary dark:text-dark-text">{{ ref.use }}</span>
            </div>
            <span :class="[
              'font-mono text-sm font-medium px-2.5 py-1 rounded-lg',
              saltPercent === ref.pct ? 'bg-accent-brine text-white' : 'bg-bg-secondary dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary'
            ]">{{ ref.pct }}%</span>
          </button>
        </div>
      </div>
      </template>
    </div>
  `
};
