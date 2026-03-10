/* THE FERMENT ALCHEMIST — Mode Selection Screen */

const ModeSelect = {
  name: 'ModeSelect',
  props: ['gameStore'],
  emits: ['navigate', 'start-game', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <!-- Header -->
      <div class="flex items-center mb-6">
        <button class="game-btn game-btn-ghost" @click="$emit('play-sound', 'btn-back'); $emit('navigate', 'start')">
          ← Back
        </button>
        <h2 class="font-serif text-2xl ml-2" style="color: var(--ink-primary)">Choose Your Path</h2>
      </div>

      <!-- Mode Cards -->
      <div class="space-y-4 max-w-lg mx-auto">

        <!-- Story Mode -->
        <button class="game-card p-5 w-full text-left" @click="$emit('play-sound', 'btn-tap'); $emit('start-game', 'story')">
          <div class="flex items-start gap-4">
            <div class="text-3xl mt-1">📜</div>
            <div class="flex-1">
              <div class="font-serif text-xl mb-1" style="color: var(--ink-primary)">Story Mode</div>
              <p class="text-sm mb-2" style="color: var(--ink-secondary)">
                Journey through 5 chapters and 30 levels. Learn real fermentation from cultures around the world.
              </p>
              <div class="flex items-center gap-3 text-xs" style="color: var(--ink-muted)">
                <span>Chapter {{ currentChapter }}/5</span>
                <span>&middot;</span>
                <span>Level {{ currentLevel }}/30</span>
                <span>&middot;</span>
                <span>{{ totalStars }} ⭐</span>
              </div>
            </div>
            <div class="text-lg" style="color: var(--accent-brine)">→</div>
          </div>
        </button>

        <!-- Endless Mode -->
        <button class="game-card p-5 w-full text-left" @click="$emit('play-sound', 'btn-tap'); $emit('start-game', 'endless')">
          <div class="flex items-start gap-4">
            <div class="text-3xl mt-1">♾️</div>
            <div class="flex-1">
              <div class="font-serif text-xl mb-1" style="color: var(--ink-primary)">Endless Mode</div>
              <p class="text-sm mb-2" style="color: var(--ink-secondary)">
                Random orders, escalating difficulty. How long can you keep your streak alive?
              </p>
              <div class="flex items-center gap-3 text-xs" style="color: var(--ink-muted)">
                <span>High Score: {{ highScore }}</span>
                <span>&middot;</span>
                <span>Best Streak: {{ longestStreak }}</span>
              </div>
            </div>
            <div class="text-lg" style="color: var(--accent-brine)">→</div>
          </div>
        </button>

        <!-- Sandbox Mode -->
        <button class="game-card p-5 w-full text-left" @click="$emit('play-sound', 'btn-tap'); $emit('start-game', 'sandbox')">
          <div class="flex items-start gap-4">
            <div class="text-3xl mt-1">🧪</div>
            <div class="flex-1">
              <div class="font-serif text-xl mb-1" style="color: var(--ink-primary)">Sandbox</div>
              <p class="text-sm mb-2" style="color: var(--ink-secondary)">
                Free experimentation. All ingredients unlocked, no scoring. Discover what you can create.
              </p>
              <div class="flex items-center gap-3 text-xs" style="color: var(--ink-muted)">
                <span>{{ discoveries }} discoveries</span>
              </div>
            </div>
            <div class="text-lg" style="color: var(--accent-brine)">→</div>
          </div>
        </button>

        <!-- LLM Mode -->
        <button class="game-card p-5 w-full text-left" @click="$emit('play-sound', 'btn-tap'); $emit('start-game', 'llm')">
          <div class="flex items-start gap-4">
            <div class="text-3xl mt-1">🤖</div>
            <div class="flex-1">
              <div class="font-serif text-xl mb-1" style="color: var(--ink-primary)">LLM Mode</div>
              <p class="text-sm mb-2" style="color: var(--ink-secondary)">
                Text-based interface for our machine friends. Play via JSON commands or text adventure.
              </p>
              <div class="flex items-center gap-3 text-xs" style="color: var(--ink-muted)">
                <span>JSON API + Text Adventure</span>
              </div>
            </div>
            <div class="text-lg" style="color: var(--accent-brine)">→</div>
          </div>
        </button>

      </div>
    </div>
  `,

  computed: {
    currentChapter() { return this.gameStore?.story?.currentChapter || 1; },
    currentLevel() { return this.gameStore?.story?.currentLevel || 1; },
    totalStars() { return this.gameStore?.story?.totalStars || 0; },
    highScore() { return this.gameStore?.endless?.highScore || 0; },
    longestStreak() { return this.gameStore?.endless?.longestStreak || 0; },
    discoveries() { return this.gameStore?.sandbox?.discoveries?.length || 0; },
  }
};

window.ModeSelect = ModeSelect;
