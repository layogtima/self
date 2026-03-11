/**
 * FERMENT - localStorage Abstraction Layer
 * Handles persistence, migrations, and data management
 */

const FermentStore = {
  STORAGE_KEY: 'ferment_v1',
  CURRENT_VERSION: 1,

  defaultState() {
    return {
      version: this.CURRENT_VERSION,
      settings: {
        region: 'IN',
        city: 'Bengaluru',
        hemisphere: 'north',
        units: 'metric',
        theme: 'light',
        expertMode: false,
        enableEditing: false,
        defaultView: 'cards',
        onboardingComplete: false,
      },
      pantry: [],
      journal: {
        batches: [],
        stats: {
          totalBatches: 0,
          completedBatches: 0,
          failedBatches: 0,
          totalFermentDays: 0,
        }
      },
      shoppingList: [],
      favorites: [],
      bookmarks: [],
      recipeNotes: {},
      recentlyViewed: [],
      userLevel: {
        recipesViewed: 0,
        batchesStarted: 0,
        batchesCompleted: 0,
        level: 1,
        title: 'Salt Curious',
      },
      exportedAt: null,
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.defaultState();

      const data = JSON.parse(raw);
      if (data.version < this.CURRENT_VERSION) {
        return this.migrate(data);
      }
      // Merge with defaults to handle any missing keys
      return this.mergeDefaults(data);
    } catch (e) {
      console.error('FermentStore: Failed to load data:', e);
      return this.defaultState();
    }
  },

  save(state) {
    try {
      const size = new Blob([JSON.stringify(state)]).size;
      if (size > 4 * 1024 * 1024) {
        console.warn('FermentStore: Data approaching localStorage limit:', (size / 1024 / 1024).toFixed(2) + 'MB');
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('FermentStore: Failed to save data:', e);
      if (e.name === 'QuotaExceededError') {
        console.error('FermentStore: localStorage is full. Consider exporting and clearing old data.');
      }
      return false;
    }
  },

  mergeDefaults(data) {
    const defaults = this.defaultState();
    return {
      ...defaults,
      ...data,
      settings: { ...defaults.settings, ...(data.settings || {}) },
      journal: {
        ...defaults.journal,
        ...(data.journal || {}),
        stats: { ...defaults.journal.stats, ...((data.journal || {}).stats || {}) },
      },
      userLevel: { ...defaults.userLevel, ...(data.userLevel || {}) },
    };
  },

  migrate(data) {
    // Future migrations go here
    // if (data.version === 1) { /* migrate to v2 */ data.version = 2; }
    return this.mergeDefaults(data);
  },

  exportJSON(state) {
    const exportData = { ...state, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferment-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.version) {
            reject(new Error('Invalid FERMENT backup file'));
            return;
          }
          resolve(this.mergeDefaults(data));
        } catch (err) {
          reject(new Error('Failed to parse backup file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  },

  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    return this.defaultState();
  },

  getStorageSize() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return 0;
    return new Blob([raw]).size;
  },

  // Level calculation
  calculateLevel(stats) {
    const { recipesViewed = 0, batchesStarted = 0, batchesCompleted = 0 } = stats;
    const levels = [
      { level: 6, title: 'Fermentation Anarchist', req: () => batchesCompleted >= 25 },
      { level: 5, title: 'The Cultures Have Accepted You', req: () => batchesCompleted >= 25 },
      { level: 4, title: 'Lactobacillus Whisperer', req: () => batchesCompleted >= 10 },
      { level: 3, title: 'Jar Collector', req: () => batchesCompleted >= 3 },
      { level: 2, title: 'Brine Time', req: () => batchesStarted >= 1 },
      { level: 1, title: 'Salt Curious', req: () => recipesViewed >= 5 },
    ];
    for (const l of levels) {
      if (l.req()) return { level: l.level, title: l.title };
    }
    return { level: 0, title: 'Newcomer' };
  }
};
