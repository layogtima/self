/* THE FERMENT ALCHEMIST — Progression / Level Map Screen */

const ProgressionScreen = {
  name: 'ProgressionScreen',
  props: ['gameStore'],
  emits: ['start-level', 'navigate', 'play-sound'],
  template: `
    <div class="parchment-texture min-h-screen px-4 py-6 screen-enter">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <button class="game-btn game-btn-ghost" @click="$emit('navigate', 'mode-select')">← Menu</button>
        <div class="text-right">
          <div class="text-xs" style="color: var(--ink-muted)">{{ playerTitle }}</div>
          <div class="text-sm font-medium" style="color: var(--ink-primary)">Level {{ playerLevel }} &middot; {{ totalStars }} ⭐</div>
        </div>
      </div>

      <!-- Chapter List -->
      <div class="space-y-6 max-w-lg mx-auto">
        <div v-for="chapter in chapters" :key="chapter.id">
          <!-- Chapter Header -->
          <div
            class="game-card p-4 mb-2"
            :style="{ borderLeftWidth: '4px', borderLeftColor: chapter.color }"
          >
            <div class="flex items-center gap-3">
              <div class="text-2xl">{{ chapter.icon }}</div>
              <div class="flex-1">
                <div class="font-serif text-lg" style="color: var(--ink-primary)">
                  {{ chapter.title }}
                </div>
                <div class="text-xs" style="color: var(--ink-secondary)">{{ chapter.subtitle }}</div>
              </div>
              <div v-if="!isChapterUnlocked(chapter.id)" class="text-xl">🔒</div>
              <div v-else class="text-xs" style="color: var(--ink-muted)">
                {{ getChapterStars(chapter) }}/{{ chapter.levels.length * 3 }} ⭐
              </div>
            </div>
          </div>

          <!-- Level Nodes (if chapter unlocked) -->
          <div v-if="isChapterUnlocked(chapter.id)" class="flex flex-col items-center">
            <template v-for="(levelNum, idx) in chapter.levels" :key="levelNum">
              <!-- Connector line -->
              <div v-if="idx > 0" class="level-connector" :class="{ 'level-connector-active': isLevelCompleted(chapter.id, levelNum - 1) }"></div>

              <!-- Level node -->
              <button
                class="level-node"
                :class="{
                  'level-node-completed': isLevelCompleted(chapter.id, levelNum),
                  'level-node-unlocked': isLevelUnlocked(levelNum) && !isLevelCompleted(chapter.id, levelNum),
                  'level-node-current': isCurrentLevel(chapter.id, levelNum),
                }"
                :disabled="!isLevelUnlocked(levelNum)"
                @click="startLevel(chapter.id, levelNum)"
              >
                <span v-if="isLevelCompleted(chapter.id, levelNum)">
                  {{ getLevelStars(chapter.id, levelNum) > 0 ? '⭐' : '✓' }}
                </span>
                <span v-else-if="!isLevelUnlocked(levelNum)">🔒</span>
                <span v-else>{{ levelNum }}</span>
              </button>

              <!-- Level label -->
              <div class="text-xs mt-1 mb-1 text-center" style="color: var(--ink-muted)">
                {{ getLevelTitle(levelNum) }}
                <span v-if="isLevelCompleted(chapter.id, levelNum)" class="ml-1">
                  {{ '⭐'.repeat(getLevelStars(chapter.id, levelNum)) }}
                </span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `,

  computed: {
    chapters() { return GameLevels.chapters; },
    playerLevel() { return this.gameStore?.player?.level || 1; },
    playerTitle() { return this.gameStore?.player?.title || 'Salt Apprentice'; },
    totalStars() { return this.gameStore?.story?.totalStars || 0; },
    storyProgress() { return this.gameStore?.story || { levels: {}, unlockedChapters: [1] }; },
  },

  methods: {
    isChapterUnlocked(chapterId) {
      return GameLevels.isChapterUnlocked(chapterId, this.storyProgress);
    },

    isLevelUnlocked(levelNum) {
      return GameLevels.isLevelUnlocked(levelNum, this.storyProgress);
    },

    isLevelCompleted(chapterId, levelNum) {
      const key = `${chapterId}-${levelNum}`;
      return this.storyProgress.levels[key]?.completed;
    },

    isCurrentLevel(chapterId, levelNum) {
      return this.storyProgress.currentChapter === chapterId && this.storyProgress.currentLevel === levelNum;
    },

    getLevelStars(chapterId, levelNum) {
      const key = `${chapterId}-${levelNum}`;
      return this.storyProgress.levels[key]?.stars || 0;
    },

    getLevelTitle(levelNum) {
      const order = GameOrders.getByLevel(levelNum);
      return order ? order.title : `Level ${levelNum}`;
    },

    getChapterStars(chapter) {
      let stars = 0;
      for (const l of chapter.levels) {
        stars += this.getLevelStars(chapter.id, l);
      }
      return stars;
    },

    startLevel(chapterId, levelNum) {
      if (!this.isLevelUnlocked(levelNum)) return;
      this.$emit('play-sound', 'btn-tap');
      this.$emit('start-level', { chapter: chapterId, level: levelNum });
    }
  }
};

window.ProgressionScreen = ProgressionScreen;
