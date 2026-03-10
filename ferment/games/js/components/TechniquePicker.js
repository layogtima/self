/* THE FERMENT ALCHEMIST — Technique Picker */

const TechniquePicker = {
  name: 'TechniquePicker',
  props: ['selected', 'playerLevel'],
  emits: ['update:selected', 'play-sound'],
  template: `
    <div class="space-y-3 screen-enter">
      <div class="text-xs uppercase tracking-wider mb-2 font-medium" style="color: var(--ink-muted)">
        Choose Your Technique
      </div>

      <button
        v-for="tech in availableTechniques"
        :key="tech.id"
        class="game-card p-4 w-full text-left"
        :class="{ 'ring-2': selected === tech.id }"
        :style="selected === tech.id ? 'border-color: var(--accent-brine); box-shadow: 0 0 0 2px var(--accent-brine)' : ''"
        @click="selectTechnique(tech)"
      >
        <div class="flex items-start gap-3">
          <div class="text-2xl mt-0.5">{{ tech.icon }}</div>
          <div class="flex-1 min-w-0">
            <div class="font-medium mb-0.5" style="color: var(--ink-primary)">{{ tech.name }}</div>
            <p class="text-xs leading-relaxed" style="color: var(--ink-secondary)">{{ tech.description }}</p>
            <div class="flex gap-3 mt-2 text-xs" style="color: var(--ink-muted)">
              <span>Salt: {{ tech.saltRange[0] }}-{{ tech.saltRange[1] }}%</span>
              <span>Temp: {{ tech.tempRange[0] }}-{{ tech.tempRange[1] }}°C</span>
              <span>Time: {{ tech.timeRange[0] }}-{{ tech.timeRange[1] }} {{ tech.timeUnit }}</span>
            </div>
          </div>
          <div v-if="selected === tech.id" class="text-lg" style="color: var(--accent-brine)">✓</div>
        </div>
      </button>

      <!-- Locked techniques -->
      <div
        v-for="tech in lockedTechniques"
        :key="'locked-'+tech.id"
        class="game-card p-4 w-full text-left opacity-40"
      >
        <div class="flex items-start gap-3">
          <div class="text-2xl mt-0.5">🔒</div>
          <div class="flex-1">
            <div class="font-medium mb-0.5" style="color: var(--ink-primary)">{{ tech.name }}</div>
            <p class="text-xs" style="color: var(--ink-muted)">Unlocks at level {{ tech.unlockLevel }}</p>
          </div>
        </div>
      </div>
    </div>
  `,

  computed: {
    effectiveLevel() {
      return this.playerLevel || 25;
    },
    availableTechniques() {
      return GameTechniques.getAvailable(this.effectiveLevel);
    },
    lockedTechniques() {
      return GameTechniques.items.filter(t => t.unlockLevel > this.effectiveLevel);
    },
  },

  methods: {
    selectTechnique(tech) {
      this.$emit('play-sound', 'technique-select');
      this.$emit('update:selected', tech.id);
    }
  }
};

window.TechniquePicker = TechniquePicker;
