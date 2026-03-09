/**
 * FERMENT — FilterPanel Component
 * Multi-faceted recipe filtering with collapsible sections
 */

const FilterPanelComponent = {
  name: 'filter-panel',

  props: {
    filters: {
      type: Object,
      default: () => ({})
    },
    recipeCount: {
      type: Number,
      default: 0
    },
    totalCount: {
      type: Number,
      default: 0
    }
  },

  emits: ['update:filters', 'close'],

  data() {
    return {
      localFilters: {
        difficulty: [],
        categories: [],
        techniques: [],
        regions: [],
        maxDays: 365,
        dietary: [],
        pantryMatch: false,
        ...JSON.parse(JSON.stringify(this.filters))
      },
      expandedSections: {
        difficulty: true,
        category: true,
        technique: false,
        region: false,
        time: false,
        dietary: false
      }
    };
  },

  computed: {
    difficulties() {
      return [
        { level: 1, label: 'Beginner', tagline: 'Just Add Salt', emoji: '🌱', color: 'bg-tier-beginner' },
        { level: 2, label: 'Seasoned', tagline: 'Flavoring Now', emoji: '🌿', color: 'bg-tier-seasoned' },
        { level: 3, label: 'Ambitious', tagline: 'Getting Serious', emoji: '🌶️', color: 'bg-tier-ambitious' },
        { level: 4, label: 'Advanced', tagline: 'Sauces & Pastes', emoji: '🔥', color: 'bg-tier-advanced' },
        { level: 5, label: 'Master', tagline: 'Final Boss', emoji: '👑', color: 'bg-tier-master' }
      ];
    },

    categories() {
      return [
        { id: 'vegetable', label: 'Vegetables', emoji: '🥬' },
        { id: 'sauce', label: 'Sauces', emoji: '🫗' },
        { id: 'paste', label: 'Pastes', emoji: '🫙' },
        { id: 'condiment', label: 'Condiments', emoji: '🧂' },
        { id: 'drink', label: 'Drinks', emoji: '🍵' },
        { id: 'powder', label: 'Powders', emoji: '✨' },
        { id: 'preserve', label: 'Preserves', emoji: '🍯' }
      ];
    },

    techniques() {
      return [
        { id: 'brine', label: 'Brine', emoji: '💧' },
        { id: 'dry-salt', label: 'Dry Salt', emoji: '🧂' },
        { id: 'paste', label: 'Paste', emoji: '🫗' },
        { id: 'mash', label: 'Mash', emoji: '🥄' },
        { id: 'dry-ferment', label: 'Dry Ferment', emoji: '🌬️' },
        { id: 'mixed-culture', label: 'Mixed Culture', emoji: '🦠' }
      ];
    },

    regions() {
      return [
        { id: 'East Asia', label: 'East Asia', emoji: '🏯' },
        { id: 'South Asia', label: 'South Asia', emoji: '🕌' },
        { id: 'SE Asia', label: 'SE Asia', emoji: '🌴' },
        { id: 'Middle East', label: 'Middle East', emoji: '🏺' },
        { id: 'Europe', label: 'Europe', emoji: '🏰' },
        { id: 'Americas', label: 'Americas', emoji: '🌎' },
        { id: 'Africa', label: 'Africa', emoji: '🌍' }
      ];
    },

    dietaryOptions() {
      return [
        { id: 'vegan', label: 'Vegan', emoji: '🌱' },
        { id: 'vegetarian', label: 'Vegetarian', emoji: '🥚' },
        { id: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' }
      ];
    },

    activeFilterCount() {
      let count = 0;
      if (this.localFilters.difficulty.length) count++;
      if (this.localFilters.categories.length) count++;
      if (this.localFilters.techniques.length) count++;
      if (this.localFilters.regions.length) count++;
      if (this.localFilters.maxDays < 365) count++;
      if (this.localFilters.dietary.length) count++;
      if (this.localFilters.pantryMatch) count++;
      return count;
    },

    timeLabel() {
      const d = this.localFilters.maxDays;
      if (d >= 365) return 'Any time';
      if (d === 1) return '1 day';
      if (d < 7) return d + ' days';
      if (d < 30) return Math.floor(d / 7) + ' week' + (Math.floor(d / 7) > 1 ? 's' : '');
      if (d < 365) return Math.floor(d / 30) + ' month' + (Math.floor(d / 30) > 1 ? 's' : '');
      return d + ' days';
    }
  },

  watch: {
    filters: {
      handler(newVal) {
        this.localFilters = {
          difficulty: [],
          categories: [],
          techniques: [],
          regions: [],
          maxDays: 365,
          dietary: [],
          pantryMatch: false,
          ...JSON.parse(JSON.stringify(newVal))
        };
      },
      deep: true
    }
  },

  methods: {
    toggleSection(section) {
      this.expandedSections[section] = !this.expandedSections[section];
    },

    toggleDifficulty(level) {
      const idx = this.localFilters.difficulty.indexOf(level);
      if (idx === -1) {
        this.localFilters.difficulty.push(level);
      } else {
        this.localFilters.difficulty.splice(idx, 1);
      }
      this.emitFilters();
    },

    toggleArrayFilter(array, value) {
      const idx = array.indexOf(value);
      if (idx === -1) {
        array.push(value);
      } else {
        array.splice(idx, 1);
      }
      this.emitFilters();
    },

    onTimeChange(e) {
      this.localFilters.maxDays = parseInt(e.target.value);
      this.emitFilters();
    },

    togglePantryMatch() {
      this.localFilters.pantryMatch = !this.localFilters.pantryMatch;
      this.emitFilters();
    },

    clearAll() {
      this.localFilters = {
        difficulty: [],
        categories: [],
        techniques: [],
        regions: [],
        maxDays: 365,
        dietary: [],
        pantryMatch: false
      };
      this.emitFilters();
    },

    emitFilters() {
      this.$emit('update:filters', { ...this.localFilters });
    }
  },

  template: `
    <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-bg-secondary dark:border-dark-secondary">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-accent-brine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Filters</h3>
          <span v-if="activeFilterCount > 0" class="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-accent-ferment rounded-full">
            {{ activeFilterCount }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="activeFilterCount > 0"
            @click="clearAll"
            class="text-xs font-medium text-accent-ferment hover:text-accent-ferment/80 transition-colors"
          >
            Clear All
          </button>
          <button
            @click="$emit('close')"
            class="p-1 rounded-lg hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-colors lg:hidden"
            aria-label="Close filters"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary max-h-[70vh] overflow-y-auto custom-scrollbar">

        <!-- What Can I Make? Toggle -->
        <div class="px-5 py-4">
          <button
            @click="togglePantryMatch"
            :class="[
              'w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300',
              localFilters.pantryMatch
                ? 'bg-accent-culture/15 border-2 border-accent-culture text-accent-culture'
                : 'bg-bg-secondary/50 dark:bg-dark-secondary border-2 border-transparent text-text-secondary dark:text-dark-text-secondary hover:border-accent-culture/30'
            ]"
          >
            <span class="flex items-center gap-2 font-medium">
              <span class="text-lg">🧑‍🍳</span>
              What Can I Make?
            </span>
            <div
              :class="[
                'w-10 h-6 rounded-full transition-all duration-300 relative',
                localFilters.pantryMatch ? 'bg-accent-culture' : 'bg-text-muted/30'
              ]"
            >
              <div
                :class="[
                  'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300',
                  localFilters.pantryMatch ? 'left-5' : 'left-1'
                ]"
              ></div>
            </div>
          </button>
        </div>

        <!-- Difficulty -->
        <div class="px-5 py-3">
          <button @click="toggleSection('difficulty')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Difficulty</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.difficulty ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.difficulty" class="grid grid-cols-5 gap-1.5 pt-2 pb-1">
            <button
              v-for="d in difficulties"
              :key="d.level"
              @click="toggleDifficulty(d.level)"
              :class="[
                'flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all duration-200 border-2',
                localFilters.difficulty.includes(d.level)
                  ? d.color + ' text-white border-transparent shadow-warm'
                  : 'bg-bg-secondary/50 dark:bg-dark-secondary text-text-secondary dark:text-dark-text-secondary border-transparent hover:border-text-muted/20'
              ]"
              :title="d.tagline"
            >
              <span class="text-base">{{ d.emoji }}</span>
              <span class="font-medium leading-none">{{ d.level }}</span>
            </button>
          </div>
        </div>

        <!-- Category -->
        <div class="px-5 py-3">
          <button @click="toggleSection('category')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Category</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.category ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.category" class="flex flex-wrap gap-2 pt-2 pb-1">
            <label
              v-for="cat in categories"
              :key="cat.id"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all duration-200 border-2 select-none',
                localFilters.categories.includes(cat.id)
                  ? 'bg-accent-brine/15 border-accent-brine text-accent-aged dark:text-accent-brine font-medium'
                  : 'bg-bg-secondary/50 dark:bg-dark-secondary border-transparent text-text-secondary dark:text-dark-text-secondary hover:border-text-muted/20'
              ]"
            >
              <input
                type="checkbox"
                :checked="localFilters.categories.includes(cat.id)"
                @change="toggleArrayFilter(localFilters.categories, cat.id)"
                class="sr-only"
              />
              <span>{{ cat.emoji }}</span>
              <span>{{ cat.label }}</span>
            </label>
          </div>
        </div>

        <!-- Technique -->
        <div class="px-5 py-3">
          <button @click="toggleSection('technique')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Technique</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.technique ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.technique" class="flex flex-wrap gap-2 pt-2 pb-1">
            <label
              v-for="tech in techniques"
              :key="tech.id"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all duration-200 border-2 select-none',
                localFilters.techniques.includes(tech.id)
                  ? 'bg-accent-culture/15 border-accent-culture text-accent-culture font-medium'
                  : 'bg-bg-secondary/50 dark:bg-dark-secondary border-transparent text-text-secondary dark:text-dark-text-secondary hover:border-text-muted/20'
              ]"
            >
              <input
                type="checkbox"
                :checked="localFilters.techniques.includes(tech.id)"
                @change="toggleArrayFilter(localFilters.techniques, tech.id)"
                class="sr-only"
              />
              <span>{{ tech.emoji }}</span>
              <span>{{ tech.label }}</span>
            </label>
          </div>
        </div>

        <!-- Region -->
        <div class="px-5 py-3">
          <button @click="toggleSection('region')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Region</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.region ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.region" class="flex flex-wrap gap-2 pt-2 pb-1">
            <label
              v-for="reg in regions"
              :key="reg.id"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all duration-200 border-2 select-none',
                localFilters.regions.includes(reg.id)
                  ? 'bg-accent-aged/15 border-accent-aged text-accent-aged font-medium'
                  : 'bg-bg-secondary/50 dark:bg-dark-secondary border-transparent text-text-secondary dark:text-dark-text-secondary hover:border-text-muted/20'
              ]"
            >
              <input
                type="checkbox"
                :checked="localFilters.regions.includes(reg.id)"
                @change="toggleArrayFilter(localFilters.regions, reg.id)"
                class="sr-only"
              />
              <span>{{ reg.emoji }}</span>
              <span>{{ reg.label }}</span>
            </label>
          </div>
        </div>

        <!-- Time Available -->
        <div class="px-5 py-3">
          <button @click="toggleSection('time')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Time Available</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.time ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.time" class="pt-2 pb-1 space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-text-muted dark:text-dark-text-secondary">Max ferment time:</span>
              <span class="font-medium text-accent-brine">{{ timeLabel }}</span>
            </div>
            <input
              type="range"
              min="1"
              max="365"
              :value="localFilters.maxDays"
              @input="onTimeChange"
              class="w-full"
            />
            <div class="flex justify-between text-xs text-text-muted">
              <span>1 day</span>
              <span>1 week</span>
              <span>1 month</span>
              <span>1 year</span>
            </div>
          </div>
        </div>

        <!-- Dietary -->
        <div class="px-5 py-3">
          <button @click="toggleSection('dietary')" class="w-full flex items-center justify-between py-2 group">
            <span class="font-medium text-sm text-text-primary dark:text-dark-text">Dietary</span>
            <svg
              :class="['w-4 h-4 text-text-muted transition-transform duration-200', expandedSections.dietary ? 'rotate-180' : '']"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-show="expandedSections.dietary" class="flex flex-wrap gap-2 pt-2 pb-1">
            <label
              v-for="diet in dietaryOptions"
              :key="diet.id"
              :class="[
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm cursor-pointer transition-all duration-200 border-2 select-none',
                localFilters.dietary.includes(diet.id)
                  ? 'bg-accent-culture/15 border-accent-culture text-accent-culture font-medium'
                  : 'bg-bg-secondary/50 dark:bg-dark-secondary border-transparent text-text-secondary dark:text-dark-text-secondary hover:border-text-muted/20'
              ]"
            >
              <input
                type="checkbox"
                :checked="localFilters.dietary.includes(diet.id)"
                @change="toggleArrayFilter(localFilters.dietary, diet.id)"
                class="sr-only"
              />
              <span>{{ diet.emoji }}</span>
              <span>{{ diet.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer with result count -->
      <div class="px-5 py-3 border-t border-bg-secondary dark:border-dark-secondary bg-bg-secondary/30 dark:bg-dark-secondary/30">
        <p class="text-sm text-text-muted dark:text-dark-text-secondary text-center">
          <span class="font-medium text-text-primary dark:text-dark-text">{{ recipeCount }}</span>
          <span v-if="recipeCount !== totalCount"> of {{ totalCount }}</span>
          recipe{{ recipeCount === 1 ? '' : 's' }}
        </p>
      </div>
    </div>
  `
};
