/**
 * FERMENT — SearchBar Component
 * Full-text search input with debounced filtering
 */

const SearchBarComponent = {
  name: 'search-bar',

  props: {
    query: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Search recipes, ingredients, regions...'
    }
  },

  emits: ['update:query'],

  data() {
    return {
      localQuery: this.query,
      isFocused: false,
      debounceTimer: null
    };
  },

  watch: {
    query(newVal) {
      if (newVal !== this.localQuery) {
        this.localQuery = newVal;
      }
    }
  },

  methods: {
    onInput(e) {
      this.localQuery = e.target.value;
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.$emit('update:query', this.localQuery);
      }, 250);
    },

    clearSearch() {
      this.localQuery = '';
      clearTimeout(this.debounceTimer);
      this.$emit('update:query', '');
      this.$refs.input.focus();
    },

    onFocus() {
      this.isFocused = true;
    },

    onBlur() {
      this.isFocused = false;
    }
  },

  beforeUnmount() {
    clearTimeout(this.debounceTimer);
  },

  template: `
    <div
      :class="[
        'relative group transition-all duration-300 ease-ferment',
        isFocused
          ? 'ring-2 ring-accent-brine/50 shadow-warm-lg'
          : 'shadow-warm hover:shadow-warm-lg'
      ]"
      class="rounded-2xl bg-bg-card dark:bg-dark-card"
    >
      <!-- Search Icon -->
      <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <svg
          class="w-5 h-5 transition-colors duration-300"
          :class="isFocused ? 'text-accent-brine' : 'text-text-muted dark:text-dark-text-secondary'"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <!-- Input -->
      <input
        ref="input"
        type="text"
        :value="localQuery"
        :placeholder="placeholder"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        class="w-full pl-12 pr-12 py-3.5 bg-transparent rounded-2xl text-text-primary dark:text-dark-text placeholder-text-muted dark:placeholder-dark-text-secondary font-sans text-base focus:outline-none"
        aria-label="Search recipes"
      />

      <!-- Clear Button -->
      <div v-if="localQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
        <button
          @click="clearSearch"
          class="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-bg-secondary dark:hover:bg-dark-secondary dark:hover:text-dark-text transition-all duration-200"
          aria-label="Clear search"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Subtle bottom accent line when focused -->
      <div
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-accent-brine rounded-full transition-all duration-300 ease-ferment"
        :class="isFocused ? 'w-1/2 opacity-100' : 'w-0 opacity-0'"
      ></div>
    </div>
  `
};
