/* ═══════════════════════════════════════════════════════════════════════════
   THE RED THREAD v2 — App Abstractions
   Reusable utilities that make the chaos manageable.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANIMATION UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */

const AnimationUtils = {
  /**
   * Easing functions for smooth animations
   */
  easing: {
    linear: t => t,
    easeOut: t => 1 - Math.pow(1 - t, 3),
    easeIn: t => t * t * t,
    easeInOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    spring: (t, damping = 0.5) => {
      const s = 1 - damping;
      return 1 - Math.exp(-6 * t) * Math.cos(12 * t * s);
    },
    bounce: t => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  /**
   * Request Animation Frame wrapper with cancel support
   */
  animate({ duration, onUpdate, onComplete, easing = 'easeOut' }) {
    const start = performance.now();
    const easeFn = typeof easing === 'function' ? easing : this.easing[easing];
    let rafId;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeFn(progress);

      onUpdate(easedProgress, progress);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else if (onComplete) {
        onComplete();
      }
    };

    rafId = requestAnimationFrame(tick);

    return {
      cancel: () => cancelAnimationFrame(rafId)
    };
  },

  /**
   * Stagger animation for multiple elements
   */
  stagger(elements, { delay = 100, animation, onComplete }) {
    elements.forEach((el, i) => {
      setTimeout(() => {
        animation(el, i);
        if (i === elements.length - 1 && onComplete) {
          onComplete();
        }
      }, i * delay);
    });
  },

  /**
   * Lerp (Linear Interpolation)
   */
  lerp(start, end, factor) {
    return start + (end - start) * factor;
  },

  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Map value from one range to another
   */
  mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCROLL UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ScrollUtils = {
  /**
   * Get scroll progress (0-1) for an element
   */
  getProgress(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = rect.height;
    
    // Element top relative to viewport
    const top = rect.top;
    
    // Calculate progress: 0 when element enters, 1 when it leaves
    const start = windowHeight; // Element enters from bottom
    const end = -elementHeight; // Element leaves from top
    
    const progress = AnimationUtils.mapRange(top, start, end, 0, 1);
    return AnimationUtils.clamp(progress, 0, 1);
  },

  /**
   * Get element visibility (0-1)
   */
  getVisibility(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    const visibleTop = Math.max(0, rect.top);
    const visibleBottom = Math.min(windowHeight, rect.bottom);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    
    return visibleHeight / rect.height;
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element, threshold = 0) {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    return (
      rect.top < windowHeight - threshold &&
      rect.bottom > threshold
    );
  },

  /**
   * Smooth scroll to element
   */
  scrollTo(element, offset = 0) {
    const top = element.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  },

  /**
   * Create scroll-linked animation
   */
  createScrollLinked(element, { onProgress, threshold = 0.2 }) {
    let ticking = false;

    const update = () => {
      if (!ScrollUtils.isInViewport(element, -100)) {
        ticking = false;
        return;
      }

      const progress = ScrollUtils.getProgress(element);
      onProgress(progress, element);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return {
      destroy: () => window.removeEventListener('scroll', onScroll)
    };
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PHYSICS UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */

const PhysicsUtils = {
  /**
   * Spring simulation
   */
  createSpring({ stiffness = 100, damping = 10, mass = 1 }) {
    let velocity = 0;
    let position = 0;
    let target = 0;

    return {
      setTarget(newTarget) {
        target = newTarget;
      },

      update(deltaTime = 1/60) {
        const displacement = target - position;
        const springForce = stiffness * displacement;
        const dampingForce = -damping * velocity;
        const acceleration = (springForce + dampingForce) / mass;
        
        velocity += acceleration * deltaTime;
        position += velocity * deltaTime;

        return position;
      },

      getPosition() {
        return position;
      },

      setPosition(newPosition) {
        position = newPosition;
        velocity = 0;
      },

      isSettled(threshold = 0.01) {
        return Math.abs(target - position) < threshold && Math.abs(velocity) < threshold;
      }
    };
  },

  /**
   * Simple gravity simulation
   */
  createGravity({ gravity = 980, bounce = 0.7, friction = 0.99 }) {
    return {
      update(obj, deltaTime = 1/60, bounds = {}) {
        // Apply gravity
        obj.vy = (obj.vy || 0) + gravity * deltaTime;
        
        // Apply friction
        obj.vx = (obj.vx || 0) * friction;
        obj.vy *= friction;

        // Update position
        obj.x += obj.vx * deltaTime;
        obj.y += obj.vy * deltaTime;

        // Bounce off bounds
        if (bounds.bottom && obj.y > bounds.bottom) {
          obj.y = bounds.bottom;
          obj.vy = -obj.vy * bounce;
        }
        if (bounds.top && obj.y < bounds.top) {
          obj.y = bounds.top;
          obj.vy = -obj.vy * bounce;
        }
        if (bounds.left && obj.x < bounds.left) {
          obj.x = bounds.left;
          obj.vx = -obj.vx * bounce;
        }
        if (bounds.right && obj.x > bounds.right) {
          obj.x = bounds.right;
          obj.vx = -obj.vx * bounce;
        }

        return obj;
      }
    };
  },

  /**
   * Mouse follower with spring physics
   */
  createMouseFollower(element, { stiffness = 150, damping = 15 }) {
    const springX = this.createSpring({ stiffness, damping });
    const springY = this.createSpring({ stiffness, damping });
    let rafId;
    let isRunning = false;

    const update = () => {
      const x = springX.update();
      const y = springY.update();

      element.style.left = `${x}px`;
      element.style.top = `${y}px`;

      if (!springX.isSettled() || !springY.isSettled()) {
        rafId = requestAnimationFrame(update);
      } else {
        isRunning = false;
      }
    };

    return {
      moveTo(x, y) {
        springX.setTarget(x);
        springY.setTarget(y);

        if (!isRunning) {
          isRunning = true;
          rafId = requestAnimationFrame(update);
        }
      },

      destroy() {
        cancelAnimationFrame(rafId);
      }
    };
  },

  /**
   * Magnetic effect for buttons
   */
  createMagnetic(element, { strength = 0.3, radius = 100 }) {
    let bounds;

    const updateBounds = () => {
      bounds = element.getBoundingClientRect();
    };

    const onMouseMove = (e) => {
      if (!bounds) updateBounds();

      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const distance = Math.sqrt(distX * distX + distY * distY);

      if (distance < radius) {
        const factor = 1 - distance / radius;
        const moveX = distX * strength * factor;
        const moveY = distY * strength * factor;
        element.style.transform = `translate(${moveX}px, ${moveY}px)`;
      }
    };

    const onMouseLeave = () => {
      element.style.transform = 'translate(0, 0)';
    };

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('resize', updateBounds);

    return {
      destroy() {
        element.removeEventListener('mousemove', onMouseMove);
        element.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('resize', updateBounds);
      }
    };
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERSECTION OBSERVER FACTORY
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ObserverFactory = {
  /**
   * Create reveal observer for fade-in animations
   */
  createRevealObserver({ threshold = 0.2, rootMargin = '0px', once = true } = {}) {
    return new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          if (once) {
            observer.unobserve(entry.target);
          }
        } else if (!once) {
          entry.target.classList.remove('visible');
        }
      });
    }, { threshold, rootMargin });
  },

  /**
   * Observe multiple elements
   */
  observeAll(selector, observer) {
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * DOM UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 */

const DOMUtils = {
  /**
   * Get mouse position relative to element
   */
  getRelativeMousePos(element, event) {
    const rect = element.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      normalizedX: (event.clientX - rect.left) / rect.width,
      normalizedY: (event.clientY - rect.top) / rect.height
    };
  },

  /**
   * Get distance between two points
   */
  getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  },

  /**
   * Throttle function calls
   */
  throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  },

  /**
   * Debounce function calls
   */
  debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Generate random number in range
   */
  random(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Generate random integer in range
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCROLL TYPOGRAPHY EFFECTS
 * ═══════════════════════════════════════════════════════════════════════════
 */

const ScrollTypography = {
  /**
   * Apply scroll-based effects to typography
   */
  effects: {
    'zoom-in': (element, progress) => {
      // Start from far away, zoom to normal at 0.5, zoom past at 1
      const scale = AnimationUtils.mapRange(progress, 0, 0.5, 0.1, 1);
      const opacity = AnimationUtils.mapRange(progress, 0, 0.3, 0, 1);
      const blur = AnimationUtils.mapRange(progress, 0, 0.3, 10, 0);
      
      element.style.transform = `scale(${Math.max(scale, 0.1)})`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
      element.style.filter = `blur(${Math.max(blur, 0)}px)`;
    },

    'rotate': (element, progress) => {
      const rotation = AnimationUtils.mapRange(progress, 0.2, 0.8, -180, 0);
      const opacity = AnimationUtils.mapRange(progress, 0.2, 0.4, 0, 1);
      
      element.style.transform = `rotate(${rotation}deg)`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
    },

    'scale-up': (element, progress) => {
      const scale = AnimationUtils.mapRange(progress, 0.3, 0.7, 0.3, 1);
      const opacity = AnimationUtils.mapRange(progress, 0.3, 0.5, 0, 1);
      
      element.style.transform = `scale(${AnimationUtils.clamp(scale, 0.3, 1.5)})`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
    },

    'slide-left': (element, progress) => {
      const x = AnimationUtils.mapRange(progress, 0.3, 0.6, 100, 0);
      const opacity = AnimationUtils.mapRange(progress, 0.3, 0.5, 0, 1);
      
      element.style.transform = `translateX(${x}%)`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
    },

    'slide-right': (element, progress) => {
      const x = AnimationUtils.mapRange(progress, 0.4, 0.7, -100, 0);
      const opacity = AnimationUtils.mapRange(progress, 0.4, 0.6, 0, 1);
      
      element.style.transform = `translateX(${x}%)`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
    },

    'fade-scale': (element, progress) => {
      const scale = AnimationUtils.mapRange(progress, 0.4, 0.7, 0.8, 1);
      const opacity = AnimationUtils.mapRange(progress, 0.4, 0.6, 0, 1);
      const y = AnimationUtils.mapRange(progress, 0.4, 0.7, 50, 0);
      
      element.style.transform = `scale(${scale}) translateY(${y}px)`;
      element.style.opacity = AnimationUtils.clamp(opacity, 0, 1);
    }
  },

  /**
   * Initialize scroll typography for a section
   */
  init(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    const elements = section.querySelectorAll('[data-scroll-effect]');
    
    const onScroll = DOMUtils.throttle(() => {
      const sectionRect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const scrollTop = -sectionRect.top;
      const scrollableHeight = sectionHeight - window.innerHeight;
      const sectionProgress = AnimationUtils.clamp(scrollTop / scrollableHeight, 0, 1);

      elements.forEach(el => {
        const effect = el.dataset.scrollEffect;
        const elRect = el.getBoundingClientRect();
        const elTop = elRect.top - sectionRect.top + scrollTop;
        const elProgress = AnimationUtils.clamp(elTop / scrollableHeight, 0, 1);
        
        // Use section-relative progress for element
        const relativeProgress = AnimationUtils.clamp(
          (sectionProgress * scrollableHeight - (elTop - window.innerHeight)) / window.innerHeight,
          0,
          1
        );

        if (this.effects[effect]) {
          this.effects[effect](el, sectionProgress);
        }
      });
    }, 16);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial call

    return {
      destroy: () => window.removeEventListener('scroll', onScroll)
    };
  }
};


/**
 * ═══════════════════════════════════════════════════════════════════════════
 * EXPORT (Global Scope for non-module usage)
 * ═══════════════════════════════════════════════════════════════════════════
 */

window.RedThread = {
  AnimationUtils,
  ScrollUtils,
  PhysicsUtils,
  ObserverFactory,
  DOMUtils,
  ScrollTypography
};