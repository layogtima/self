/* THE FERMENT ALCHEMIST — Fermentation Monitor (animated progress) */

const FermentationMonitor = {
  name: 'FermentationMonitor',
  props: ['progress', 'technique', 'vessel', 'saltPercent', 'temperature', 'time', 'timeUnit'],
  emits: ['complete', 'play-sound'],
  template: `
    <div class="screen-enter text-center">
      <!-- Vessel Animation -->
      <div class="relative mx-auto mb-6" style="width: 160px; height: 200px;">
        <!-- Vessel -->
        <div class="text-7xl absolute bottom-4 left-1/2 -translate-x-1/2">{{ vesselIcon }}</div>

        <!-- Bubbles -->
        <div v-if="progress < 100" class="absolute bottom-16 left-1/2 -translate-x-1/2">
          <div class="bubble absolute" style="left: -10px; font-size: 12px;">🫧</div>
          <div class="bubble bubble-delay-1 absolute" style="left: 8px; font-size: 8px;">🫧</div>
          <div class="bubble bubble-delay-2 absolute" style="left: -5px; font-size: 10px;">🫧</div>
          <div class="bubble bubble-delay-3 absolute" style="left: 12px; font-size: 6px;">🫧</div>
        </div>

        <!-- Steam (when complete) -->
        <div v-if="progress >= 100" class="absolute top-0 left-1/2 -translate-x-1/2">
          <div class="steam" style="font-size: 20px;">✨</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="max-w-xs mx-auto mb-4">
        <div class="game-progress">
          <div class="game-progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <div class="text-sm mt-2 font-medium" style="color: var(--ink-primary)">
          {{ progress }}% — {{ statusText }}
        </div>
      </div>

      <!-- Parameters Display -->
      <div class="game-card-inset p-3 max-w-xs mx-auto mb-4">
        <div class="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div style="color: var(--ink-muted)">Salt</div>
            <div class="font-medium" style="color: var(--ink-primary)">{{ saltPercent }}%</div>
          </div>
          <div>
            <div style="color: var(--ink-muted)">Temp</div>
            <div class="font-medium" style="color: var(--ink-primary)">{{ temperature }}°C</div>
          </div>
          <div>
            <div style="color: var(--ink-muted)">Time</div>
            <div class="font-medium" style="color: var(--ink-primary)">{{ time }} {{ timeUnit || 'days' }}</div>
          </div>
        </div>
      </div>

      <!-- Technique info -->
      <div class="text-xs mb-4" style="color: var(--ink-muted)">
        {{ techniqueLabel }}
      </div>

      <!-- Skip / Complete Button -->
      <button
        v-if="progress >= 100"
        class="game-btn game-btn-primary"
        @click="$emit('play-sound', 'ferment-complete'); $emit('complete')"
      >
        ✨ Fermentation Complete — Serve!
      </button>
      <div v-else class="text-xs" style="color: var(--ink-muted)">
        The transformation is happening...
      </div>
    </div>
  `,

  computed: {
    vesselIcon() {
      const v = this.vessel ? GameVessels.getById(this.vessel) : null;
      return v ? v.icon : '🫙';
    },
    techniqueLabel() {
      const t = this.technique ? GameTechniques.getById(this.technique) : null;
      return t ? `${t.icon} ${t.name}` : '';
    },
    statusText() {
      if (this.progress >= 100) return 'Ready to serve!';
      if (this.progress >= 75) return 'Almost there...';
      if (this.progress >= 50) return 'Bubbling nicely';
      if (this.progress >= 25) return 'The microbes are working';
      return 'Just getting started';
    }
  },

  watch: {
    progress(val) {
      if (val >= 50 && val < 55) {
        this.$emit('play-sound', 'ferment-bubble');
      }
    }
  }
};

window.FermentationMonitor = FermentationMonitor;
