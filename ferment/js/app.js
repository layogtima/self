/**
 * FERMENT - Main Application
 * Vue 3 app initialization, state management, routing
 */

const { createApp, ref, reactive, computed, watch, onMounted, nextTick } = Vue;

const app = createApp({
  setup() {
    // ── Load persisted state ──
    const stored = FermentStore.load();

    const ready = ref(false);
    const currentTab = ref('browse');
    const currentRoute = ref(stored.settings.hasSeenWelcome ? 'home' : 'welcome');
    const viewMode = ref(stored.settings.defaultView || 'cards');
    const selectedRecipe = ref(null);
    const showSettings = ref(false);
    const searchQuery = ref('');

    // ── Contextual (secondary) nav - screen-specific tabs above mobile nav ──
    const contextualNavTabs = ref([]);
    const contextualNavActive = ref('');

    function setContextualNav(tabs, active) {
      contextualNavTabs.value = tabs || [];
      contextualNavActive.value = active || (tabs && tabs.length ? tabs[0].id : '');
    }

    function clearContextualNav() {
      contextualNavTabs.value = [];
      contextualNavActive.value = '';
    }

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

    // ── Wiki state ──
    const wikiArticles = ref([]);
    const wikiLoaded = ref(false);
    const selectedWikiArticle = ref(null);

    // ── Tabs ──
    const tabs = [
      { id: 'browse', label: 'Browse' },
      { id: 'wiki', label: 'Wiki' },
      { id: 'pantry', label: 'Pantry' },
      { id: 'journal', label: 'Journal' },
      { id: 'tools', label: 'Tools' },
    ];

    // ── All recipes (loaded async from individual JSON files) ──
    const recipesLoaded = ref(false);
    const allRecipes = computed(() => {
      return recipesLoaded.value ? FermentRecipes.getAll() : [];
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
          const unit = (r.fermentTimeUnit || 'days').replace(/s$/, '');
          const min = r.fermentTimeMin;
          if (min == null) return true;
          const minDays = unit === 'hour' ? min / 24
            : unit === 'week' ? min * 7
            : unit === 'month' ? min * 30
            : unit === 'year' ? min * 365
            : min;
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
    function enterApp() {
      settings.hasSeenWelcome = true;
      currentRoute.value = 'home';
      persist();
    }

    function showWelcome() {
      currentRoute.value = 'welcome';
      window.scrollTo({ top: 0 });
    }

    function updateFilters(newFilters) {
      Object.assign(filters, newFilters);
    }

    function openRecipe(recipe) {
      selectedRecipe.value = recipe;
      currentRoute.value = 'recipe';
      pushHistory({ route: 'recipe', recipeId: recipe.id, recipeSlug: recipe.slug || recipe.id });
      updateRecipeMeta(recipe);
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

    function closeRecipe() {
      selectedRecipe.value = null;
      currentRoute.value = 'home';
      updateMeta();
      if (!suppressPopState) {
        history.back();
      }
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
          try {
            const d = new Date();
            const maxVal = recipe.fermentTimeMax || recipe.fermentTimeMin || 14;
            const days = recipe.fermentTimeUnit === 'months'
              ? maxVal * 30
              : recipe.fermentTimeUnit === 'weeks'
                ? maxVal * 7
                : maxVal;
            d.setDate(d.getDate() + (Number.isFinite(days) ? days : 14));
            return d.toISOString().slice(0, 10);
          } catch (e) {
            const d = new Date();
            d.setDate(d.getDate() + 14);
            return d.toISOString().slice(0, 10);
          }
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
      if (selectedRecipe.value) closeRecipe();
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

    // ── Wiki navigation ──
    function openWikiArticle(article) {
      selectedWikiArticle.value = article;
      currentTab.value = 'wiki';
      currentRoute.value = 'wiki-article';
      pushHistory({ route: 'wiki-article', articleId: article.id, articleSlug: article.slug || article.id });
      updateWikiMeta(article);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function closeWikiArticle() {
      selectedWikiArticle.value = null;
      currentRoute.value = 'home';
      currentTab.value = 'wiki';
      updateMeta();
      if (!suppressPopState) {
        history.back();
      }
    }

    function openRecipeFromWiki(recipe) {
      openRecipe(recipe);
    }

    // ── Changelog navigation ──
    function openChangelog() {
      currentRoute.value = 'changelog';
      pushHistory({ route: 'changelog' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function closeChangelog() {
      currentRoute.value = 'home';
      updateMeta();
      if (!suppressPopState) {
        history.back();
      }
    }

    // ── Meta tag management for OG/sharing ──
    const defaultMeta = {
      title: 'FERMENT - Your Fermentation Companion',
      description: 'A cultural guide to lactic acid fermentation from around the world. Browse recipes, track batches, and master the ancient art of fermentation.',
      image: '',
    };

    function updateMeta(opts = {}) {
      const title = opts.title || defaultMeta.title;
      const desc = opts.description || defaultMeta.description;
      const image = opts.image || defaultMeta.image;
      const type = opts.type || 'website';

      document.title = title;
      const setContent = (id, val) => { const el = document.getElementById(id); if (el) el.setAttribute('content', val); };
      setContent('meta-description', desc);
      setContent('og-type', type);
      setContent('og-title', title);
      setContent('og-description', desc);
      setContent('og-image', image);
      setContent('twitter-title', title);
      setContent('twitter-description', desc);
      setContent('twitter-image', image);
    }

    function updateRecipeMeta(recipe) {
      if (!recipe) { updateMeta(); return; }
      const imgs = recipe.images;
      let heroUrl = '';
      if (Array.isArray(imgs)) {
        const hero = imgs.find(i => i.type === 'hero');
        heroUrl = hero ? hero.url : '';
      } else if (imgs) {
        heroUrl = imgs.hero || '';
      }
      const timeStr = recipe.totalTimeHuman || (recipe.fermentTimeMin ? recipe.fermentTimeMin + '-' + (recipe.fermentTimeMax || '') + ' ' + (recipe.fermentTimeUnit || 'days') : '');
      const desc = recipe.tldr || (recipe.name + (recipe.country ? ' from ' + recipe.country : '') + (timeStr ? '. Ferment time: ' + timeStr : '') + '. ' + (recipe.ingredients || []).length + ' ingredients.');
      updateMeta({
        title: recipe.name + ' - FERMENT',
        description: desc,
        image: heroUrl,
        type: 'article',
      });
    }

    function updateWikiMeta(article) {
      if (!article) { updateMeta(); return; }
      const desc = article.subtitle || article.title + ' - Fermentation wiki article with ' + (article.citations || []).length + ' citations.';
      // Generate a simple OG image using an SVG data URI for wiki articles
      const icon = wikiArticleIcon(article.id);
      const svgOg = generateWikiOgImage(article.title, icon);
      updateMeta({
        title: article.title + ' - FERMENT Wiki',
        description: desc,
        image: svgOg,
        type: 'article',
      });
    }

    function wikiArticleIcon(id) {
      const icons = {
        'how-lacto-fermentation-works': '🧪', 'lactic-acid-bacteria': '🦠', 'role-of-carbon-dioxide': '💨',
        'ph-levels-fermentation': '📊', 'salt-and-fermentation': '🧂', 'temperature-and-fermentation': '🌡️',
        'troubleshooting-ferments': '🔍', 'fermentation-traditions-worldwide': '🌍',
        'aromatics-spices-herbs-in-fermentation': '🌿', 'fermentation-tools-through-history': '🏺',
        'water-quality-and-fermentation': '💧', 'fermented-foods-around-your-kitchen': '🍽️',
        'best-vegetables-fruits-to-ferment': '🥬', 'dehydrating-and-fermenting': '☀️',
        'fermentation-and-food-safety': '🛡️', 'fermentation-flavour-chart': '🎨',
        'second-ferments-and-flavouring': '🍋', 'what-to-do-with-leftover-brine': '🫗',
        'health-benefits-of-fermented-foods': '💪', 'mold-vs-kahm-when-to-worry': '🔬',
        'modern-fermentation-equipment': '⚙️', 'scaling-fermentation-batches': '📐',
        'storing-and-preserving-ferments': '❄️',
      };
      return icons[id] || '📖';
    }

    function generateWikiOgImage(title, icon) {
      // SVG-based OG image (1200x630) encoded as data URI
      const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
        <rect fill="#FAF7F2" width="1200" height="630"/>
        <rect fill="#C4A35A" x="0" y="0" width="1200" height="6"/>
        <text x="600" y="240" text-anchor="middle" font-size="80" font-family="serif">${icon}</text>
        <text x="600" y="340" text-anchor="middle" font-size="42" font-family="Georgia,serif" fill="#2C1810" font-weight="bold">${escaped}</text>
        <text x="600" y="400" text-anchor="middle" font-size="22" font-family="sans-serif" fill="#A89485">FERMENT Wiki</text>
        <text x="600" y="580" text-anchor="middle" font-size="18" font-family="sans-serif" fill="#C4A35A">🫙 FERMENT - Your Fermentation Companion</text>
      </svg>`;
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    // ── Browser History Management ──
    let suppressPopState = false;

    function pushHistory(state) {
      if (suppressPopState) return;
      const url = new URL(window.location);
      // Build a descriptive hash
      if (state.route === 'recipe' && state.recipeSlug) {
        url.hash = '#/recipe/' + state.recipeSlug;
      } else if (state.route === 'wiki-article' && state.articleSlug) {
        url.hash = '#/wiki/' + state.articleSlug;
      } else if (state.route === 'changelog') {
        url.hash = '#/changelog';
      } else if (state.tab) {
        url.hash = state.tab === 'browse' ? '#/' : '#/' + state.tab;
      } else {
        url.hash = '#/';
      }
      history.pushState(
        { route: state.route || 'home', tab: state.tab || currentTab.value, recipeId: state.recipeId, articleId: state.articleId },
        '',
        url
      );
    }

    function handlePopState(e) {
      suppressPopState = true;
      const state = e.state;
      if (!state) {
        // No state - go to home/browse
        selectedRecipe.value = null;
        selectedWikiArticle.value = null;
        showSettings.value = false;
        currentRoute.value = 'home';
        currentTab.value = 'browse';
        suppressPopState = false;
        return;
      }

      // Close settings if open
      showSettings.value = false;

      if (state.route === 'recipe' && state.recipeId) {
        const recipe = allRecipes.value.find(r => r.id === state.recipeId);
        if (recipe) {
          selectedRecipe.value = recipe;
          currentRoute.value = 'recipe';
          updateRecipeMeta(recipe);
        } else {
          currentRoute.value = 'home';
          currentTab.value = state.tab || 'browse';
          updateMeta();
        }
      } else if (state.route === 'wiki-article' && state.articleId) {
        const article = wikiArticles.value.find(a => a.id === state.articleId);
        if (article) {
          selectedWikiArticle.value = article;
          currentRoute.value = 'wiki-article';
          currentTab.value = 'wiki';
          updateWikiMeta(article);
        } else {
          currentRoute.value = 'home';
          currentTab.value = 'wiki';
          updateMeta();
        }
      } else if (state.route === 'changelog') {
        currentRoute.value = 'changelog';
      } else {
        selectedRecipe.value = null;
        selectedWikiArticle.value = null;
        currentRoute.value = state.route || 'home';
        currentTab.value = state.tab || 'browse';
        updateMeta();
      }
      suppressPopState = false;
    }

    // ── Lifecycle ──
    onMounted(async () => {
      try {
        applyTheme();

        // Listen for browser back/forward
        window.addEventListener('popstate', handlePopState);

        // Load recipes and wiki articles in parallel
        await Promise.all([
          FermentRecipes.load(),
          FermentWiki.load(),
        ]);
        recipesLoaded.value = true;
        wikiArticles.value = FermentWiki.getAll();
        wikiLoaded.value = true;

        // Restore navigation from hash URL (enables sharing)
        const hash = window.location.hash;
        if (hash) {
          const recipeMatch = hash.match(/^#\/recipe\/(.+)$/);
          const wikiMatch = hash.match(/^#\/wiki\/(.+)$/);
          const tabMatch = hash.match(/^#\/(\w+)$/);
          if (recipeMatch) {
            const slug = recipeMatch[1];
            const recipe = allRecipes.value.find(r => (r.slug || r.id) === slug);
            if (recipe) {
              selectedRecipe.value = recipe;
              currentRoute.value = 'recipe';
              updateRecipeMeta(recipe);
            }
          } else if (wikiMatch) {
            const slug = wikiMatch[1];
            const article = wikiArticles.value.find(a => (a.slug || a.id) === slug);
            if (article) {
              selectedWikiArticle.value = article;
              currentTab.value = 'wiki';
              currentRoute.value = 'wiki-article';
              updateWikiMeta(article);
            }
          } else if (tabMatch && tabMatch[1] === 'changelog') {
            currentRoute.value = 'changelog';
          } else if (tabMatch && ['browse', 'wiki', 'pantry', 'journal', 'tools'].includes(tabMatch[1])) {
            currentTab.value = tabMatch[1];
          }
        }

        // Set initial history state
        history.replaceState({ route: currentRoute.value, tab: currentTab.value, recipeId: selectedRecipe.value?.id, articleId: selectedWikiArticle.value?.id }, '', window.location);
      } catch (e) {
        console.error('[FERMENT] Mount failed:', e);
      } finally {
        ready.value = true;
      }
    });

    // Auto-persist on tab change + push history
    watch(currentTab, (tab) => {
      persist();
      if (!suppressPopState && currentRoute.value === 'home') {
        pushHistory({ tab, route: 'home' });
      }
    });

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
      closeRecipe,
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
      enterApp,
      showWelcome,
      wikiArticles,
      wikiLoaded,
      selectedWikiArticle,
      openWikiArticle,
      closeWikiArticle,
      openRecipeFromWiki,
      openChangelog,
      closeChangelog,
      contextualNavTabs,
      contextualNavActive,
      setContextualNav,
      clearContextualNav,
    };
  }
});

// ── Register Components ──
app.component('search-bar', SearchBarComponent);
app.component('filter-panel', FilterPanelComponent);
app.component('recipe-card', RecipeCardComponent);
app.component('browse-view', BrowseViewComponent);
app.component('recipe-page', RecipePageComponent);
app.component('pantry-manager', PantryManagerComponent);
app.component('journal-manager', JournalManagerComponent);
app.component('brine-calculator', BrineCalculatorComponent);
app.component('batch-scaler', BatchScalerComponent);
app.component('timer-manager', TimerManagerComponent);
app.component('tools-view', ToolsViewComponent);
app.component('settings-modal', SettingsModalComponent);
app.component('onboarding-modal', OnboardingModalComponent);
app.component('welcome-page', WelcomePageComponent);
app.component('wiki-view', WikiViewComponent);
app.component('wiki-article', WikiArticleComponent);
app.component('text-editor', TextEditorComponent);
app.component('list-editor', ListEditorComponent);
app.component('media-picker', MediaPickerComponent);
app.component('tag-editor', TagEditorComponent);
app.component('citation-editor', CitationEditorComponent);
app.component('changelog-view', ChangelogViewComponent);

// Expose FermentFormat to all Vue templates
// (const declarations don't become window properties, so Vue's template
// compiler can't find them via _ctx without this explicit registration)
app.config.globalProperties.FermentFormat = FermentFormat;

// Global error handler - catch-all for unhandled Vue errors
app.config.errorHandler = (err, _vm, info) => {
  console.error('[FERMENT] Unhandled error:', info, err);
};

// Mount the app
app.mount('#app');
