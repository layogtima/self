/* THE FERMENT ALCHEMIST — Game Store (localStorage) */

const GameStore = {
  STORAGE_KEY: 'ferment_games_v1',

  defaults() {
    return {
      version: 1,
      settings: {
        theme: 'system',      // 'light' | 'dark' | 'system'
        soundEnabled: true,
        musicEnabled: true,
        difficulty: 'normal',  // 'easy' | 'normal' | 'hard'
        reducedMotion: false,
      },
      story: {
        currentChapter: 1,
        currentLevel: 1,
        levels: {},            // { '1-1': { grade: 'A', score: 87, stars: 2, completed: true }, ... }
        unlockedChapters: [1],
        totalStars: 0,
      },
      endless: {
        highScore: 0,
        longestStreak: 0,
        totalOrdersServed: 0,
        bestGrade: null,
      },
      sandbox: {
        discoveries: [],       // [{ ingredients: [...], technique, result, timestamp }]
        favoriteRecipes: [],
      },
      player: {
        xp: 0,
        level: 1,
        title: 'Salt Apprentice',
        totalOrdersCompleted: 0,
        perfectScores: 0,
        recipesDiscovered: [],
      },
      llm: {
        transcripts: [],       // saved game transcripts for LLM mode
      },
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.defaults();
      const data = JSON.parse(raw);
      // Merge with defaults to handle schema additions
      return this._deepMerge(this.defaults(), data);
    } catch (e) {
      console.warn('[GameStore] Failed to load, using defaults:', e);
      return this.defaults();
    }
  },

  save(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('[GameStore] localStorage quota exceeded. Pruning old transcripts...');
        // Prune LLM transcripts as they can be large
        if (state.llm && state.llm.transcripts.length > 5) {
          state.llm.transcripts = state.llm.transcripts.slice(-5);
          try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state)); }
          catch (e2) { console.error('[GameStore] Still over quota after pruning:', e2); }
        }
      } else {
        console.error('[GameStore] Failed to save:', e);
      }
    }
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.defaults();
  },

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }
};

window.GameStore = GameStore;
