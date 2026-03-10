/* THE FERMENT ALCHEMIST — Recipe Bridge
   Fetches real recipe data from the parent ferment app for authenticity */

const RecipeBridge = {
  _recipes: [],
  _loaded: false,
  _basePath: '../data/recipes/',

  async load() {
    if (this._loaded) return this._recipes;

    try {
      const manifestRes = await fetch(this._basePath + 'manifest.json');
      if (!manifestRes.ok) throw new Error(`Manifest fetch failed: ${manifestRes.status}`);
      const manifest = await manifestRes.json();

      const recipes = await Promise.allSettled(
        manifest.recipes.map(async (entry) => {
          const res = await fetch(this._basePath + 'individual/' + entry.file);
          if (!res.ok) return null;
          return res.json();
        })
      );

      this._recipes = recipes
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);

      this._loaded = true;
      console.log(`[RecipeBridge] Loaded ${this._recipes.length} recipes`);
      return this._recipes;
    } catch (e) {
      console.warn('[RecipeBridge] Failed to load recipes, using built-in data only:', e);
      this._recipes = [];
      this._loaded = true;
      return [];
    }
  },

  getAll() {
    return this._recipes;
  },

  getBySlug(slug) {
    return this._recipes.find(r => r.slug === slug);
  },

  getByTechnique(technique) {
    return this._recipes.filter(r => r.technique === technique);
  },

  getByCategory(category) {
    return this._recipes.filter(r => r.category === category);
  },

  getByDifficulty(minDiff, maxDiff) {
    return this._recipes.filter(r => r.difficulty >= minDiff && r.difficulty <= maxDiff);
  },

  // Extract unique ingredients across all recipes for game ingredient DB enrichment
  extractIngredients() {
    const seen = new Map();
    for (const recipe of this._recipes) {
      if (!recipe.ingredients) continue;
      for (const ing of recipe.ingredients) {
        if (!seen.has(ing.name.toLowerCase())) {
          seen.set(ing.name.toLowerCase(), {
            name: ing.name,
            nameLocal: ing.nameLocal,
            category: ing.category,
            essential: ing.essential,
          });
        }
      }
    }
    return Array.from(seen.values());
  },

  // Find closest matching recipe to a set of player choices
  findClosestMatch(playerChoices) {
    let bestMatch = null;
    let bestScore = -1;

    for (const recipe of this._recipes) {
      if (!recipe.ingredients) continue;
      let score = 0;
      const recipeIngNames = recipe.ingredients.map(i => i.name.toLowerCase());

      // Ingredient overlap
      for (const ing of (playerChoices.ingredients || [])) {
        if (recipeIngNames.includes(ing.toLowerCase())) score += 10;
      }

      // Technique match
      if (playerChoices.technique && recipe.technique === playerChoices.technique) score += 20;

      // Category match
      if (playerChoices.category && recipe.category === playerChoices.category) score += 5;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = recipe;
      }
    }

    return bestMatch ? { recipe: bestMatch, score: bestScore } : null;
  }
};

window.RecipeBridge = RecipeBridge;
