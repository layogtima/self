/**
 * FERMENT - Search Engine
 * Fuzzy full-text search across recipes
 */

const FermentSearch = {
  /**
   * Build a searchable index from recipes
   */
  buildIndex(recipes) {
    return recipes.map(r => ({
      id: r.id,
      text: [
        r.name,
        r.nameLocal || '',
        r.nameRomanized || '',
        r.subtitle || '',
        r.category || '',
        r.subcategory || '',
        r.region || '',
        r.country || '',
        r.culturalGroup || '',
        r.technique || '',
        r.tldr || '',
        ...(r.tags || []),
        ...(r.ingredients || []).map(i => i.name),
        ...(r.ingredients || []).map(i => i.nameLocal || ''),
        (r.culturalContext || {}).story || '',
        (r.culturalContext || {}).funFact || '',
        ...(r.variations || []).map(v => v.name),
        ...(r.dietaryFlags || []),
      ].join(' ').toLowerCase()
    }));
  },

  /**
   * Simple fuzzy search - returns matching recipe IDs sorted by relevance
   */
  search(query, index) {
    if (!query || !query.trim()) return null; // null means "no filter"

    const terms = query.toLowerCase().trim().split(/\s+/);

    const results = index
      .map(entry => {
        let score = 0;
        for (const term of terms) {
          if (entry.text.includes(term)) {
            // Exact word boundary match scores higher
            const regex = new RegExp('\\b' + term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
            if (regex.test(entry.text)) {
              score += 10;
            } else {
              score += 5;
            }
          } else {
            // Partial / fuzzy match
            const fuzzyScore = this.fuzzyMatch(term, entry.text);
            if (fuzzyScore > 0.6) {
              score += fuzzyScore * 3;
            }
          }
        }
        return { id: entry.id, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score);

    return results.map(r => r.id);
  },

  /**
   * Simple fuzzy matching - returns 0..1 similarity score
   */
  fuzzyMatch(needle, haystack) {
    if (haystack.includes(needle)) return 1;

    let score = 0;
    let lastIndex = -1;
    let consecutive = 0;

    for (let i = 0; i < needle.length; i++) {
      const idx = haystack.indexOf(needle[i], lastIndex + 1);
      if (idx === -1) continue;

      score++;
      if (idx === lastIndex + 1) {
        consecutive++;
        score += consecutive * 0.5;
      } else {
        consecutive = 0;
      }
      lastIndex = idx;
    }

    return score / (needle.length * 2);
  },

  /**
   * Debounce helper
   */
  debounce(fn, delay = 250) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};
