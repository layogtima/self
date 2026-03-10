/* THE FERMENT ALCHEMIST — Results Screen */

const ResultsScreen = {
  name: 'ResultsScreen',
  props: ['score', 'order', 'mode', 'gameStore'],
  emits: ['continue', 'retry', 'navigate', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <!-- Grade Stamp -->
      <div class="text-center mb-6">
        <div
          class="inline-block font-serif grade-stamp"
          :class="'grade-' + score.grade.toLowerCase()"
          style="font-size: 5rem; line-height: 1;"
        >
          {{ score.grade }}
        </div>
        <div class="text-2xl font-serif mt-2 score-pop" style="color: var(--ink-primary); animation-delay: 0.3s;">
          {{ score.total }}/100
        </div>
        <div class="flex justify-center gap-1 mt-2 score-pop" style="animation-delay: 0.5s;">
          <span v-for="s in 3" :key="s" class="text-xl">{{ s <= score.stars ? '⭐' : '☆' }}</span>
        </div>
      </div>

      <!-- Score Breakdown -->
      <div class="game-card p-4 max-w-md mx-auto mb-4">
        <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">
          Score Breakdown
        </div>

        <!-- Ingredients -->
        <div class="flex justify-between items-center py-2 border-b" style="border-color: var(--parchment-mid)">
          <div class="text-sm" style="color: var(--ink-secondary)">
            🥬 Ingredients
            <span class="text-xs ml-1" style="color: var(--ink-muted)">
              ({{ score.ingredients.matchedRequired }}/{{ score.ingredients.total }})
            </span>
          </div>
          <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ Math.round(score.ingredients.score) }}/40</div>
        </div>

        <!-- Technique -->
        <div class="flex justify-between items-center py-2 border-b" style="border-color: var(--parchment-mid)">
          <div class="text-sm" style="color: var(--ink-secondary)">
            {{ score.technique.correct ? '✓' : '✗' }} Technique
          </div>
          <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ score.technique.score }}/20</div>
        </div>

        <!-- Parameters -->
        <div class="flex justify-between items-center py-2 border-b" style="border-color: var(--parchment-mid)">
          <div class="text-sm" style="color: var(--ink-secondary)">
            🎯 Parameters
          </div>
          <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ score.parameters.score }}/30</div>
        </div>

        <!-- Parameter details -->
        <div v-if="score.parameters.details" class="py-1 pl-6 text-xs" style="color: var(--ink-muted)">
          <div v-if="score.parameters.details.salt" class="flex justify-between py-0.5">
            <span>Salt: {{ score.parameters.details.salt.actual }}% (target: {{ score.parameters.details.salt.target }}%)</span>
            <span>{{ score.parameters.details.salt.score }}/10</span>
          </div>
          <div v-if="score.parameters.details.temp" class="flex justify-between py-0.5">
            <span>Temp: {{ score.parameters.details.temp.actual }}°C (target: {{ score.parameters.details.temp.target }}°C)</span>
            <span>{{ score.parameters.details.temp.score }}/10</span>
          </div>
          <div v-if="score.parameters.details.time" class="flex justify-between py-0.5">
            <span>Time: {{ score.parameters.details.time.actual }} {{ score.parameters.details.time.unit }} (target: {{ score.parameters.details.time.target }})</span>
            <span>{{ score.parameters.details.time.score }}/10</span>
          </div>
        </div>

        <!-- Vessel -->
        <div class="flex justify-between items-center py-2 border-b" style="border-color: var(--parchment-mid)">
          <div class="text-sm" style="color: var(--ink-secondary)">
            {{ score.vessel.suitable ? '✓' : '○' }} Vessel
          </div>
          <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ score.vessel.score }}/5</div>
        </div>

        <!-- Speed -->
        <div v-if="mode === 'endless'" class="flex justify-between items-center py-2">
          <div class="text-sm" style="color: var(--ink-secondary)">⚡ Speed</div>
          <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ score.speed.score }}/5</div>
        </div>
      </div>

      <!-- Teaching Note -->
      <div v-if="order.teachingNote" class="game-card-inset p-3 max-w-md mx-auto mb-4">
        <div class="text-xs uppercase tracking-wider mb-1 font-medium" style="color: var(--accent-culture)">
          📚 Did you know?
        </div>
        <p class="text-sm" style="color: var(--ink-secondary)">{{ order.teachingNote }}</p>
      </div>

      <!-- Cultural Context -->
      <div v-if="culture" class="game-card-inset p-3 max-w-md mx-auto mb-4">
        <div class="text-xs uppercase tracking-wider mb-1 font-medium" style="color: var(--accent-brine)">
          {{ culture.flag }} Cultural Note
        </div>
        <p class="text-sm italic" style="color: var(--ink-secondary)">{{ culture.funFact }}</p>
      </div>

      <!-- XP Gain -->
      <div class="text-center mb-4">
        <span class="text-sm font-medium" style="color: var(--accent-brine)">
          +{{ xpGained }} XP
        </span>
      </div>

      <!-- Actions -->
      <div class="flex flex-col gap-2 max-w-md mx-auto">
        <button
          v-if="score.grade !== 'F'"
          class="game-btn game-btn-primary w-full"
          @click="$emit('play-sound', 'btn-tap'); $emit('continue')"
        >
          {{ mode === 'endless' ? 'Next Order →' : 'Continue →' }}
        </button>
        <button
          class="game-btn game-btn-secondary w-full"
          @click="$emit('play-sound', 'btn-tap'); $emit('retry')"
        >
          Try Again
        </button>
        <button
          class="game-btn game-btn-ghost w-full"
          @click="$emit('navigate', 'mode-select')"
        >
          Back to Menu
        </button>
      </div>
    </div>
  `,

  computed: {
    culture() {
      return this.order?.recipeRef ? GameCultures.getContext(this.order.recipeRef) : null;
    },
    xpGained() {
      const isFirst = !this.gameStore?.story?.levels?.[`${this.order?.chapter}-${this.order?.level}`]?.completed;
      return GameScoring.calculateXP(this.score.grade, isFirst, this.mode);
    }
  },

  mounted() {
    const gradeSound = this.score.grade === 'S' || this.score.grade === 'A' ? 'grade-s' : this.score.grade === 'F' ? 'grade-fail' : 'grade-a';
    this.$emit('play-sound', 'score-reveal');
    setTimeout(() => this.$emit('play-sound', gradeSound), 500);
  }
};

window.ResultsScreen = ResultsScreen;
