/**
 * FERMENT — Pantry ↔ Recipe Matching
 * Powers the "What Can I Make?" feature
 */

const FermentMatching = {
  /**
   * Check how well a pantry matches a recipe's ingredients
   * Returns { matched, missing, substitutable, score, canMake }
   */
  matchRecipe(recipe, pantry, userRegion) {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return { matched: [], missing: [], substitutable: [], score: 1, canMake: true };
    }

    const pantryNames = new Set(pantry.map(p => p.name.toLowerCase().trim()));
    const matched = [];
    const missing = [];
    const substitutable = [];

    for (const ing of recipe.ingredients) {
      if (!ing.essential) continue; // Skip optional ingredients

      const ingName = ing.name.toLowerCase().trim();

      if (pantryNames.has(ingName)) {
        matched.push(ing);
      } else {
        // Check substitutions
        const hasSub = (ing.substitutions || []).some(sub =>
          pantryNames.has(sub.name.toLowerCase().trim())
        );
        if (hasSub) {
          substitutable.push(ing);
        } else {
          missing.push(ing);
        }
      }
    }

    const essentialCount = recipe.ingredients.filter(i => i.essential).length;
    const score = essentialCount > 0 ? (matched.length + substitutable.length * 0.8) / essentialCount : 1;

    return {
      matched,
      missing,
      substitutable,
      score,
      canMake: missing.length === 0,
      missingCount: missing.length,
    };
  },

  /**
   * Get recipes sorted by pantry match
   */
  sortByMatch(recipes, pantry, userRegion) {
    return recipes.map(recipe => ({
      recipe,
      match: this.matchRecipe(recipe, pantry, userRegion),
    }))
    .sort((a, b) => b.match.score - a.match.score);
  },

  /**
   * Filter recipes by match criteria
   */
  filterByMatch(recipes, pantry, mode, userRegion) {
    const matched = this.sortByMatch(recipes, pantry, userRegion);

    switch (mode) {
      case 'exact':
        return matched.filter(m => m.match.canMake).map(m => m.recipe);
      case 'missing-1-2':
        return matched.filter(m => m.match.missingCount <= 2).map(m => m.recipe);
      case 'acquirable':
        return matched.filter(m => {
          if (m.match.canMake) return true;
          // Check if missing items are easily acquirable in user's region
          return m.match.missing.every(ing => {
            const avail = ing.localAvailability && ing.localAvailability[userRegion];
            return avail && (avail.ease === 'easy' || avail.ease === 'trivial' || avail.ease === 'moderate');
          });
        }).map(m => m.recipe);
      default:
        return matched.map(m => m.recipe);
    }
  },

  /**
   * Generate shopping list for a recipe based on pantry
   */
  generateShoppingList(recipe, pantry) {
    const match = this.matchRecipe(recipe, pantry);
    return match.missing.map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      category: ing.category,
      substitutions: ing.substitutions || [],
    }));
  },

  /**
   * Check if a pantry item is expiring soon (within days)
   */
  expiringItems(pantry, withinDays = 3) {
    const now = new Date();
    return pantry.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const diffDays = (expiry - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= withinDays;
    });
  },

  /**
   * Suggest recipes based on expiring pantry items
   */
  suggestForExpiring(recipes, pantry) {
    const expiring = this.expiringItems(pantry, 5);
    if (expiring.length === 0) return [];

    const expiringNames = new Set(expiring.map(e => e.name.toLowerCase()));

    return recipes.filter(recipe =>
      (recipe.ingredients || []).some(ing =>
        expiringNames.has(ing.name.toLowerCase())
      )
    );
  }
};
