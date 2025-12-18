/* ═══════════════════════════════════════════════════════════════════════════
   THE RED THREAD v2 — Main Script
   Where the magic comes together.
   ═══════════════════════════════════════════════════════════════════════════ */

const { createApp, ref, reactive, computed, onMounted, onUnmounted } = Vue;
// const { AnimationUtils, ScrollUtils, PhysicsUtils, ObserverFactory, DOMUtils, ScrollTypography } = window.RedThread;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VUE APPLICATION
 * ═══════════════════════════════════════════════════════════════════════════
 */

const app = createApp({
  setup() {
    // ═══════════════════════════════════════════════════════════════════════
    // GLOBAL STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const scrollProgress = ref(0);
    const sectionScrollProgress = ref(0);

    // ═══════════════════════════════════════════════════════════════════════
    // §3: MICRO INTERACTIONS STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const activeInteraction = ref('button');
    const toggleState = ref(false);
    const checkboxState = ref(false);
    const inputValue = ref('');
    const showNotification = ref(false);
    const likeState = ref(false);
    const accordionOpen = ref(false);

    const interactions = {
      button: { name: 'Button', icon: 'fas fa-hand-pointer' },
      toggle: { name: 'Toggle', icon: 'fas fa-toggle-on' },
      checkbox: { name: 'Checkbox', icon: 'fas fa-check-square' },
      input: { name: 'Input', icon: 'fas fa-keyboard' },
      link: { name: 'Link', icon: 'fas fa-link' },
      card: { name: 'Card', icon: 'fas fa-square' },
      loading: { name: 'Loading', icon: 'fas fa-spinner' },
      notification: { name: 'Notification', icon: 'fas fa-bell' },
      like: { name: 'Like', icon: 'fas fa-heart' },
      accordion: { name: 'Accordion', icon: 'fas fa-chevron-down' },
    };

    // Auto-hide notification
    const triggerNotification = () => {
      showNotification.value = true;
      setTimeout(() => {
        showNotification.value = false;
      }, 3000);
    };

    // ═══════════════════════════════════════════════════════════════════════
    // §4: PHYSICS STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const physicsPaused = ref(false);
    let mouseFollower = null;

    const addPhysicsObject = (event) => {
      // Create ripple effect on click
      const canvas = document.getElementById('physics-canvas');
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: 20px;
        height: 20px;
        background: rgba(199, 62, 58, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%) scale(0);
        animation: rippleOut 0.6s ease-out forwards;
        pointer-events: none;
      `;
      canvas.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    const resetPhysics = () => {
      // Reset animations by toggling a class
      const canvas = document.getElementById('physics-canvas');
      canvas.style.animation = 'none';
      canvas.offsetHeight; // Force reflow
      canvas.style.animation = '';
      
      // Reset all child animations too
      canvas.querySelectorAll('*').forEach(el => {
        el.style.animation = 'none';
        el.offsetHeight;
        el.style.animation = '';
      });
    };

    const pausePhysics = () => {
      physicsPaused.value = !physicsPaused.value;
      const canvas = document.getElementById('physics-canvas');
      const state = physicsPaused.value ? 'paused' : 'running';
      
      canvas.querySelectorAll('.physics-ball, .physics-pendulum, .orbit-satellite').forEach(el => {
        el.style.animationPlayState = state;
      });
    };

    // ═══════════════════════════════════════════════════════════════════════
    // §6: FOOTER STATE
    // ═══════════════════════════════════════════════════════════════════════
    
    const footerPrimitives = reactive([
      { size: 60, x: 20, y: 30 },
      { size: 40, x: 70, y: 60 },
      { size: 80, x: 40, y: 80 },
      { size: 30, x: 85, y: 25 },
      { size: 50, x: 15, y: 70 },
      { size: 35, x: 60, y: 15 },
      { size: 45, x: 30, y: 50 },
      { size: 25, x: 80, y: 75 },
    ]);

    const mousePos = reactive({ x: 0.5, y: 0.5 });
    const edgeGlow = reactive({ left: 0, right: 0, top: 0, bottom: 0 });

    const handleFooterMouse = (event) => {
      const footer = event.currentTarget;
      const rect = footer.getBoundingClientRect();
      
      mousePos.x = (event.clientX - rect.left) / rect.width;
      mousePos.y = (event.clientY - rect.top) / rect.height;

      // Edge glow based on mouse proximity to edges
      const edgeThreshold = 0.15;
      edgeGlow.left = mousePos.x < edgeThreshold ? 1 - (mousePos.x / edgeThreshold) : 0;
      edgeGlow.right = mousePos.x > (1 - edgeThreshold) ? (mousePos.x - (1 - edgeThreshold)) / edgeThreshold : 0;
      edgeGlow.top = mousePos.y < edgeThreshold ? 1 - (mousePos.y / edgeThreshold) : 0;
      edgeGlow.bottom = mousePos.y > (1 - edgeThreshold) ? (mousePos.y - (1 - edgeThreshold)) / edgeThreshold : 0;
    };

    const getPrimStyle = (prim, index) => {
      // Calculate offset based on mouse position (flee from cursor)
      const dx = (mousePos.x - prim.x / 100) * 50;
      const dy = (mousePos.y - prim.y / 100) * 50;
      
      return {
        width: `${prim.size}px`,
        height: `${prim.size}px`,
        left: `${prim.x}%`,
        top: `${prim.y}%`,
        transform: `translate(-50%, -50%) translate(${-dx}px, ${-dy}px)`,
        opacity: 0.3 + (index % 3) * 0.1,
      };
    };

    // Magnetic button
    const magneticBtn = ref(null);
    
    const handleMagneticBtn = (event) => {
      const btn = event.currentTarget;
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = event.clientX - centerX;
      const distY = event.clientY - centerY;
      
      btn.style.transform = `translate(${distX * 0.2}px, ${distY * 0.2}px)`;
    };

    const resetMagneticBtn = (event) => {
      event.currentTarget.style.transform = 'translate(0, 0)';
    };

    // ═══════════════════════════════════════════════════════════════════════
    // LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    
    let revealObserver;
    let scrollTypographyDestroy;

    onMounted(() => {
      // Initialize reveal observer
      revealObserver = ObserverFactory.createRevealObserver({
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
      });
      ObserverFactory.observeAll('.section-reveal', revealObserver);

      // Initialize scroll progress
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll(); // Initial call

      // Initialize scroll typography
      scrollTypographyDestroy = ScrollTypography.init('#scroll');

      // Initialize physics mouse follower
      const follower = document.getElementById('spring-follower');
      const canvas = document.getElementById('physics-canvas');
      
      if (follower && canvas) {
        mouseFollower = PhysicsUtils.createMouseFollower(follower, {
          stiffness: 120,
          damping: 12
        });

        canvas.addEventListener('mousemove', (e) => {
          const rect = canvas.getBoundingClientRect();
          mouseFollower.moveTo(
            e.clientX - rect.left,
            e.clientY - rect.top
          );
        });
      }

      // Smooth scroll for nav links
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          e.preventDefault();
          const target = document.querySelector(anchor.getAttribute('href'));
          if (target) {
            ScrollUtils.scrollTo(target, 80);
          }
        });
      });

      // Add ripple keyframe animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes rippleOut {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    });

    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
      if (mouseFollower) mouseFollower.destroy();
      if (scrollTypographyDestroy) scrollTypographyDestroy.destroy();
    });

    // ═══════════════════════════════════════════════════════════════════════
    // SCROLL HANDLERS
    // ═══════════════════════════════════════════════════════════════════════
    
    const handleScroll = () => {
      // Global progress
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollProgress.value = (scrollTop / docHeight) * 100;

      // Section-specific progress for §5
      const scrollSection = document.getElementById('scroll');
      if (scrollSection) {
        const rect = scrollSection.getBoundingClientRect();
        const sectionHeight = scrollSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        const sectionTop = -rect.top;
        const scrollableDistance = sectionHeight - viewportHeight;
        sectionScrollProgress.value = AnimationUtils.clamp(
          (sectionTop / scrollableDistance) * 100,
          0,
          100
        );
      }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RETURN
    // ═══════════════════════════════════════════════════════════════════════
    
    return {
      // Global
      scrollProgress,
      sectionScrollProgress,

      // Micro interactions
      activeInteraction,
      interactions,
      toggleState,
      checkboxState,
      inputValue,
      showNotification,
      likeState,
      accordionOpen,

      // Physics
      physicsPaused,
      addPhysicsObject,
      resetPhysics,
      pausePhysics,

      // Footer
      footerPrimitives,
      edgeGlow,
      handleFooterMouse,
      getPrimStyle,
      magneticBtn,
      handleMagneticBtn,
      resetMagneticBtn,
    };
  }
});

// Mount the app
app.mount('#app');