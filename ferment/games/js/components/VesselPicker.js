/* THE FERMENT ALCHEMIST — Vessel Picker (horizontal scroll) */

const VesselPicker = {
  name: 'VesselPicker',
  props: ['selected', 'playerLevel', 'technique'],
  emits: ['update:selected', 'play-sound'],
  template: `
    <div class="screen-enter">
      <div class="text-xs uppercase tracking-wider mb-3 font-medium" style="color: var(--ink-muted)">
        Choose Your Vessel
      </div>

      <!-- Horizontal scroll -->
      <div class="vessel-scroll">
        <button
          v-for="vessel in availableVessels"
          :key="vessel.id"
          class="vessel-item game-card p-3 text-center"
          :class="{ 'ring-2': selected === vessel.id }"
          :style="selected === vessel.id ? 'border-color: var(--accent-brine); box-shadow: 0 0 0 2px var(--accent-brine)' : ''"
          @click="selectVessel(vessel)"
        >
          <div class="text-3xl mb-2">{{ vessel.icon }}</div>
          <div class="text-xs font-medium mb-1 leading-tight" style="color: var(--ink-primary)">{{ vessel.name }}</div>
          <div v-if="isSuitable(vessel)" class="text-xs" style="color: var(--accent-culture)">Suitable ✓</div>
          <div v-else class="text-xs" style="color: var(--ink-muted)">Usable</div>
          <div v-if="vessel.bonus > 0" class="text-xs mt-1" style="color: var(--accent-brine)">+{{ vessel.bonus }} bonus</div>
        </button>
      </div>

      <!-- Selected vessel info -->
      <div v-if="selectedVessel" class="game-card-inset p-3 mt-3">
        <div class="flex items-start gap-3">
          <div class="text-2xl">{{ selectedVessel.icon }}</div>
          <div>
            <div class="font-medium text-sm" style="color: var(--ink-primary)">{{ selectedVessel.name }}</div>
            <p class="text-xs mt-1" style="color: var(--ink-secondary)">{{ selectedVessel.description }}</p>
            <div class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="trait in selectedVessel.traits"
                :key="trait"
                class="text-xs px-2 py-0.5 rounded-full"
                style="background: var(--parchment-mid); color: var(--ink-muted)"
              >
                {{ trait }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,

  computed: {
    effectiveLevel() {
      return this.playerLevel || 25;
    },
    availableVessels() {
      return GameVessels.getAvailable(this.effectiveLevel);
    },
    selectedVessel() {
      return this.selected ? GameVessels.getById(this.selected) : null;
    },
  },

  methods: {
    selectVessel(vessel) {
      this.$emit('play-sound', 'vessel-select');
      this.$emit('update:selected', vessel.id);
    },
    isSuitable(vessel) {
      return this.technique && vessel.suitableFor.includes(this.technique);
    }
  }
};

window.VesselPicker = VesselPicker;
