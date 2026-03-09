/**
 * FERMENT — Main Application
 * Vue 3 app initialization, state management, routing
 */

const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  setup() {
    // ── Load persisted state ──
    const stored = FermentStore.load();

    const ready = ref(false);
    const currentTab = ref('browse');
    const currentRoute = ref('home');
    const viewMode = ref(stored.settings.defaultView || 'cards');
    const selectedRecipe = ref(null);
    const showSettings = ref(false);
    const searchQuery = ref('');

    // ── Core state ──
    const settings = reactive({ ...stored.settings });
    const pantry = reactive(stored.pantry || []);
    const journal = reactive({
      batches: stored.journal?.batches || [],
      stats: { ...stored.journal?.stats },
    });
    const shoppingList = reactive(stored.shoppingList || []);
    const favorites = reactive(stored.favorites || []);
    const bookmarks = reactive(stored.bookmarks || []);
    const recipeNotes = reactive(stored.recipeNotes || {});
    const recentlyViewed = reactive(stored.recentlyViewed || []);
    const userLevel = reactive({ ...stored.userLevel });

    // ── Filters ──
    const filters = reactive({
      difficulty: [],
      category: [],
      technique: [],
      region: [],
      maxDays: null,
      dietary: [],
      pantryMatch: null, // null | 'exact' | 'missing-1-2' | 'acquirable'
      searchQuery: '',
    });

    // ── Tabs ──
    const tabs = [
      { id: 'browse', label: 'Browse' },
      { id: 'pantry', label: 'Pantry' },
      { id: 'journal', label: 'Journal' },
      { id: 'tools', label: 'Tools' },
    ];

    // ── All recipes ──
    const allRecipes = computed(() => {
      return FermentRecipes.getAll();
    });

    // ── Search index ──
    const searchIndex = computed(() => {
      return FermentSearch.buildIndex(allRecipes.value);
    });

    // ── Filtered recipes ──
    const filteredRecipes = computed(() => {
      let recipes = [...allRecipes.value];

      // Text search
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const matchIds = FermentSearch.search(filters.searchQuery, searchIndex.value);
        if (matchIds) {
          const idSet = new Set(matchIds);
          recipes = recipes.filter(r => idSet.has(r.id));
          // Sort by search relevance
          recipes.sort((a, b) => matchIds.indexOf(a.id) - matchIds.indexOf(b.id));
        }
      }

      // Difficulty filter
      if (filters.difficulty.length > 0) {
        recipes = recipes.filter(r => filters.difficulty.includes(r.difficulty));
      }

      // Category filter
      if (filters.category.length > 0) {
        recipes = recipes.filter(r => filters.category.includes(r.category));
      }

      // Technique filter
      if (filters.technique.length > 0) {
        recipes = recipes.filter(r => filters.technique.includes(r.technique));
      }

      // Region filter
      if (filters.region.length > 0) {
        recipes = recipes.filter(r => filters.region.includes(r.region));
      }

      // Max ferment days
      if (filters.maxDays !== null && filters.maxDays > 0) {
        recipes = recipes.filter(r => {
          const minDays = r.fermentTimeUnit === 'months'
            ? r.fermentTimeMin * 30
            : r.fermentTimeUnit === 'weeks'
              ? r.fermentTimeMin * 7
              : r.fermentTimeMin;
          return minDays <= filters.maxDays;
        });
      }

      // Dietary filter
      if (filters.dietary.length > 0) {
        recipes = recipes.filter(r => {
          const flags = r.dietaryFlags || [];
          return filters.dietary.every(d => {
            if (d === 'vegan') return flags.includes('vegan') || r.veganAdaptable;
            if (d === 'vegetarian') return flags.includes('vegetarian') || flags.includes('vegan') || r.veganAdaptable;
            return flags.includes(d);
          });
        });
      }

      // Pantry matching
      if (filters.pantryMatch && pantry.length > 0) {
        recipes = FermentMatching.filterByMatch(
          recipes, pantry, filters.pantryMatch, settings.region
        );
      }

      return recipes;
    });

    // ── Actions ──
    function updateFilters(newFilters) {
      Object.assign(filters, newFilters);
    }

    function openRecipe(recipe) {
      selectedRecipe.value = recipe;
      // Track recently viewed
      const idx = recentlyViewed.findIndex(r => r.id === recipe.id);
      if (idx > -1) recentlyViewed.splice(idx, 1);
      recentlyViewed.unshift({ id: recipe.id, viewedAt: new Date().toISOString() });
      if (recentlyViewed.length > 50) recentlyViewed.pop();

      // Update user level
      userLevel.recipesViewed = (userLevel.recipesViewed || 0) + 1;
      recalcLevel();
      persist();
    }

    function toggleFavorite(recipeId) {
      const idx = favorites.indexOf(recipeId);
      if (idx > -1) {
        favorites.splice(idx, 1);
      } else {
        favorites.push(recipeId);
      }
      persist();
    }

    function toggleBookmark(recipeId) {
      const idx = bookmarks.indexOf(recipeId);
      if (idx > -1) {
        bookmarks.splice(idx, 1);
      } else {
        bookmarks.push(recipeId);
      }
      persist();
    }

    function updateRecipeNotes({ recipeId, notes, rating, timesMade }) {
      if (!recipeNotes[recipeId]) {
        recipeNotes[recipeId] = {};
      }
      if (notes !== undefined) recipeNotes[recipeId].notes = notes;
      if (rating !== undefined) recipeNotes[recipeId].rating = rating;
      if (timesMade !== undefined) recipeNotes[recipeId].timesMade = timesMade;
      persist();
    }

    function updatePantry(newPantry) {
      pantry.splice(0, pantry.length, ...newPantry);
      persist();
    }

    function addToPantry(item) {
      const existing = pantry.find(p => p.name.toLowerCase() === item.name.toLowerCase());
      if (existing) {
        existing.quantity = (existing.quantity || 0) + (item.quantity || 1);
      } else {
        pantry.push({
          id: FermentFormat.uid(),
          name: item.name,
          category: item.category || 'other',
          quantity: item.quantity || 1,
          unit: item.unit || '',
          dateAdded: new Date().toISOString().slice(0, 10),
          expiryDate: null,
          notes: '',
          source: 'recipe-import',
        });
      }
      persist();
    }

    function updateBatches(newBatches) {
      journal.batches = newBatches;
      // Recalculate stats
      journal.stats.totalBatches = newBatches.length;
      journal.stats.completedBatches = newBatches.filter(b => b.status === 'complete').length;
      journal.stats.failedBatches = newBatches.filter(b => b.status === 'failed').length;
      journal.stats.totalFermentDays = newBatches.reduce((sum, b) => {
        if (b.startDate) {
          const end = b.actualEndDate || new Date().toISOString().slice(0, 10);
          sum += FermentFormat.daysBetween(b.startDate, end);
        }
        return sum;
      }, 0);

      userLevel.batchesStarted = newBatches.length;
      userLevel.batchesCompleted = journal.stats.completedBatches;
      recalcLevel();
      persist();
    }

    function startBatch(recipe) {
      const newBatch = {
        id: 'batch_' + FermentFormat.uid(),
        recipeId: recipe.id,
        recipeName: recipe.name,
        status: 'fermenting',
        startDate: new Date().toISOString().slice(0, 10),
        targetEndDate: (() => {
          const d = new Date();
          const days = recipe.fermentTimeUnit === 'months'
            ? recipe.fermentTimeMax * 30
            : recipe.fermentTimeUnit === 'weeks'
              ? recipe.fermentTimeMax * 7
              : recipe.fermentTimeMax;
          d.setDate(d.getDate() + days);
          return d.toISOString().slice(0, 10);
        })(),
        actualEndDate: null,
        batchSize: '1x',
        entries: [{
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toTimeString().slice(0, 5),
          type: 'start',
          note: 'Batch started!',
          photo: null,
          measurements: { pH: null, temperature: null, tasteSaltiness: null, tasteAcidity: null, tasteFunkiness: null, bubbleActivity: 'none' },
        }],
        outcome: { rating: null, notes: null, wouldMakeAgain: null, modifications: [], photos: { before: null, after: null } },
        tags: [],
      };

      journal.batches.push(newBatch);
      updateBatches([...journal.batches]);
      currentTab.value = 'journal';
      if (selectedRecipe.value) selectedRecipe.value = null;
    }

    function browseMatchingRecipes() {
      filters.pantryMatch = 'missing-1-2';
      currentTab.value = 'browse';
    }

    function toggleTheme() {
      settings.theme = settings.theme === 'dark' ? 'light' : 'dark';
      applyTheme();
      persist();
    }

    function applyTheme() {
      if (settings.theme === 'dark' ||
          (settings.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }

    function updateSettings(newSettings) {
      Object.assign(settings, newSettings);
      applyTheme();
      persist();
    }

    function completeOnboarding(onboardSettings) {
      if (onboardSettings) {
        Object.assign(settings, onboardSettings);
      }
      settings.onboardingComplete = true;
      applyTheme();
      persist();
    }

    function recalcLevel() {
      const calc = FermentStore.calculateLevel(userLevel);
      userLevel.level = calc.level;
      userLevel.title = calc.title;
    }

    function exportData() {
      FermentStore.exportJSON(getState());
    }

    function importData(file) {
      FermentStore.importJSON(file).then(data => {
        Object.assign(settings, data.settings);
        pantry.splice(0, pantry.length, ...(data.pantry || []));
        journal.batches = data.journal?.batches || [];
        journal.stats = { ...data.journal?.stats };
        favorites.splice(0, favorites.length, ...(data.favorites || []));
        bookmarks.splice(0, bookmarks.length, ...(data.bookmarks || []));
        Object.assign(recipeNotes, data.recipeNotes || {});
        Object.assign(userLevel, data.userLevel || {});
        applyTheme();
        persist();
      }).catch(err => {
        console.error('Import failed:', err);
        alert('Failed to import data: ' + err.message);
      });
    }

    function clearData() {
      const fresh = FermentStore.clear();
      Object.assign(settings, fresh.settings);
      pantry.splice(0, pantry.length);
      journal.batches = [];
      journal.stats = { ...fresh.journal.stats };
      favorites.splice(0, favorites.length);
      bookmarks.splice(0, bookmarks.length);
      Object.keys(recipeNotes).forEach(k => delete recipeNotes[k]);
      recentlyViewed.splice(0, recentlyViewed.length);
      Object.assign(userLevel, fresh.userLevel);
      applyTheme();
    }

    function getState() {
      return {
        version: 1,
        settings: { ...settings },
        pantry: [...pantry],
        journal: { batches: [...journal.batches], stats: { ...journal.stats } },
        shoppingList: [...shoppingList],
        favorites: [...favorites],
        bookmarks: [...bookmarks],
        recipeNotes: { ...recipeNotes },
        recentlyViewed: [...recentlyViewed],
        userLevel: { ...userLevel },
        exportedAt: null,
      };
    }

    function persist() {
      FermentStore.save(getState());
    }

    // ── Lifecycle ──
    onMounted(() => {
      applyTheme();
      // Simulate brief loading for smooth startup
      setTimeout(() => { ready.value = true; }, 300);
    });

    // Auto-persist on tab change
    watch(currentTab, () => persist());

    return {
      ready,
      currentTab,
      currentRoute,
      viewMode,
      selectedRecipe,
      showSettings,
      tabs,
      settings,
      pantry,
      journal,
      favorites,
      bookmarks,
      recipeNotes,
      recentlyViewed,
      userLevel,
      filters,
      allRecipes,
      filteredRecipes,
      updateFilters,
      openRecipe,
      toggleFavorite,
      toggleBookmark,
      updateRecipeNotes,
      updatePantry,
      addToPantry,
      updateBatches,
      startBatch,
      browseMatchingRecipes,
      toggleTheme,
      updateSettings,
      completeOnboarding,
      exportData,
      importData,
      clearData,
    };
  }
});

// ── Register Components ──
app.component('search-bar', SearchBarComponent);
app.component('filter-panel', FilterPanelComponent);
app.component('recipe-card', RecipeCardComponent);
app.component('browse-view', BrowseViewComponent);
app.component('recipe-modal', RecipeModalComponent);
app.component('pantry-manager', PantryManagerComponent);
app.component('journal-manager', JournalManagerComponent);
app.component('brine-calculator', BrineCalculatorComponent);
app.component('batch-scaler', BatchScalerComponent);
app.component('timer-manager', TimerManagerComponent);
app.component('tools-view', ToolsViewComponent);
app.component('settings-modal', SettingsModalComponent);
app.component('onboarding-modal', OnboardingModalComponent);

// Mount the app
app.mount('#app');
