/* THE FERMENT ALCHEMIST — Start Screen */

const StartScreen = {
  name: 'StartScreen',
  props: ['gameStore'],
  emits: ['navigate', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen flex flex-col items-center justify-center px-4 py-8 screen-enter">
      <!-- Title -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-4 gentle-bob">🧪</div>
        <h1 class="font-serif text-4xl sm:text-5xl mb-2" style="color: var(--ink-primary)">
          The Ferment<br>Alchemist
        </h1>
        <p class="text-sm sm:text-base mt-3" style="color: var(--ink-secondary)">
          Master the ancient art of fermentation
        </p>
      </div>

      <!-- Decorative divider -->
      <div class="w-48 mx-auto mb-8" style="height: 2px; background: linear-gradient(90deg, transparent, var(--accent-brine), transparent);"></div>

      <!-- Player Info (if returning player) -->
      <div v-if="playerLevel > 1" class="game-card p-4 mb-6 text-center w-full max-w-xs">
        <div class="text-xs uppercase tracking-wider mb-1" style="color: var(--ink-muted)">Welcome back</div>
        <div class="font-serif text-lg" style="color: var(--ink-primary)">{{ playerTitle }}</div>
        <div class="text-xs mt-1" style="color: var(--ink-secondary)">Level {{ playerLevel }} &middot; {{ playerXP }} XP</div>
      </div>

      <!-- Play Button -->
      <button
        class="game-btn game-btn-primary text-lg px-8 py-4 mb-4 w-full max-w-xs"
        @click="$emit('play-sound', 'btn-tap'); $emit('navigate', 'mode-select')"
      >
        Play
      </button>

      <!-- Continue (if in progress) -->
      <button
        v-if="hasSaveData"
        class="game-btn game-btn-secondary mb-3 w-full max-w-xs"
        @click="$emit('play-sound', 'btn-tap'); $emit('navigate', 'mode-select')"
      >
        Continue Story
      </button>

      <!-- Secondary Actions -->
      <div class="flex gap-3 mt-2">
        <button
          class="game-btn game-btn-ghost"
          @click="$emit('navigate', 'settings')"
          title="Settings"
        >
          ⚙️
        </button>
        <button
          class="game-btn game-btn-ghost"
          @click="$emit('navigate', 'help')"
          title="How to Play"
        >
          ❓
        </button>
      </div>

      <!-- Audio Controls Placeholder -->
      <div class="mt-8 flex gap-4 items-center">
        <button
          class="game-btn game-btn-ghost text-xs"
          :style="{ opacity: soundEnabled ? 1 : 0.4 }"
          @click="toggleSound"
        >
          {{ soundEnabled ? '🔊' : '🔇' }} SFX
        </button>
        <button
          class="game-btn game-btn-ghost text-xs"
          :style="{ opacity: musicEnabled ? 1 : 0.4 }"
          @click="toggleMusic"
        >
          {{ musicEnabled ? '🎵' : '🔇' }} Music
        </button>
      </div>

      <!-- Version / Back to Ferment -->
      <div class="mt-auto pt-8 text-center">
        <a href="../" class="text-xs hover:underline" style="color: var(--ink-muted)">
          ← Back to FERMENT
        </a>
      </div>
    </div>
  `,

  computed: {
    playerLevel() {
      return this.gameStore?.player?.level || 1;
    },
    playerTitle() {
      return this.gameStore?.player?.title || 'Salt Apprentice';
    },
    playerXP() {
      return this.gameStore?.player?.xp || 0;
    },
    hasSaveData() {
      return this.gameStore?.story?.currentLevel > 1;
    },
    soundEnabled() {
      return this.gameStore?.settings?.soundEnabled !== false;
    },
    musicEnabled() {
      return this.gameStore?.settings?.musicEnabled !== false;
    },
  },

  methods: {
    toggleSound() {
      this.gameStore.settings.soundEnabled = !this.gameStore.settings.soundEnabled;
      GameData.setAudioEnabled(this.gameStore.settings.soundEnabled);
    },
    toggleMusic() {
      this.gameStore.settings.musicEnabled = !this.gameStore.settings.musicEnabled;
      GameData.setMusicEnabled(this.gameStore.settings.musicEnabled);
    },
  },

  mounted() {
    GameData.playMusic('bg-music-menu');
  }
};

window.StartScreen = StartScreen;
