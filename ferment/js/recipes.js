/**
 * FERMENT - Recipe Loader
 * Loads individual recipe JSON files from data/recipes/individual/
 * Falls back to window.__fermentRecipes (tier*.js) if fetch fails
 */

const FermentRecipes = {
  _recipes: [],
  _loaded: false,

  /**
   * Load recipes from individual JSON files via manifest.
   * Falls back to window.__fermentRecipes if available.
   */
  async load() {
    if (this._loaded) return this._recipes;

    try {
      const manifestRes = await fetch('data/recipes/manifest.json');
      if (!manifestRes.ok) throw new Error('Manifest not found');
      const manifest = await manifestRes.json();

      const results = await Promise.allSettled(
        manifest.recipes.map(entry =>
          fetch(`data/recipes/individual/${entry.file}`)
            .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
        )
      );

      this._recipes = results
        .filter(r => r.status === 'fulfilled')
        .map(r => this._normalizeRecipe(r.value));

      if (this._recipes.length > 0) {
        this._loaded = true;
        console.log(`[FERMENT] Loaded ${this._recipes.length} recipes from individual JSON files`);
        return this._recipes;
      }
    } catch (e) {
      console.warn('[FERMENT] JSON fetch failed, falling back to script-loaded recipes:', e.message);
    }

    // Fallback to script-loaded recipes
    if (window.__fermentRecipes && window.__fermentRecipes.length > 0) {
      this._recipes = window.__fermentRecipes.map(r => this._normalizeRecipe(r));
      this._loaded = true;
      console.log(`[FERMENT] Loaded ${this._recipes.length} recipes from fallback (tier*.js)`);
    }

    return this._recipes;
  },

  /**
   * Normalize recipe to ensure new schema fields exist,
   * supporting both old format (images object, video singular) and new format.
   */
  _normalizeRecipe(recipe) {
    const r = { ...recipe };

    // Normalize images: old { hero, heroAttribution } → new array format
    if (r.images && !Array.isArray(r.images)) {
      const old = r.images;
      r.images = [];
      if (old.hero) {
        r.images.push({
          url: old.hero,
          caption: r.name,
          attribution: old.heroAttribution || '',
          type: 'hero',
          alt: `${r.name} - ${r.subtitle || ''}`
        });
      }
    }
    if (!r.images) r.images = [];

    // Normalize video → videos array
    if (r.video && !r.videos) {
      r.videos = [{
        url: r.video.url,
        title: r.video.title,
        channel: r.video.channel,
        type: r.video.url && r.video.url.includes('youtube') ? 'youtube' : 'local'
      }];
      delete r.video;
    }
    if (!r.videos) r.videos = [];

    // Ensure citations array
    if (!r.citations) r.citations = [];

    // Backward-compatible accessors for templates using old schema
    // recipe.images.hero still works via a Proxy-like plain object
    const heroImg = r.images.find(i => i.type === 'hero') || r.images[0];
    if (heroImg && !r._imagesCompat) {
      // Keep array but add .hero and .heroAttribution getters
      Object.defineProperty(r.images, 'hero', {
        get() { return heroImg ? heroImg.url : null; },
        enumerable: false, configurable: true
      });
      Object.defineProperty(r.images, 'heroAttribution', {
        get() { return heroImg ? heroImg.attribution : ''; },
        enumerable: false, configurable: true
      });
      r._imagesCompat = true;
    }

    // Backward-compatible: recipe.video still works
    if (r.videos.length > 0 && !r.video) {
      Object.defineProperty(r, 'video', {
        get() { return r.videos[0] || null; },
        enumerable: false, configurable: true
      });
    }

    return r;
  },

  getAll() {
    return this._recipes;
  },

  getById(id) {
    return this._recipes.find(r => r.id === id) || null;
  },

  getBySlug(slug) {
    return this._recipes.find(r => r.slug === slug) || null;
  },

  getByCategory(category) {
    return this._recipes.filter(r => r.category === category);
  },

  getByTier(tier) {
    return this._recipes.filter(r => r.tier === tier);
  },
};
