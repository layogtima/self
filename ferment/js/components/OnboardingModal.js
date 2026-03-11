/**
 * FERMENT - OnboardingModal Component
 * First-run onboarding wizard: region, units, feature tour
 */

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
              - explore recipes from cultures around the world and start your own fermentation journey.
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
