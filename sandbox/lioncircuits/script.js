/* ── Lion Circuits — Quote PWA App ── */

const { createApp } = Vue;

const app = createApp({

  data() {
    return {
      // ── Navigation
      currentStep: 0,
      entryPath: null,       // 'upload' | 'explore'
      isProMode: false,

      // ── Touch / swipe
      touchStartX: 0,
      touchStartY: 0,
      touchStartTime: 0,
      swipeOffset: 0,
      isSwiping: false,
      swipeDecided: false,
      viewportWidth: 375,

      // ── Tips
      activeTip: null,

      // ── File upload
      gerberFile: null,
      isDragOver: false,
      isAnalyzing: false,
      gerberDetected: false,

      // ── Board specs
      specs: {
        baseMaterial: 'fr4',
        layers: 2,
        width: 50,
        height: 40,
        quantity: 5,
        discreteDesign: 1,
        deliveryFormat: 'single',
        thickness: 1.6,
        maskColor: 'green',
        finish: 'hasl',
        copperThickness: 1,
      },

      // ── Delivery
      buildTime: '5-6',
      shipping: 'standard',

      // ── Cart state
      addedToCart: false,

      // ── PWA install
      deferredInstallPrompt: null,
    };
  },

  computed: {

    // ── Step definitions ──

    activeSteps() {
      const s = [{ id: 'welcome', title: 'Get Started', icon: 'fa-rocket', sub: 'Choose your path' }];
      if (this.entryPath === 'upload') {
        s.push({ id: 'upload', title: 'Upload Gerber', icon: 'fa-cloud-arrow-up', sub: 'Your design files' });
      }
      s.push(
        { id: 'board',    title: 'Board Basics',  icon: 'fa-microchip',      sub: 'Layers, size & quantity' },
        { id: 'specs',    title: 'Board Specs',   icon: 'fa-sliders',        sub: 'Thickness, copper & finish' },
        { id: 'look',     title: 'Board Look',    icon: 'fa-palette',        sub: 'Solder mask color' },
        { id: 'delivery', title: 'Delivery',      icon: 'fa-truck-fast',     sub: 'Build time & shipping' },
        { id: 'review',   title: 'Your Quote',    icon: 'fa-clipboard-check', sub: 'Review & order' },
      );
      return s;
    },

    step() {
      return this.activeSteps[this.currentStep] || {};
    },

    progress() {
      if (this.currentStep === 0) return 0;
      return (this.currentStep / (this.activeSteps.length - 1)) * 100;
    },

    isLastStep() { return this.currentStep === this.activeSteps.length - 1; },

    // ── Filtered catalog options ──

    layerOptions() {
      return this.isProMode
        ? [...API.catalog.layers.basic, ...API.catalog.layers.pro]
        : API.catalog.layers.basic;
    },

    thicknessOptions() {
      return this.isProMode
        ? API.catalog.thickness
        : API.catalog.thickness.filter((t) => !t.pro);
    },

    copperOptions() {
      return this.isProMode
        ? API.catalog.copper
        : API.catalog.copper.filter((c) => !c.pro);
    },

    finishOptions() {
      return this.isProMode
        ? API.catalog.finish
        : API.catalog.finish.filter((f) => !f.pro);
    },

    // ── Visual helpers ──

    maskColorHex() {
      const c = API.catalog.maskColors.find((m) => m.id === this.specs.maskColor);
      return c ? c.hex : '#1B7A2B';
    },

    silkscreenColor() {
      return this.specs.maskColor === 'white' ? '#333333' : '#FFFFFF';
    },

    finishLabel() {
      const f = API.catalog.finish.find((x) => x.id === this.specs.finish);
      return f ? f.label : this.specs.finish;
    },

    buildTimeLabel() {
      const b = API.catalog.buildTime.find((x) => x.id === this.buildTime);
      return b ? b.label : this.buildTime;
    },

    shippingLabel() {
      const s = API.catalog.shipping.find((x) => x.id === this.shipping);
      return s ? s.label + ' — ' + s.desc : '';
    },

    // ── Pricing ──

    pricing() {
      return API.pricing.calculate({
        ...this.specs,
        buildTime: this.buildTime,
        shipping: this.shipping,
      });
    },

    // ── Step validation ──

    canProceed() {
      const id = this.step.id;
      if (id === 'welcome') return !!this.entryPath;
      if (id === 'board') return this.specs.width > 0 && this.specs.height > 0 && this.specs.quantity > 0;
      return true;
    },

    // ── Track transform (swipe) ──

    trackStyle() {
      const base = -(this.currentStep * 100);
      const swipePct = this.viewportWidth > 0
        ? (this.swipeOffset / this.viewportWidth) * 100
        : 0;
      return {
        transform: `translateX(${base + swipePct}%)`,
        transition: this.isSwiping ? 'none' : 'transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    },
  },

  methods: {

    // ── Navigation ──

    selectPath(path) {
      this.entryPath = path;
      this.$nextTick(() => { this.currentStep = 1; });
    },

    nextStep() {
      if (!this.canProceed || this.isLastStep) return;
      this.activeTip = null;
      this.currentStep++;
    },

    prevStep() {
      if (this.currentStep <= 0) return;
      this.activeTip = null;
      this.currentStep--;
    },

    goToStep(i) {
      if (i < this.currentStep) {
        this.activeTip = null;
        this.currentStep = i;
      }
    },

    // ── Tips ──

    toggleTip(key) {
      this.activeTip = this.activeTip === key ? null : key;
    },

    tip(key) {
      return API.tips[key] || '';
    },

    // ── File upload ──

    triggerFileInput() {
      this.$refs.fileInput?.click();
    },

    handleDragOver(e) {
      e.preventDefault();
      this.isDragOver = true;
    },

    handleDragLeave() {
      this.isDragOver = false;
    },

    handleDrop(e) {
      e.preventDefault();
      this.isDragOver = false;
      const file = e.dataTransfer?.files?.[0];
      if (file) this.processFile(file);
    },

    handleFileSelect(e) {
      const file = e.target?.files?.[0];
      if (file) this.processFile(file);
    },

    async processFile(file) {
      this.gerberFile = {
        name: file.name,
        size: this.formatFileSize(file.size),
      };
      this.isAnalyzing = true;
      this.gerberDetected = false;

      try {
        const result = await API.gerber.analyze(file);
        this.specs.layers = result.layers;
        this.specs.width  = result.width;
        this.specs.height = result.height;
        this.gerberDetected = true;
      } finally {
        this.isAnalyzing = false;
      }
    },

    removeFile() {
      this.gerberFile = null;
      this.gerberDetected = false;
      this.isAnalyzing = false;
      if (this.$refs.fileInput) this.$refs.fileInput.value = '';
    },

    async downloadSample() {
      try {
        const blob = await API.gerber.sampleZipBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-gerber-50x40mm-2layer.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        alert('Could not generate sample file. Please ensure JSZip is loaded.');
      }
    },

    // ── Touch / swipe ──

    handleTouchStart(e) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
      this.isSwiping = false;
      this.swipeDecided = false;
      this.swipeOffset = 0;
    },

    handleTouchMove(e) {
      const dx = e.touches[0].clientX - this.touchStartX;
      const dy = e.touches[0].clientY - this.touchStartY;

      if (!this.swipeDecided) {
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
          this.swipeDecided = true;
          this.isSwiping = Math.abs(dx) > Math.abs(dy);
        }
        return;
      }

      if (!this.isSwiping) return;

      e.preventDefault();

      const atStart = this.currentStep === 0;
      const atEnd   = this.currentStep === this.activeSteps.length - 1;

      if ((atStart && dx > 0) || (atEnd && dx < 0)) {
        this.swipeOffset = dx * 0.25;
      } else {
        this.swipeOffset = dx;
      }
    },

    handleTouchEnd() {
      if (!this.isSwiping) {
        this.swipeOffset = 0;
        return;
      }

      const elapsed   = Date.now() - this.touchStartTime;
      const velocity  = Math.abs(this.swipeOffset / elapsed);
      const threshold = velocity > 0.4 ? 40 : this.viewportWidth * 0.25;

      if (this.swipeOffset > threshold && this.currentStep > 0) {
        this.prevStep();
      } else if (this.swipeOffset < -threshold && this.canProceed && !this.isLastStep) {
        this.nextStep();
      }

      this.swipeOffset = 0;
      this.isSwiping = false;
      this.swipeDecided = false;
    },

    // ── Cart ──

    addToCart() {
      this.addedToCart = true;
    },

    startOver() {
      this.currentStep = 0;
      this.entryPath = null;
      this.isProMode = false;
      this.activeTip = null;
      this.gerberFile = null;
      this.isDragOver = false;
      this.isAnalyzing = false;
      this.gerberDetected = false;
      this.addedToCart = false;
      this.specs = {
        baseMaterial: 'fr4', layers: 2, width: 50, height: 40,
        quantity: 5, discreteDesign: 1, deliveryFormat: 'single',
        thickness: 1.6, maskColor: 'green', finish: 'hasl', copperThickness: 1,
      };
      this.buildTime = '5-6';
      this.shipping = 'standard';
    },

    // ── Formatting ──

    formatPrice(n) {
      if (n == null) return '₹0';
      return '₹' + Number(n).toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    },

    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(2) + ' MB';
    },

    // ── PWA install ──

    async promptInstall() {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      await this.deferredInstallPrompt.userChoice;
      this.deferredInstallPrompt = null;
    },

    handleResize() {
      this.viewportWidth = window.innerWidth;
    },
  },

  mounted() {
    this.viewportWidth = window.innerWidth;
    window.addEventListener('resize', this.handleResize);

    const viewport = this.$refs.viewport;
    if (viewport) {
      viewport.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
});

app.mount('#app');
