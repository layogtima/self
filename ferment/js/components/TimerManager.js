/**
 * FERMENT - TimerManager Component
 * Countdown timers for fermentation batches
 */

const TimerManagerComponent = {
  name: 'timer-manager',

  errorCaptured(err, _vm, info) {
    console.warn('[FERMENT] Timer error in', info, err);
    return false; // Let ToolsView handle display
  },

  data() {
    return {
      timers: [],
      showNewForm: false,
      newTimer: {
        name: '',
        endDate: '',
        reminderDays: 2,
        notes: '',
      },
      now: new Date(),
      tickInterval: null,
    };
  },

  computed: {
    activeTimers() {
      return this.timers.filter(t => !t.completed).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    },

    completedTimers() {
      return this.timers.filter(t => t.completed).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    },
  },

  methods: {
    startTick() {
      this.tickInterval = setInterval(() => {
        this.now = new Date();
        // Auto-complete timers that have ended
        this.timers.forEach(t => {
          if (!t.completed && new Date(t.endDate) <= this.now) {
            t.completed = true;
            t.completedAt = this.now.toISOString();
          }
        });
        this.saveTimers();
      }, 60000); // Every minute
    },

    countdown(timer) {
      const end = new Date(timer.endDate);
      const diff = end - this.now;
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, total: 0, label: 'Complete!' };
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      let label = '';
      if (days > 0) label += days + 'd ';
      if (hours > 0 || days > 0) label += hours + 'h ';
      label += minutes + 'm';
      return { days, hours, minutes, total: diff, label: label.trim() };
    },

    timerProgress(timer) {
      const start = new Date(timer.startDate);
      const end = new Date(timer.endDate);
      const total = end - start;
      if (total <= 0) return 100;
      const elapsed = this.now - start;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    },

    isReminderDue(timer) {
      if (!timer.reminderDays || timer.completed) return false;
      const cd = this.countdown(timer);
      // Reminder when remaining days <= reminder interval
      return cd.days <= timer.reminderDays && cd.total > 0;
    },

    addTimer() {
      if (!this.newTimer.name.trim() || !this.newTimer.endDate) return;
      const timer = {
        id: FermentFormat.uid(),
        name: this.newTimer.name.trim(),
        startDate: new Date().toISOString(),
        endDate: new Date(this.newTimer.endDate).toISOString(),
        reminderDays: parseInt(this.newTimer.reminderDays) || 0,
        notes: this.newTimer.notes,
        completed: false,
        completedAt: null,
      };
      this.timers.push(timer);
      this.saveTimers();
      this.showNewForm = false;
      this.newTimer = { name: '', endDate: '', reminderDays: 2, notes: '' };
    },

    deleteTimer(id) {
      this.timers = this.timers.filter(t => t.id !== id);
      this.saveTimers();
    },

    markComplete(id) {
      const timer = this.timers.find(t => t.id === id);
      if (timer) {
        timer.completed = true;
        timer.completedAt = new Date().toISOString();
        this.saveTimers();
      }
    },

    fmtDate(dateStr) {
      try { return FermentFormat.formatDate(dateStr); } catch (e) { return ''; }
    },

    fmtDateShort(dateStr) {
      try { return FermentFormat.formatDateShort(dateStr); } catch (e) { return ''; }
    },

    saveTimers() {
      try {
        localStorage.setItem('ferment_timers', JSON.stringify(this.timers));
      } catch (e) {
        console.warn('Failed to save timers:', e);
      }
    },

    loadTimers() {
      try {
        const raw = localStorage.getItem('ferment_timers');
        if (raw) this.timers = JSON.parse(raw);
      } catch (e) {
        console.warn('Failed to load timers:', e);
      }
    },

    progressColor(pct) {
      if (pct >= 90) return 'bg-accent-culture';
      if (pct >= 50) return 'bg-accent-brine';
      return 'bg-accent-aged';
    },
  },

  mounted() {
    this.loadTimers();
    this.startTick();
  },

  beforeUnmount() {
    if (this.tickInterval) clearInterval(this.tickInterval);
  },

  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm-lg border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
        <div class="bg-accent-culture/10 dark:bg-accent-culture/5 px-6 py-4 border-b border-accent-culture/20">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="text-2xl">⏱️</span>
              <div>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Fermentation Timers</h3>
                <p class="text-sm text-text-muted dark:text-dark-text-secondary">Track your active ferments</p>
              </div>
            </div>
            <button @click="showNewForm = !showNewForm"
              class="inline-flex items-center gap-2 px-4 py-2 bg-accent-culture text-white rounded-xl text-sm font-medium shadow-warm hover:shadow-warm-lg transition-all duration-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              New Timer
            </button>
          </div>
        </div>

        <!-- New Timer Form -->
        <transition name="slide">
          <div v-if="showNewForm" class="p-5 border-b border-bg-secondary dark:border-dark-secondary space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Timer Name *</label>
                <input v-model="newTimer.name" type="text" placeholder="e.g., Sauerkraut Batch 3"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:outline-none transition-all"
                  @keyup.enter="addTimer"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Target End Date *</label>
                <input v-model="newTimer.endDate" type="date"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-culture focus:outline-none transition-all"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Check Reminder (days)</label>
                <input v-model.number="newTimer.reminderDays" type="number" min="0" max="30"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text border border-transparent focus:border-accent-culture focus:outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary dark:text-dark-text-secondary mb-1">Notes</label>
                <input v-model="newTimer.notes" type="text" placeholder="Optional notes"
                  class="w-full px-3 py-2 rounded-xl bg-bg-secondary dark:bg-dark-secondary text-text-primary dark:text-dark-text placeholder-text-muted border border-transparent focus:border-accent-culture focus:outline-none transition-all"
                />
              </div>
            </div>
            <div class="flex gap-2 justify-end">
              <button @click="showNewForm = false" class="px-4 py-2 rounded-xl text-sm text-text-secondary hover:bg-bg-secondary dark:hover:bg-dark-secondary transition-all">Cancel</button>
              <button @click="addTimer" :disabled="!newTimer.name.trim() || !newTimer.endDate"
                :class="[
                  'px-5 py-2 rounded-xl text-sm font-medium transition-all',
                  newTimer.name.trim() && newTimer.endDate ? 'bg-accent-culture text-white shadow-warm' : 'bg-bg-secondary text-text-muted cursor-not-allowed dark:bg-dark-secondary'
                ]"
              >Create Timer</button>
            </div>
          </div>
        </transition>

        <!-- Active Timers -->
        <div class="p-5">
          <div v-if="activeTimers.length === 0 && !showNewForm" class="text-center py-8">
            <div class="text-4xl mb-3">⏱️</div>
            <p class="text-text-muted dark:text-dark-text-secondary">No active timers. Create one to track your ferments!</p>
          </div>

          <div class="space-y-4">
            <div v-for="timer in activeTimers" :key="timer.id"
              :class="[
                'rounded-xl border p-4 space-y-3 transition-all',
                isReminderDue(timer)
                  ? 'border-accent-brine/50 bg-accent-brine/5'
                  : 'border-bg-secondary/50 dark:border-dark-secondary bg-bg-secondary/20 dark:bg-dark-secondary/20'
              ]"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="font-medium text-text-primary dark:text-dark-text">{{ timer.name }}</h4>
                    <span v-if="isReminderDue(timer)" class="text-xs font-medium text-accent-brine bg-accent-brine/15 px-2 py-0.5 rounded-full animate-pulse">Check!</span>
                  </div>
                  <p class="text-xs text-text-muted dark:text-dark-text-secondary mt-0.5">
                    Ends: {{ fmtDate(timer.endDate) }}
                    <span v-if="timer.notes"> · {{ timer.notes }}</span>
                  </p>
                </div>
                <div class="flex gap-1">
                  <button @click="markComplete(timer.id)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-culture hover:bg-accent-culture/10 transition-all" title="Mark complete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </button>
                  <button @click="deleteTimer(timer.id)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all" title="Delete">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>

              <!-- Countdown Display -->
              <div class="flex items-center gap-4">
                <div class="font-mono text-2xl font-medium text-accent-brine tracking-tight">
                  {{ countdown(timer).label }}
                </div>
              </div>

              <!-- Progress Bar -->
              <div>
                <div class="w-full bg-bg-secondary dark:bg-dark-secondary rounded-full h-2.5 overflow-hidden">
                  <div :class="['h-2.5 rounded-full transition-all duration-700', progressColor(timerProgress(timer))]"
                    :style="{ width: timerProgress(timer) + '%' }"></div>
                </div>
                <div class="flex justify-between text-xs text-text-muted mt-1">
                  <span>{{ timerProgress(timer) }}%</span>
                  <span v-if="timer.reminderDays">Check every {{ timer.reminderDays }}d</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Completed Timers -->
      <div v-if="completedTimers.length > 0" class="bg-bg-card dark:bg-dark-card rounded-2xl shadow-warm border border-bg-secondary/50 dark:border-dark-secondary overflow-hidden">
        <div class="px-6 py-4 border-b border-bg-secondary dark:border-dark-secondary">
          <h3 class="font-serif text-lg text-text-primary dark:text-dark-text">Completed Timers</h3>
        </div>
        <div class="divide-y divide-bg-secondary/50 dark:divide-dark-secondary">
          <div v-for="timer in completedTimers" :key="timer.id" class="px-5 py-3 flex items-center justify-between">
            <div>
              <span class="text-sm text-text-primary dark:text-dark-text">✅ {{ timer.name }}</span>
              <p class="text-xs text-text-muted">{{ fmtDateShort(timer.endDate) }}</p>
            </div>
            <button @click="deleteTimer(timer.id)" class="p-1.5 rounded-lg text-text-muted hover:text-accent-ferment hover:bg-accent-ferment/10 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
};
