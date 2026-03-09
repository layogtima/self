/**
 * FERMENT — Recipe Loader
 * Recipes live in ferment/data/recipes/tier*.js
 * Each file pushes into window.__fermentRecipes
 */

const FermentRecipes = {
  getAll() {
    return window.__fermentRecipes || [];
  },

  getById(id) {
    return this.getAll().find(r => r.id === id) || null;
  },

  getBySlug(slug) {
    return this.getAll().find(r => r.slug === slug) || null;
  },

  getByCategory(category) {
    return this.getAll().filter(r => r.category === category);
  },

  getByTier(tier) {
    return this.getAll().filter(r => r.tier === tier);
  },
};
