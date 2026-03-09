/**
 * FERMENT — WelcomePage Component
 * Rich editorial scroll experience introducing fermentation and the app.
 * Shown on first visit, accessible via Settings afterward.
 */

const WelcomePageComponent = {
  name: 'welcome-page',

  emits: ['enter', 'open-recipe'],

  data() {
    return {
      observer: null,
    };
  },

  mounted() {
    // Intersection Observer for scroll-reveal
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          this.observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    this.$nextTick(() => {
      this.$el.querySelectorAll('.reveal-on-scroll').forEach(el => {
        this.observer.observe(el);
      });
    });
  },

  beforeUnmount() {
    if (this.observer) this.observer.disconnect();
  },

  methods: {
    enter() { this.$emit('enter'); },
    openStarter(id) { this.$emit('open-recipe', id); },
    scrollNext() {
      const el = this.$el.querySelector('#welcome-science');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    },
  },

  template: `
    <div class="welcome-page">

      <!-- ═══════════════ 1. HERO ═══════════════ -->
      <section class="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden bg-gradient-to-b from-stone-900 via-amber-950 to-stone-950">
        <div class="absolute inset-0 opacity-[0.04]" style="background-image: radial-gradient(circle at 30% 40%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.3) 0%, transparent 40%);"></div>
        <div class="relative z-10 max-w-2xl mx-auto">
          <div class="text-7xl sm:text-8xl mb-8 hero-jar">🫙</div>
          <h1 class="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-wider text-amber-100 mb-6" style="letter-spacing: 0.25em;">F E R M E N T</h1>
          <p class="font-serif text-xl sm:text-2xl text-amber-200/80 italic leading-relaxed mb-4">A cultural guide to the oldest<br>biotechnology on Earth.</p>
          <p class="text-amber-300/60 text-sm tracking-[0.3em] uppercase mt-6 mb-12">Salt · Time · Bacteria · Magic</p>
          <div class="flex flex-col sm:flex-row items-center gap-4">
            <button @click="scrollNext" class="px-8 py-3 bg-amber-200/10 hover:bg-amber-200/20 text-amber-100 border border-amber-200/20 rounded-xl text-sm font-medium transition-all duration-300 backdrop-blur-sm">
              Discover the science ↓
            </button>
            <button @click="enter" class="px-8 py-3 text-amber-300/50 hover:text-amber-200 text-sm transition-colors">
              Skip to recipes →
            </button>
          </div>
        </div>
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 text-amber-300/30 animate-bounce">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>
        </div>
      </section>

      <!-- ═══════════════ 2. THE SCIENCE ═══════════════ -->
      <section id="welcome-science" class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-brine text-sm font-medium tracking-widest uppercase mb-3">The Science</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">10,000 years before refrigerators</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary">
              <div class="text-4xl mb-4">🧪</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The Chemistry</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed"><strong class="text-text-primary dark:text-dark-text">Lacto-fermentation</strong> is controlled decomposition. Lactobacillus bacteria convert sugars into lactic acid, dropping pH below 4.6 — a level where pathogens cannot survive.</p>
              <p class="text-xs text-text-muted mt-3">No vinegar. No heat. No additives. Just salt, time, and trillions of invisible workers.</p>
            </div>

            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary" style="transition-delay: 100ms">
              <div class="text-4xl mb-4">🏺</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The History</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Every civilisation independently discovered fermentation. Koreans made <em>kimchi</em>. Germans made <em>sauerkraut</em>. Indians set <em>dahi</em>. Egyptians brewed beer. Ethiopians fermented teff for <em>injera</em>.</p>
              <p class="text-xs text-text-muted mt-3">It's not a trend. It's arguably the most important food technology humans ever developed.</p>
            </div>

            <div class="reveal-on-scroll p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary" style="transition-delay: 200ms">
              <div class="text-4xl mb-4">🌍</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-3">The Why</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Fermented foods contain <strong class="text-text-primary dark:text-dark-text">live bacteria</strong> that support digestion, immunity, and even mental health through the gut-brain axis.</p>
              <p class="text-xs text-text-muted mt-3">You're not just making food. You're cultivating an ecosystem.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 3. THE GUT ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-secondary/30 dark:bg-dark-secondary/30">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-culture text-sm font-medium tracking-widest uppercase mb-3">The Connection</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Your gut is a rainforest</h2>
          </div>

          <div class="space-y-8">
            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🦠</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Your gut contains <strong class="text-accent-brine">~38 trillion</strong> microorganisms — slightly more than your own human cells.</p>
                <p class="text-sm text-text-muted mt-1">You are, technically, more bacteria than person.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🧠</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">The gut produces <strong class="text-accent-brine">~95% of your body's serotonin</strong> — the "happiness hormone."</p>
                <p class="text-sm text-text-muted mt-1">The gut-brain axis is a two-way highway. What you feed your gut, you feed your mood.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🛡️</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed"><strong class="text-accent-brine">~70% of your immune system</strong> lives in your gut.</p>
                <p class="text-sm text-text-muted mt-1">Fermented foods introduce diverse beneficial bacteria that train and strengthen this defence network.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🔬</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Lactic acid bacteria from fermented foods <strong class="text-accent-brine">survive stomach acid</strong> and colonise the intestine.</p>
                <p class="text-sm text-text-muted mt-1">Unlike most probiotic supplements, they arrive alive.</p>
              </div>
            </div>

            <div class="reveal-on-scroll flex items-start gap-5 sm:gap-6">
              <span class="text-3xl sm:text-4xl flex-shrink-0 mt-1">🌱</span>
              <div>
                <p class="text-text-primary dark:text-dark-text leading-relaxed">Fermentation <strong class="text-accent-brine">increases bioavailability</strong> of nutrients — breaking down antinutrients like phytic acid.</p>
                <p class="text-sm text-text-muted mt-1">Iron, zinc, and B-vitamins become easier to absorb. The same food, more nutrition.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 4. APP TOUR ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-5xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-ferment text-sm font-medium tracking-widest uppercase mb-3">What's Inside</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Your fermentation companion</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="reveal-on-scroll feature-card p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-brine">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">📦</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Browse</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Recipes from 30+ countries, each with cultural context, step-by-step instructions, and the story behind the ferment. From German sauerkraut to Indian dahi to Salvadoran curtido.</p>
              <div class="flex items-center gap-2 mt-4">
                <span class="text-xs px-2 py-0.5 rounded-full bg-tier-beginner text-white">🌱 Beginner</span>
                <span class="text-xs text-text-muted">→</span>
                <span class="text-xs px-2 py-0.5 rounded-full bg-tier-master text-white">🔬 Master</span>
              </div>
            </div>

            <div class="reveal-on-scroll feature-card p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-culture">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">🫙</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Pantry</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Track what's in your kitchen. FERMENT matches your ingredients to recipes you can make <em>right now</em>. No more "I don't have the right stuff."</p>
            </div>

            <div class="reveal-on-scroll feature-card p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-ferment">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">📖</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Journal</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Log your batches. Track fermentation progress. Rate results. Build your personal history — what worked, what didn't, what exploded.</p>
            </div>

            <div class="reveal-on-scroll feature-card p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border-l-4 border-accent-aged">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">🔧</span>
                <h3 class="font-serif text-xl text-text-primary dark:text-dark-text">Tools</h3>
              </div>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed">Brine calculator. Batch scaler. Unit converter. pH reference. Seasonal calendar. A glossary of fermentation terms from cultures worldwide.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 5. PHILOSOPHY ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-gradient-to-b from-accent-aged/5 to-accent-brine/5 dark:from-accent-aged/10 dark:to-accent-brine/10">
        <div class="max-w-2xl mx-auto text-center reveal-on-scroll">
          <p class="text-accent-aged dark:text-accent-brine text-sm font-medium tracking-widest uppercase mb-6">The Philosophy</p>
          <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight mb-10">Slow down. Add salt. Wait.</h2>
          <div class="space-y-6 text-base sm:text-lg text-text-secondary dark:text-dark-text-secondary leading-relaxed font-serif">
            <p>Fermentation cannot be rushed, optimised, or disrupted. It operates on bacterial time.</p>
            <p>FERMENT is built on the belief that every culture on Earth independently discovered the same truth: <strong class="text-text-primary dark:text-dark-text">salt + time + patience = transformation.</strong></p>
            <p>Every recipe comes with its story — where it's from, why it matters, and the humans who've been making it for generations.</p>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 6. STARTER RECIPES ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-bg-primary dark:bg-dark-primary">
        <div class="max-w-4xl mx-auto">
          <div class="text-center mb-16 reveal-on-scroll">
            <p class="text-accent-culture text-sm font-medium tracking-widest uppercase mb-3">Begin</p>
            <h2 class="font-serif text-3xl sm:text-4xl text-text-primary dark:text-dark-text leading-tight">Pick your first ferment</h2>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <button @click="openStarter('sauerkraut-classic')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥬</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Sauerkraut</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">2 ingredients. 14 days. The gateway ferment for most of the Western world.</p>
              <span class="text-xs text-text-muted">Germany · 🌱 Beginner</span>
            </button>

            <button @click="openStarter('dahi-homemade')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1" style="transition-delay: 100ms">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥛</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Dahi</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">The one you already know. Now own the process. Set it tonight, have it by morning.</p>
              <span class="text-xs text-text-muted">India · 🌱 Beginner</span>
            </button>

            <button @click="openStarter('brine-pickles-basic')"
              class="reveal-on-scroll group text-left p-6 sm:p-8 rounded-2xl bg-bg-card dark:bg-dark-card border border-bg-secondary dark:border-dark-secondary hover:border-accent-brine/40 transition-all duration-300 hover:-translate-y-1" style="transition-delay: 200ms">
              <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🥒</div>
              <h3 class="font-serif text-xl text-text-primary dark:text-dark-text mb-2 group-hover:text-accent-aged dark:group-hover:text-accent-brine transition-colors">Brine Pickles</h3>
              <p class="text-sm text-text-secondary dark:text-dark-text-secondary leading-relaxed mb-3">Any vegetable + salt water. The simplest and most universal lacto-ferment in existence.</p>
              <span class="text-xs text-text-muted">Global · 🌱 Beginner</span>
            </button>
          </div>
        </div>
      </section>

      <!-- ═══════════════ 7. FOOTER CTA ═══════════════ -->
      <section class="py-20 sm:py-28 px-6 bg-gradient-to-b from-stone-900 via-amber-950 to-stone-950 text-center">
        <div class="max-w-2xl mx-auto reveal-on-scroll">
          <div class="text-5xl mb-8">🫙</div>
          <blockquote class="font-serif text-xl sm:text-2xl text-amber-200/80 italic leading-relaxed mb-10">
            "May your cultures be strong,<br>
            your brine be clear,<br>
            and your jars never explode."
          </blockquote>
          <button @click="enter"
            class="px-10 py-4 bg-amber-200/10 hover:bg-amber-200/20 text-amber-100 border border-amber-200/20 rounded-xl text-base font-medium transition-all duration-300 backdrop-blur-sm">
            Start Fermenting →
          </button>
        </div>
      </section>

    </div>
  `
};
