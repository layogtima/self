/* THE FERMENT ALCHEMIST — Settings Panel */

const SettingsPanel = {
  name: 'SettingsPanel',
  props: ['gameStore'],
  emits: ['navigate', 'save-store', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <div class="flex items-center mb-6">
        <button class="game-btn game-btn-ghost" @click="$emit('navigate', 'start')">← Back</button>
        <h2 class="font-serif text-2xl ml-2" style="color: var(--ink-primary)">Settings</h2>
      </div>

      <div class="space-y-4 max-w-md mx-auto">
        <!-- Audio -->
        <div class="game-card p-4">
          <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">Audio</div>
          <div class="space-y-3">
            <label class="flex items-center justify-between cursor-pointer min-h-[44px]">
              <span class="text-sm" style="color: var(--ink-secondary)">🔊 Sound Effects</span>
              <input type="checkbox" v-model="gameStore.settings.soundEnabled" @change="saveSettings" class="w-5 h-5 accent-amber-600">
            </label>
            <label class="flex items-center justify-between cursor-pointer min-h-[44px]">
              <span class="text-sm" style="color: var(--ink-secondary)">🎵 Music</span>
              <input type="checkbox" v-model="gameStore.settings.musicEnabled" @change="saveSettings" class="w-5 h-5 accent-amber-600">
            </label>
          </div>
        </div>

        <!-- Display -->
        <div class="game-card p-4">
          <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">Display</div>
          <div class="space-y-3">
            <div class="flex items-center justify-between min-h-[44px]">
              <span class="text-sm" style="color: var(--ink-secondary)">Theme</span>
              <select
                v-model="gameStore.settings.theme"
                @change="applyTheme(); saveSettings()"
                class="p-2 rounded text-sm"
                style="background: var(--parchment-bg); border: 1px solid var(--parchment-mid); color: var(--ink-primary)"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Difficulty -->
        <div class="game-card p-4">
          <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">Difficulty</div>
          <div class="space-y-2">
            <button
              v-for="diff in ['easy', 'normal', 'hard']"
              :key="diff"
              class="game-chip w-full justify-center capitalize"
              :class="{ 'game-chip-selected': gameStore.settings.difficulty === diff }"
              @click="gameStore.settings.difficulty = diff; saveSettings()"
            >
              {{ diff }}
              <span class="text-xs ml-2 opacity-70">{{ difficultyDesc(diff) }}</span>
            </button>
          </div>
        </div>

        <!-- Player Stats -->
        <div class="game-card p-4">
          <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">Your Stats</div>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div style="color: var(--ink-muted)">Level</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.player.level }}</div>
            </div>
            <div>
              <div style="color: var(--ink-muted)">Title</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.player.title }}</div>
            </div>
            <div>
              <div style="color: var(--ink-muted)">XP</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.player.xp }}</div>
            </div>
            <div>
              <div style="color: var(--ink-muted)">Orders Completed</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.player.totalOrdersCompleted }}</div>
            </div>
            <div>
              <div style="color: var(--ink-muted)">Story Stars</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.story.totalStars }} ⭐</div>
            </div>
            <div>
              <div style="color: var(--ink-muted)">Endless High</div>
              <div class="font-medium" style="color: var(--ink-primary)">{{ gameStore.endless.highScore }}</div>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="game-card p-4" style="border-color: var(--accent-ferment)">
          <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--accent-ferment)">Danger Zone</div>
          <button class="game-btn game-btn-danger w-full" @click="confirmReset">
            Reset All Progress
          </button>
        </div>
      </div>
    </div>
  `,

  methods: {
    saveSettings() {
      GameData.setAudioEnabled(this.gameStore.settings.soundEnabled);
      GameData.setMusicEnabled(this.gameStore.settings.musicEnabled);
      this.$emit('save-store');
    },

    applyTheme() {
      const theme = this.gameStore.settings.theme;
      const html = document.documentElement;
      if (theme === 'dark') html.classList.add('dark');
      else if (theme === 'light') html.classList.remove('dark');
      else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          html.classList.add('dark');
        } else {
          html.classList.remove('dark');
        }
      }
    },

    difficultyDesc(diff) {
      const descs = { easy: 'Wider tolerances', normal: 'Standard', hard: 'Tight tolerances' };
      return descs[diff] || '';
    },

    confirmReset() {
      if (confirm('This will delete ALL game progress, stats, and discoveries. Are you sure?')) {
        const fresh = GameStore.reset();
        Object.assign(this.gameStore, fresh);
        this.$emit('save-store');
        this.$emit('play-sound', 'btn-tap');
      }
    }
  }
};

window.SettingsPanel = SettingsPanel;
