/* THE FERMENT ALCHEMIST — Order Card Component */

const OrderCard = {
  name: 'OrderCard',
  props: ['order', 'showHint'],
  emits: ['accept', 'play-sound'],
  template: `
    <div class="order-scroll screen-enter max-w-lg mx-auto">
      <!-- Customer -->
      <div class="flex items-center gap-3 mb-4">
        <div class="text-4xl">{{ order.customerIcon }}</div>
        <div>
          <div class="font-serif text-xl" style="color: var(--ink-primary)">{{ order.customerName }}</div>
          <div class="text-xs" style="color: var(--ink-muted)">{{ chapterLabel }}</div>
        </div>
      </div>

      <!-- Order Title -->
      <div class="font-serif text-lg mb-3" style="color: var(--accent-brine)">
        {{ order.title }}
      </div>

      <!-- Request Text (customer's voice) -->
      <div class="italic mb-4 leading-relaxed" style="color: var(--ink-secondary)">
        "{{ order.request }}"
      </div>

      <!-- Requirements Summary -->
      <div class="game-card-inset p-3 mb-4">
        <div class="text-xs uppercase tracking-wider mb-2 font-medium" style="color: var(--ink-muted)">
          Order Requirements
        </div>
        <div class="grid grid-cols-2 gap-2 text-sm" style="color: var(--ink-secondary)">
          <div>
            <span class="text-xs" style="color: var(--ink-muted)">Technique</span>
            <div class="font-medium">{{ techniqueName }}</div>
          </div>
          <div>
            <span class="text-xs" style="color: var(--ink-muted)">Time</span>
            <div class="font-medium">~{{ order.targetTime }} {{ order.timeUnit }}</div>
          </div>
          <div>
            <span class="text-xs" style="color: var(--ink-muted)">Ingredients</span>
            <div class="font-medium">{{ order.requiredIngredients.length }} required</div>
          </div>
          <div v-if="order.targetSaltPercent > 0">
            <span class="text-xs" style="color: var(--ink-muted)">Salt</span>
            <div class="font-medium">~{{ order.targetSaltPercent }}%</div>
          </div>
        </div>
      </div>

      <!-- Hint (toggle) -->
      <div v-if="showHint && order.hint" class="text-sm italic mb-4 px-3 py-2 rounded-lg" style="background: var(--parchment-mid); color: var(--ink-secondary)">
        💡 {{ order.hint }}
      </div>

      <!-- Accept Button -->
      <button
        class="game-btn game-btn-primary w-full mt-2"
        @click="$emit('play-sound', 'order-arrive'); $emit('accept')"
      >
        Accept Order →
      </button>
    </div>
  `,

  computed: {
    techniqueName() {
      const tech = GameTechniques.getById(this.order.requiredTechnique);
      return tech ? tech.name : this.order.requiredTechnique;
    },
    chapterLabel() {
      const ch = GameLevels.getChapter(this.order.chapter);
      return ch ? `${ch.icon} ${ch.title} — Level ${this.order.level}` : `Level ${this.order.level}`;
    }
  }
};

window.OrderCard = OrderCard;
