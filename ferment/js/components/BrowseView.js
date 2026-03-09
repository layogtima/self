/**
 * FERMENT -- BrowseView Component
 * Wraps SearchBar, FilterPanel, and RecipeCards into a browsing experience
 */

const BrowseViewComponent = {
  name: 'browse-view',

  props: {
    recipes: {
      type: Array,
      default: () => []
    },
    allRecipes: {
      type: Array,
      default: () => []
    },
    filters: {
      type: Object,
      default: () => ({})
    },
    viewMode: {
      type: String,
      default: 'cards'
    },
    pantry: {
      type: Array,
      default: () => []
    },
    favorites: {
      type: Array,
      default: () => []
    },
    bookmarks: {
      type: Array,
      default: () => []
    },
    userLevel: {
      type: Object,
      default: () => ({})
    },
    settings: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['update:view-mode', 'update:filters', 'open-recipe', 'toggle-favorite', 'toggle-bookmark', 'start-batch'],

  data() {
    return {
      searchQuery: '',
      localViewMode: this.viewMode || 'cards',
      showFilters: false,
      sortBy: 'name',
      sortDir: 'asc',
      searchIndex: null,
    };
  },

  computed: {
    searchedRecipes() {
      if (!this.searchQuery.trim()) return this.recipes;
      if (!this.searchIndex) return this.recipes;
      const ids = FermentSearch.search(this.searchQuery, this.searchIndex);
      if (ids === null) return this.recipes;
      const idSet = new Set(ids);
      // Preserve search-score ordering
      return ids
        .filter(id => this.recipeMap[id])
        .map(id => this.recipeMap[id]);
    },

    recipeMap() {
      const map = {};
      for (const r of this.recipes) {
        map[r.id] = r;
      }
      return map;
    },

    sortedRecipes() {
      const arr = [...this.searchedRecipes];
      const dir = this.sortDir === 'asc' ? 1 : -1;

      arr.sort((a, b) => {
        switch (this.sortBy) {
          case 'name':
            return dir * (a.name || '').localeCompare(b.name || '');
          case 'difficulty':
            return dir * ((a.difficulty || 1) - (b.difficulty || 1));
          case 'time': {
            const ta = this.getTimeDays(a);
            const tb = this.getTimeDays(b);
            return dir * (ta - tb);
          }
          case 'region':
            return dir * (a.region || '').localeCompare(b.region || '');
          default:
            return 0;
        }
      });

      // If searching, don't re-sort -- preserve relevance
      if (this.searchQuery.trim() && this.sortBy === 'name') return this.searchedRecipes;

      return arr;
    },

    pantryMatches() {
      if (!this.pantry || this.pantry.length === 0) return {};
      const matches = {};
      for (const r of this.recipes) {
        if (typeof FermentMatching !== 'undefined') {
          matches[r.id] = FermentMatching.matchRecipe(r, this.pantry);
        }
      }
      return matches;
    },

    viewModes() {
      return [
        { id: 'cards', label: 'Cards', icon: 'grid' },
        { id: 'list', label: 'List', icon: 'list' },
        { id: 'table', label: 'Table', icon: 'table' },
      ];
    },

    sortOptions() {
      return [
        { id: 'name', label: 'Name' },
        { id: 'difficulty', label: 'Difficulty' },
        { id: 'time', label: 'Time' },
        { id: 'region', label: 'Region' },
      ];
    },

    activeFilterCount() {
      let count = 0;
      const f = this.filters;
      if (f.difficulty && f.difficulty.length) count++;
      if (f.categories && f.categories.length) count++;
      if (f.techniques && f.techniques.length) count++;
      if (f.regions && f.regions.length) count++;
      if (f.maxDays && f.maxDays < 365) count++;
      if (f.dietary && f.dietary.length) count++;
      if (f.pantryMatch) count++;
      return count;
    }
  },

  watch: {
    viewMode(val) {
      this.localViewMode = val;
    },
    allRecipes: {
      handler(recipes) {
        if (recipes && recipes.length && typeof FermentSearch !== 'undefined') {
          this.searchIndex = FermentSearch.buildIndex(recipes);
        }
      },
      immediate: true
    }
  },

  methods: {
    onSearchUpdate(query) {
      this.searchQuery = query;
    },

    onFiltersUpdate(filters) {
      this.$emit('update:filters', filters);
    },

    setViewMode(mode) {
      this.localViewMode = mode;
      this.$emit('update:view-mode', mode);
    },

    setSortBy(field) {
      if (this.sortBy === field) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortBy = field;
        this.sortDir = 'asc';
      }
    },

    toggleTableSort(field) {
      this.setSortBy(field);
    },

    isFavorite(recipe) {
      return this.favorites.includes(recipe.id);
    },

    isBookmarked(recipe) {
      return this.bookmarks.includes(recipe.id);
    },

    getTimeDays(recipe) {
      const t = recipe.totalTime || recipe.time;
      if (!t) return 999;
      if (typeof t === 'object') return t.min || t.days || 999;
      if (typeof t === 'number') return t;
      return 999;
    },

    sortIcon(field) {
      if (this.sortBy !== field) return '';
      return this.sortDir === 'asc' ? ' \\u25B2' : ' \\u25BC';
    }
  },

  template: `
    <div class="space-y-4">
      <!-- Search Bar -->
      <search-bar
        :query="searchQuery"
        placeholder="Search recipes, ingredients, regions..."
        @update:query="onSearchUpdate"
      ></search-bar>

      <!-- Toolbar: View Toggle, Sort, Filter, Count -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <!-- Left: Filter toggle + count -->
        <div class="flex items-center gap-3">
          <button
            @click="showFilters = !showFilters"
            :class="[
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border-2',
              showFilters || activeFilterCount > 0
                ? 'bg-accent-brine/10 border-accent-brine/30 text-accent-aged dark:text-accent-brine'
                : 'bg-bg-card dark:bg-dark-card border-bg-secondary dark:border-dark-secondary text-text-secondary dark:text-dark-text-secondary hover:border-accent-brine/30'
            ]"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            <span v-if="activeFilterCount > 0" class="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-accent-ferment rounded-full">
              {{ activeFilterCount }}
            </span>
          </button>

          <p class="text-sm text-text-muted dark:text-dark-text-secondary">
            <span class="font-semibold text-text-primary dark:text-dark-text">{{ sortedRecipes.length }}</span>
            recipe{{ sortedRecipes.length === 1 ? '' : 's' }}
            <span v-if="sortedRecipes.length !== allRecipes.length"> of {{ allRecipes.length }}</span>
          </p>
        </div>

        <!-- Right: Sort + View mode -->
        <div class="flex items-center gap-2">
          <!-- Sort Dropdown -->
          <div class="relative">
            <select
              :value="sortBy"
              @change="sortBy = $event.target.value"
              class="appearance-none bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl px-3 py-2 pr-8 text-sm text-text-secondary dark:text-dark-text-secondary focus:outline-none focus:border-accent-brine cursor-pointer"
            >
              <option v-for="opt in sortOptions" :key="opt.id" :value="opt.id">
                Sort: {{ opt.label }}
              </option>
            </select>
            <svg class="w-4 h-4 text-text-muted absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- Sort Direction -->
          <button
            @click="sortDir = sortDir === 'asc' ? 'desc' : 'asc'"
            class="p-2 rounded-xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary text-text-muted hover:text-text-secondary transition-colors"
            :aria-label="sortDir === 'asc' ? 'Sort descending' : 'Sort ascending'"
          >
            <svg v-if="sortDir === 'asc'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"/></svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"/></svg>
          </button>

          <!-- View Mode Segmented Control -->
          <div class="inline-flex bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary rounded-xl p-0.5">
            <button
              v-for="vm in viewModes"
              :key="vm.id"
              @click="setViewMode(vm.id)"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                localViewMode === vm.id
                  ? 'bg-accent-brine text-white shadow-warm'
                  : 'text-text-muted hover:text-text-secondary dark:text-dark-text-secondary'
              ]"
              :aria-label="vm.label + ' view'"
            >
              <!-- Grid icon -->
              <svg v-if="vm.icon === 'grid'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <!-- List icon -->
              <svg v-if="vm.icon === 'list'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <!-- Table icon -->
              <svg v-if="vm.icon === 'table'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18M3 6h18M3 18h18M10 6v12M17 6v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Panel -->
      <div v-show="showFilters" class="transition-all duration-300">
        <div class="lg:flex lg:gap-6">
          <div class="lg:w-72 lg:flex-shrink-0 mb-4 lg:mb-0">
            <filter-panel
              :filters="filters"
              :recipe-count="sortedRecipes.length"
              :total-count="allRecipes.length"
              @update:filters="onFiltersUpdate"
              @close="showFilters = false"
            ></filter-panel>
          </div>
          <div class="flex-1">
            <!-- Recipes shown inline on large screens when filter is open -->
          </div>
        </div>
      </div>

      <!-- Recipe Grid: Cards -->
      <div v-if="localViewMode === 'cards' && sortedRecipes.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <recipe-card
          v-for="recipe in sortedRecipes"
          :key="recipe.id"
          :recipe="recipe"
          view-mode="card"
          :pantry-match="pantryMatches[recipe.id] || null"
          :is-favorite="isFavorite(recipe)"
          :is-bookmarked="isBookmarked(recipe)"
          @open="$emit('open-recipe', $event)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
          @toggle-bookmark="$emit('toggle-bookmark', $event)"
          @start-batch="$emit('start-batch', $event)"
        ></recipe-card>
      </div>

      <!-- Recipe List -->
      <div v-if="localViewMode === 'list' && sortedRecipes.length > 0"
        class="space-y-2"
      >
        <recipe-card
          v-for="recipe in sortedRecipes"
          :key="recipe.id"
          :recipe="recipe"
          view-mode="list"
          :pantry-match="pantryMatches[recipe.id] || null"
          :is-favorite="isFavorite(recipe)"
          :is-bookmarked="isBookmarked(recipe)"
          @open="$emit('open-recipe', $event)"
          @toggle-favorite="$emit('toggle-favorite', $event)"
          @toggle-bookmark="$emit('toggle-bookmark', $event)"
          @start-batch="$emit('start-batch', $event)"
        ></recipe-card>
      </div>

      <!-- Recipe Table -->
      <div v-if="localViewMode === 'table' && sortedRecipes.length > 0"
        class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary/50 overflow-hidden"
      >
        <div class="overflow-x-auto">
          <table class="recipe-table w-full text-left">
            <thead>
              <tr class="border-b-2 border-bg-secondary dark:border-dark-secondary">
                <th @click="toggleTableSort('name')"
                    :class="['px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider', sortBy === 'name' ? 'sorted text-accent-brine' : '']">
                  Name <span class="sort-indicator">{{ sortBy === 'name' ? (sortDir === 'asc' ? '\\u25B2' : '\\u25BC') : '' }}</span>
                </th>
                <th @click="toggleTableSort('region')"
                    :class="['px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider', sortBy === 'region' ? 'sorted text-accent-brine' : '']">
                  Origin <span class="sort-indicator">{{ sortBy === 'region' ? (sortDir === 'asc' ? '\\u25B2' : '\\u25BC') : '' }}</span>
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider">
                  Category
                </th>
                <th @click="toggleTableSort('difficulty')"
                    :class="['px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider', sortBy === 'difficulty' ? 'sorted text-accent-brine' : '']">
                  Tier <span class="sort-indicator">{{ sortBy === 'difficulty' ? (sortDir === 'asc' ? '\\u25B2' : '\\u25BC') : '' }}</span>
                </th>
                <th @click="toggleTableSort('time')"
                    :class="['px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider', sortBy === 'time' ? 'sorted text-accent-brine' : '']">
                  Time <span class="sort-indicator">{{ sortBy === 'time' ? (sortDir === 'asc' ? '\\u25B2' : '\\u25BC') : '' }}</span>
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider">
                  Ingr.
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider">
                  Technique
                </th>
                <th class="px-4 py-3 text-xs font-semibold text-text-muted dark:text-dark-text-secondary uppercase tracking-wider w-20">
                </th>
              </tr>
            </thead>
            <tbody>
              <recipe-card
                v-for="recipe in sortedRecipes"
                :key="recipe.id"
                :recipe="recipe"
                view-mode="table"
                :pantry-match="pantryMatches[recipe.id] || null"
                :is-favorite="isFavorite(recipe)"
                :is-bookmarked="isBookmarked(recipe)"
                @open="$emit('open-recipe', $event)"
                @toggle-favorite="$emit('toggle-favorite', $event)"
                @toggle-bookmark="$emit('toggle-bookmark', $event)"
                @start-batch="$emit('start-batch', $event)"
              ></recipe-card>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="sortedRecipes.length === 0"
        class="text-center py-16"
      >
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-bg-secondary dark:bg-dark-secondary mb-4">
          <span class="text-4xl">🫙</span>
        </div>
        <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2">
          No recipes found
        </h3>
        <p class="text-text-muted dark:text-dark-text-secondary max-w-md mx-auto mb-6">
          <span v-if="searchQuery">No recipes match "{{ searchQuery }}". Try different keywords or check your spelling.</span>
          <span v-else-if="activeFilterCount > 0">No recipes match your current filters. Try loosening some constraints.</span>
          <span v-else>It looks like there are no recipes loaded yet. Check back soon!</span>
        </p>
        <div class="flex items-center justify-center gap-3">
          <button
            v-if="searchQuery"
            @click="searchQuery = ''; onSearchUpdate('')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-accent-brine/10 hover:bg-accent-brine/20 text-accent-aged dark:text-accent-brine rounded-xl text-sm font-medium transition-colors"
          >
            Clear Search
          </button>
          <button
            v-if="activeFilterCount > 0"
            @click="onFiltersUpdate({ difficulty: [], categories: [], techniques: [], regions: [], maxDays: 365, dietary: [], pantryMatch: false })"
            class="inline-flex items-center gap-2 px-4 py-2 bg-accent-ferment/10 hover:bg-accent-ferment/20 text-accent-ferment rounded-xl text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  `
};
