/**
 * MOTION.DEV SHOWCASE
 *
 * A comprehensive demonstration of motion.dev animation capabilities
 * Built with MONO design constraints:
 * - Space Mono (monospace font only)
 * - Black, white, and grayscale colors
 * - Typography-first design
 * - High performance animations
 *
 * Features showcased:
 * - animate() - Core animation function
 * - scroll() - Scroll-linked animations
 * - inView() - Viewport-triggered animations
 * - stagger() - Sequential delays
 * - timeline() - Coordinated sequences
 * - spring() - Physics-based easing
 * - Interactive event-driven animations
 * - Performance with many elements
 */

import {
  animate,
  scroll,
  inView,
  stagger,
  spring,
} from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

// ============================================
// PHASE 1: EXISTING ANIMATIONS (REFINED)
// ============================================

// Hero Typography - Infinite rotation with smooth scaling
animate(
  "#heading",
  { rotate: 360, opacity: [0.75, 1, 0.75], scale: [1, 16.15, 1] },
  { duration: 12, repeat: Infinity, easing: "ease-in-out" }
);

// SIZE heading pulse
animate(
  ".sizes .heading",
  { opacity: [1, 0.5, 1] },
  {
    duration: 3,
    repeat: Infinity,
    easing: "ease-in-out",
    delay: 0.5,
  }
);

// Fixed scroll animation - Scale text sizes on scroll
scroll(
  animate(".sizes .space-y-6 div", {
    scale: [0.8, 1.1],
    opacity: [0.6, 1],
  }),
  {
    target: document.querySelector(".sizes"),
    offset: ["start end", "end start"],
  }
);

// ============================================
// PHASE 2: SCROLL ANIMATIONS
// ============================================

// Scroll progress bar
scroll(animate(".scroll-progress", { scaleX: [0, 1] }));

// Scroll reveal animations - fade and slide up
scroll(
  animate(".scroll-reveal-1", {
    opacity: [0, 1],
    y: [100, 0],
  }),
  {
    target: document.querySelector(".scroll-reveal-1"),
    offset: ["start 0.8", "start 0.5"],
  }
);

scroll(
  animate(".scroll-reveal-2", {
    opacity: [0, 1],
    y: [100, 0],
  }),
  {
    target: document.querySelector(".scroll-reveal-2"),
    offset: ["start 0.8", "start 0.5"],
  }
);

scroll(
  animate(".scroll-reveal-3", {
    opacity: [0, 1],
    y: [100, 0],
  }),
  {
    target: document.querySelector(".scroll-reveal-3"),
    offset: ["start 0.8", "start 0.5"],
  }
);

// Parallax layers - different scroll speeds
scroll(animate(".parallax-back", { y: [0, -400] }), {
  target: document.querySelector(".parallax-back").parentElement,
  offset: ["start end", "end start"],
});

scroll(animate(".parallax-mid", { y: [0, -100] }), {
  target: document.querySelector(".parallax-mid").parentElement,
  offset: ["start end", "end start"],
});

scroll(animate(".parallax-front", { y: [0, 200] }), {
  target: document.querySelector(".parallax-front").parentElement,
  offset: ["start end", "end start"],
});

// Scale on scroll
scroll(animate(".scroll-scale", { scale: [0.5, 1.2] }), {
  target: document.querySelector(".scroll-scale"),
  offset: ["start 0.9", "start 0.3"],
});

// ============================================
// PHASE 2: INVIEW ANIMATIONS
// ============================================

// InView - Simple fade in
inView(".inview-1", ({ target }) => {
  animate(target, { opacity: [0, 1], y: [50, 0] }, { duration: 0.8 });
});

// InView - Slide in from left
inView(".inview-2", ({ target }) => {
  animate(
    target,
    { opacity: [0, 1], x: [-200, 0] },
    { duration: 0.8, easing: "ease-out" }
  );
});

// InView - Scale and rotate
inView(".inview-3", ({ target }) => {
  animate(
    target,
    { opacity: [0, 1], scale: [0.5, 1], rotate: [-10, 0] },
    { duration: 1, easing: "ease-out" }
  );
});

// InView - Bounce with spring
inView(".inview-4", ({ target }) => {
  animate(
    target,
    { opacity: [0, 1], scale: [0, 1] },
    { duration: 0.8, easing: spring({ stiffness: 300, damping: 15 }) }
  );
});

// ============================================
// PHASE 2: STAGGER ANIMATIONS
// ============================================

// Grid stagger - cascade effect
inView(".stagger-grid", () => {
  animate(
    ".stagger-grid > div",
    { opacity: [0, 1], scale: [0.8, 1], y: [20, 0] },
    {
      delay: stagger(0.1),
      duration: 0.5,
      easing: "ease-out",
    }
  );
});

// Word stagger - sequential reveal
inView(".stagger-words", () => {
  animate(
    ".stagger-words span",
    { opacity: [0, 1], y: [30, 0] },
    {
      delay: stagger(0.15),
      duration: 0.6,
      easing: "ease-out",
    }
  );
});

// Letter stagger - character by character
inView(".stagger-letters", () => {
  animate(
    ".stagger-letters span",
    { opacity: [0, 1], scale: [0, 1], rotate: [45, 0] },
    {
      delay: stagger(0.08),
      duration: 0.5,
      easing: "linear",
    }
  );
});

// ============================================
// PHASE 3: TRANSFORM SHOWCASE
// ============================================

// 3D rotation on scroll
scroll(
  animate(".transform-3d", {
    rotateY: [0, 360],
    rotateX: [0, 45, 0],
  }),
  {
    target: document.querySelector(".transform-3d"),
    offset: ["start 0.8", "end 0.2"],
  }
);

// Scale on scroll
scroll(
  animate(".transform-scale", {
    scale: [0.3, 2, 0.3],
  }),
  {
    target: document.querySelector(".transform-scale"),
    offset: ["start 0.8", "end 0.2"],
  }
);

// Skew on scroll
scroll(
  animate(".transform-skew", {
    skewY: [-20, 20],
    skewX: [-10, 10],
  }),
  {
    target: document.querySelector(".transform-skew"),
    offset: ["start 0.8", "end 0.2"],
  }
);

// Combined transforms on scroll
scroll(
  animate(".transform-combined", {
    rotate: [0, 360],
    scale: [0.5, 1.5, 0.5],
    skewX: [-20, 20, -20],
    y: [-100, 100, -100],
  }),
  {
    target: document.querySelector(".transform-combined"),
    offset: ["start 0.8", "end 0.2"],
  }
);

// ============================================
// PHASE 4: INTERACTIVE ANIMATIONS
// ============================================

// Hover scale effect
const hoverEl = document.querySelector(".interactive-hover");
hoverEl.addEventListener("mouseenter", () => {
  animate(hoverEl, { scale: 1.15 }, { duration: 0.3, easing: "ease-out" });
});
hoverEl.addEventListener("mouseleave", () => {
  animate(hoverEl, { scale: 1 }, { duration: 0.3, easing: "ease-in" });
});

// Click rotate effect
const clickEl = document.querySelector(".interactive-click");
clickEl.addEventListener("click", () => {
  animate(clickEl, { rotate: 360 }, { duration: 2.6, easing: "ease-in" });
});

// Magnetic effect - follows cursor
const magneticContainer = document.querySelector(
  ".interactive-magnetic-container"
);
const magneticEl = document.querySelector(".interactive-magnetic");
magneticContainer.addEventListener("mousemove", (e) => {
  const rect = magneticContainer.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  animate(
    magneticEl,
    { x: x * 0.3, y: y * 0.3 },
    { duration: 0.3, easing: "ease-out" }
  );
});
magneticContainer.addEventListener("mouseleave", () => {
  animate(magneticEl, { x: 0, y: 0 }, { duration: 0.5, easing: "ease-out" });
});

// Grid interaction - hover effect on each item
document.querySelectorAll(".interactive-grid-item").forEach((item) => {
  item.addEventListener("mouseenter", () => {
    animate(
      item,
      { scale: 1.1, rotate: 5, backgroundColor: "#000000", color: "#ffffff" },
      { duration: 0.2 }
    );
  });
  item.addEventListener("mouseleave", () => {
    animate(
      item,
      { scale: 1, rotate: 0, backgroundColor: "#ffffff", color: "#000000" },
      { duration: 0.2 }
    );
  });
  item.addEventListener("click", () => {
    animate(
      item,
      { scale: [1, 0.9, 1.1, 1], rotate: [0, -10, 10, 0] },
      { duration: 0.4, easing: spring({ stiffness: 400, damping: 15 }) }
    );
  });
});

// ============================================
// PHASE 4: PERFORMANCE SHOWCASE
// ============================================

// Create particle text grid
const particleContainer = document.querySelector(".particle-container");
const letters = "MOTION";
for (let i = 0; i < 100; i++) {
  const particle = document.createElement("div");
  particle.className = "text-2xl font-bold opacity-20";
  particle.textContent = letters[Math.floor(Math.random() * letters.length)];
  particleContainer.appendChild(particle);
}

// Animate particles on scroll
scroll(
  animate(
    ".particle-container > div",
    {
      opacity: [0.1, 1, 0.1],
      scale: [0.8, 1.2, 0.8],
      rotate: [-45, 45],
    },
    {
      delay: stagger(0.02, { from: "center" }),
    }
  ),
  {
    target: particleContainer,
    offset: ["start 0.8", "end 0.2"],
  }
);

// Create mass animated grid
const massGrid = document.querySelector(".mass-grid");
for (let i = 0; i < 144; i++) {
  const box = document.createElement("div");
  box.className = "aspect-square bg-white";
  massGrid.appendChild(box);
}

// Animate mass grid on scroll
scroll(
  animate(
    ".mass-grid > div",
    {
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
    },
    {
      delay: stagger(0.01, { from: "first" }),
    }
  ),
  {
    target: massGrid,
    offset: ["start 0.8", "end 0.2"],
  }
);

// Create floating letters
const floatingContainer = document.querySelector(".floating-container");
const floatingLetters = "Typography is what language looks like.";
for (let i = 0; i < 50; i++) {
  const letter = document.createElement("div");
  letter.className = "absolute text-4xl font-bold";
  letter.textContent =
    floatingLetters[Math.floor(Math.random() * floatingLetters.length)];
  letter.style.left = Math.random() * 100 + "%";
  letter.style.top = Math.random() * 100 + "%";
  floatingContainer.appendChild(letter);
}

// Animate floating letters infinitely
animate(
  ".floating-container > div",
  {
    y: ["-20%", "20%"],
    x: ["-10%", "10%"],
    rotate: [-15, 15],
    opacity: [0.3, 1, 0.3],
  },
  {
    delay: stagger(0.2),
    duration: 1,
    repeat: Infinity,
    direction: "alternate",
    easing: "ease-in-out",
  }
);
