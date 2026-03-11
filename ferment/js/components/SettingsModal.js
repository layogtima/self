/**
 * FERMENT - SettingsModal Component
 * App settings: region, units, theme, expert mode, data management
 */

const SettingsModalComponent = {
  name: 'settings-modal',

  props: {
    settings: {
      type: Object,
      default: () => ({})
    },
    userLevel: {
      type: Object,
      default: () => ({})
    }
  },

  emits: ['close', 'update:settings', 'export-data', 'import-data', 'clear-data', 'show-welcome', 'show-changelog'],

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] SettingsModal error in', info, err);
    this.settingsError = (err && err.message) || 'An error occurred.';
    return false;
  },

  data() {
    return {
      settingsError: null,
      localSettings: { ...this.settings },
      showClearConfirm: false,
      storageSize: 0,
    };
  },

  computed: {
    countries() {
      return [
        { code: '', label: 'Not set' },
        { code: 'US', label: 'United States' },
        { code: 'CA', label: 'Canada' },
        { code: 'GB', label: 'United Kingdom' },
        { code: 'DE', label: 'Germany' },
        { code: 'FR', label: 'France' },
        { code: 'IT', label: 'Italy' },
        { code: 'ES', label: 'Spain' },
        { code: 'PT', label: 'Portugal' },
        { code: 'NL', label: 'Netherlands' },
        { code: 'SE', label: 'Sweden' },
        { code: 'NO', label: 'Norway' },
        { code: 'DK', label: 'Denmark' },
        { code: 'PL', label: 'Poland' },
        { code: 'RO', label: 'Romania' },
        { code: 'HU', label: 'Hungary' },
        { code: 'CZ', label: 'Czech Republic' },
        { code: 'TR', label: 'Turkey' },
        { code: 'RU', label: 'Russia' },
        { code: 'KR', label: 'South Korea' },
        { code: 'JP', label: 'Japan' },
        { code: 'CN', label: 'China' },
        { code: 'IN', label: 'India' },
        { code: 'TH', label: 'Thailand' },
        { code: 'VN', label: 'Vietnam' },
        { code: 'ID', label: 'Indonesia' },
        { code: 'PH', label: 'Philippines' },
        { code: 'AU', label: 'Australia' },
        { code: 'NZ', label: 'New Zealand' },
        { code: 'BR', label: 'Brazil' },
        { code: 'MX', label: 'Mexico' },
        { code: 'AR', label: 'Argentina' },
        { code: 'CO', label: 'Colombia' },
        { code: 'ZA', label: 'South Africa' },
        { code: 'NG', label: 'Nigeria' },
        { code: 'KE', label: 'Kenya' },
        { code: 'ET', label: 'Ethiopia' },
        { code: 'EG', label: 'Egypt' },
        { code: 'IL', label: 'Israel' },
        { code: 'SA', label: 'Saudi Arabia' },
        { code: 'AE', label: 'UAE' },
      ].sort((a, b) => a.label.localeCompare(b.label));
    },

    storageSizeDisplay() {
      const bytes = this.storageSize;
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },

    storagePercent() {
      const maxBytes = 5 * 1024 * 1024; // 5MB localStorage limit
      return Math.min(100, Math.round((this.storageSize / maxBytes) * 100));
    },
  },

  watch: {
    localSettings: {
      handler(newVal) {
        this.$emit('update:settings', { ...newVal });
      },
      deep: true
    }
  },

  methods: {
    triggerImport() {
      this.$refs.importInput.click();
    },

    onImportFile(e) {
      const file = e.target.files[0];
      if (file) {
        this.$emit('import-data', file);
      }
    },

    confirmClear() {
      this.showClearConfirm = true;
    },

    executeClear() {
      this.$emit('clear-data');
      this.showClearConfirm = false;
    },

    handleBackdropClick(e) {
      if (e.target === e.currentTarget) {
        this.$emit('close');
      }
    },
  },

  mounted() {
    this.storageSize = FermentStore.getStorageSize();
    document.body.style.overflow = 'hidden';
  },

  beforeUnmount() {
    document.body.style.overflow = '';
  },

  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" @click="handleBackdropClick">
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-xl w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar" @click.stop>
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-bg-secondary dark:border-dark-secondary">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-accent-brine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <h2 class="font-serif text-xl text-text-primary dark:text-dark-text">Settings</h2>
          </div>
          <button @click="$emit('close')" class="p-2 rounded-xl hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all" aria-label="Close">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Error Banner -->
        <div v-if="settingsError" class="mx-6 mt-4 bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4">
          <p class="text-sm text-accent-ferment font-medium">Something went wrong.</p>
          <p class="text-xs text-text-muted mt-1">{{ settingsError }}</p>
          <button @click="settingsError = null" class="mt-2 text-xs text-accent-ferment underline">Dismiss</button>
        </div>
        <template v-if="!settingsError">
        <!-- Content -->
        <div class="px-6 py-5 space-y-6">
          <!-- Region -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Region</label>
            <select v-model="localSettings.region"
              class="w-full px-3 py-2.5 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-brine focus:outline-none transition-all"
            >
              <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.label }}</option>
            </select>
          </div>

          <!-- Units -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Units</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button @click="localSettings.units = 'metric'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.units === 'metric' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Metric</button>
              <button @click="localSettings.units = 'imperial'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.units === 'imperial' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Imperial</button>
            </div>
          </div>

          <!-- Theme -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Theme</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button v-for="t in ['light', 'dark', 'auto']" :key="t"
                @click="localSettings.theme = t"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize', localSettings.theme === t ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >{{ t }}</button>
            </div>
          </div>

          <!-- Expert Mode -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-text-primary dark:text-dark-text">Expert Mode</span>
              <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5">Show advanced details and options</p>
            </div>
            <button @click="localSettings.expertMode = !localSettings.expertMode"
              :class="['w-11 h-6 rounded-full transition-all relative', localSettings.expertMode ? 'bg-accent-brine' : 'bg-text-muted/30']"
            >
              <div :class="['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', localSettings.expertMode ? 'left-6' : 'left-1']"></div>
            </button>
          </div>

          <!-- Enable Editing -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm font-medium text-text-primary dark:text-dark-text">Enable Editing</span>
              <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5">Edit recipes and wiki articles inline</p>
            </div>
            <button @click="localSettings.enableEditing = !localSettings.enableEditing"
              :class="['w-11 h-6 rounded-full transition-all relative', localSettings.enableEditing ? 'bg-accent-brine' : 'bg-text-muted/30']"
            >
              <div :class="['absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all', localSettings.enableEditing ? 'left-6' : 'left-1']"></div>
            </button>
          </div>

          <!-- Default View -->
          <div>
            <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-2">Default View</label>
            <div class="flex rounded-xl bg-bg-secondary dark:bg-dark-secondary p-1">
              <button @click="localSettings.defaultView = 'cards'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.defaultView === 'cards' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >Cards</button>
              <button @click="localSettings.defaultView = 'list'"
                :class="['flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all', localSettings.defaultView === 'list' ? 'bg-bg-card dark:bg-dark-card shadow-warm text-accent-brine' : 'text-text-secondary']"
              >List</button>
            </div>
          </div>

          <!-- Divider -->
          <hr class="border-bg-secondary dark:border-dark-secondary" />

          <!-- Welcome Page -->
          <div>
            <button @click="$emit('show-welcome'); $emit('close');"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
            >
              <span class="text-xl">🫙</span>
              <div>
                <span class="text-sm font-medium text-text-primary dark:text-dark-text">Show Welcome Page</span>
                <p class="text-xs text-text-muted">Revisit the introduction to fermentation</p>
              </div>
            </button>
          </div>

          <!-- What's New -->
          <div>
            <button @click="$emit('show-changelog')"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
            >
              <span class="text-xl">📋</span>
              <div class="flex-1">
                <span class="text-sm font-medium text-text-primary dark:text-dark-text">What's New</span>
                <p class="text-xs text-text-muted">Recent features, improvements & fixes</p>
              </div>
              <svg class="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- Divider -->
          <hr class="border-bg-secondary dark:border-dark-secondary" />

          <!-- Data Management -->
          <div>
            <h3 class="font-medium text-text-primary dark:text-dark-text mb-3">Data Management</h3>
            <div class="space-y-3">
              <button @click="$emit('export-data')"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
              >
                <svg class="w-5 h-5 text-accent-culture" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                <div>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Export Data (JSON)</span>
                  <p class="text-xs text-text-muted">Download a backup of all your data</p>
                </div>
              </button>

              <button @click="triggerImport"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-bg-secondary/50 dark:bg-dark-secondary/50 hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all text-left"
              >
                <svg class="w-5 h-5 text-accent-brine" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <div>
                  <span class="text-sm font-medium text-text-primary dark:text-dark-text">Import Data (JSON)</span>
                  <p class="text-xs text-text-muted">Restore from a backup file</p>
                </div>
              </button>
              <input ref="importInput" type="file" accept=".json" @change="onImportFile" class="hidden" />

              <button @click="confirmClear"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-accent-ferment/5 hover:bg-accent-ferment/10 transition-all text-left border border-accent-ferment/20"
              >
                <svg class="w-5 h-5 text-accent-ferment" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                <div>
                  <span class="text-sm font-medium text-accent-ferment">Clear All Data</span>
                  <p class="text-xs text-text-muted">Permanently delete all data</p>
                </div>
              </button>

              <!-- Clear Confirmation -->
              <div v-if="showClearConfirm" class="bg-accent-ferment/10 border border-accent-ferment/30 rounded-xl p-4 space-y-3">
                <p class="text-sm text-accent-ferment font-medium">Are you sure? This will delete all your pantry items, journal entries, favorites, and settings.</p>
                <div class="flex gap-2">
                  <button @click="showClearConfirm = false" class="flex-1 px-4 py-2 rounded-xl text-sm bg-bg-secondary dark:bg-dark-secondary text-text-secondary transition-all">Cancel</button>
                  <button @click="executeClear" class="flex-1 px-4 py-2 rounded-xl text-sm font-medium bg-accent-ferment text-white transition-all">Yes, Clear Everything</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Storage Usage -->
          <div class="bg-bg-secondary/50 dark:bg-dark-secondary/50 rounded-xl p-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-text-secondary dark:text-dark-text-secondary">Storage Used</span>
              <span class="font-mono text-sm text-text-primary dark:text-dark-text">{{ storageSizeDisplay }}</span>
            </div>
            <div class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-2">
              <div class="bg-accent-brine rounded-full h-2 transition-all" :style="{ width: storagePercent + '%' }"></div>
            </div>
            <p class="text-xs text-text-muted mt-1">{{ storagePercent }}% of ~5 MB limit</p>
          </div>

          <!-- About -->
          <div class="text-center pt-2">
            <p class="text-2xl mb-1">🫙</p>
            <p class="font-serif text-lg text-text-primary dark:text-dark-text">FERMENT</p>
            <p class="text-xs text-text-muted">v1.0 - Your Fermentation Companion</p>
            <p class="text-xs text-text-muted mt-1">Made with salt, patience, and good bacteria.</p>
            <div v-if="userLevel.level > 0" class="mt-2">
              <span class="text-xs bg-bg-secondary dark:bg-dark-secondary rounded-full px-3 py-1 text-text-secondary dark:text-dark-text-secondary">
                Level {{ userLevel.level }}: {{ userLevel.title }}
              </span>
            </div>
          </div>
        </div>
        </template>
      </div>
    </div>
  `
};
