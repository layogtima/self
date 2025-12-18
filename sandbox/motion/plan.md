# Motion.dev Showcase - Implementation Plan

## Project Overview
Create a comprehensive showcase of motion.dev animation capabilities within MONO design constraints:
- **Font**: Space Mono (monospace only)
- **Colors**: Black, white, and grayscale
- **Typography-focused**: Use type scale, weight, and spacing as primary design elements
- **Library**: Motion.dev pure JavaScript API

## Current State Analysis

### Existing Sections
1. **Hero Section** - "TYPOGRAPHY" heading with rotation/scale animation
2. **Sizing Section** - Size exploration with opacity animation
3. **Features Section** - Static typography showcases (weight, spacing, styles, effects, paragraphs)
4. **Interactive Section** - CSS-based hover effects
5. **Quote Section** - Static quote
6. **Footer** - Static footer

### Current Animations (script.js)
- `animate("#heading")` - Rotating/scaling hero text
- `animate(".sizes .heading")` - Pulsing opacity on "SIZE"
- `scroll(animate(...))` - Scroll-triggered scale animation (appears broken)

## MONO Design Rules (Inferred)
1. Monospace font only (Space Mono)
2. Black/white/gray color palette
3. Typography as the primary visual element
4. Clean, minimal aesthetic
5. High contrast
6. Grid-based layouts

---

## Motion.dev Features to Showcase

### Section 1: HERO / TYPOGRAPHY
**Status**: ✓ Exists, needs refinement
**Motion Features**:
- `animate()` with repeat: Infinity
- Multiple keyframe values
- Easing functions

**Improvements**:
- Refine animation timing
- Add stagger to letter animations
- Consider split text animation

---

### Section 2: SCROLL ANIMATIONS
**Status**: Needs implementation
**Motion Features**:
- `scroll()` with various triggers
- Scroll-linked animations
- Progress-based transformations

**Implementation**:
```javascript
// Scroll-triggered reveals
scroll(animate(".reveal-element", {
  opacity: [0, 1],
  y: [100, 0]
}));

// Scroll progress
scroll(animate(".progress-bar", {
  scaleX: [0, 1]
}), {
  target: document.querySelector(".section"),
  offset: ["start end", "end end"]
});
```

**Visual Design**:
- Large text blocks that fade/slide in on scroll
- Typography that scales based on scroll position
- Horizontal scroll progress indicators
- Parallax text layers

---

### Section 3: TIMELINE ANIMATIONS
**Status**: New section needed
**Motion Features**:
- `timeline()` for sequenced animations
- Coordinated multi-element animations

**Implementation**:
```javascript
import { timeline } from "motion";

timeline([
  [".word-1", { opacity: [0, 1] }],
  [".word-2", { opacity: [0, 1] }, { at: "+0.2" }],
  [".word-3", { opacity: [0, 1] }, { at: "+0.2" }]
]);
```

**Visual Design**:
- Sequential word/letter reveals
- "Typewriter" effect using MONO font
- Coordinated entrance animations
- Story-telling through timed text reveals

---

### Section 4: STAGGER ANIMATIONS
**Status**: New section needed
**Motion Features**:
- `stagger()` for delayed sequential animations
- Grid/list animations

**Implementation**:
```javascript
import { animate, stagger } from "motion";

animate(".grid-item",
  { scale: [0, 1], opacity: [0, 1] },
  { delay: stagger(0.1) }
);
```

**Visual Design**:
- Grid of letters/words appearing in sequence
- Staggered text reveal
- Cascading typography elements
- Wave effects through text blocks

---

### Section 5: INVIEW ANIMATIONS
**Status**: New section needed
**Motion Features**:
- `inView()` for viewport-triggered animations
- Once/repeat options
- Intersection observers

**Implementation**:
```javascript
import { inView, animate } from "motion";

inView(".feature", ({ target }) => {
  animate(target, {
    opacity: [0, 1],
    y: [50, 0]
  });
});
```

**Visual Design**:
- Sections that animate when entering viewport
- Typography that "pops" into view
- Progressive disclosure of content
- Reactive text elements

---

### Section 6: SPRING ANIMATIONS
**Status**: New section needed
**Motion Features**:
- Spring physics for natural motion
- Bounce/elastic effects

**Implementation**:
```javascript
animate(".spring-text",
  { scale: [0.8, 1.2, 1] },
  {
    easing: spring({ stiffness: 300, damping: 20 })
  }
);
```

**Visual Design**:
- Bouncy text on interaction
- Elastic scale effects
- Natural feeling typography animations
- Playful but constrained to MONO aesthetic

---

### Section 7: TRANSFORM SHOWCASE
**Status**: Expand existing
**Motion Features**:
- All transform properties
- Rotate, scale, translate, skew

**Visual Design**:
- Rotating text blocks
- Scaling typography on scroll
- 3D transforms (rotateX, rotateY)
- Skewed text effects
- Combined transforms

---

### Section 8: OPACITY & VISIBILITY
**Status**: Partially exists
**Motion Features**:
- Fade effects
- Crossfades
- Visibility toggles

**Visual Design**:
- Ghosting text effects
- Layered opacity reveals
- Text crossfades
- Fade in/out patterns

---

### Section 9: INTERACTIVE ANIMATIONS
**Status**: Enhance existing
**Motion Features**:
- Event-driven animations
- Hover/click triggers
- Gesture-based animations

**Implementation**:
```javascript
document.querySelectorAll(".interactive").forEach(el => {
  el.addEventListener("mouseenter", () => {
    animate(el, { scale: 1.1 }, { duration: 0.3 });
  });
  el.addEventListener("mouseleave", () => {
    animate(el, { scale: 1 }, { duration: 0.3 });
  });
});
```

**Visual Design**:
- Hover-triggered text animations
- Click-based reveals
- Cursor-following text
- Interactive typography playground

---

### Section 10: PERFORMANCE SHOWCASE
**Status**: New section needed
**Motion Features**:
- GPU-accelerated transforms
- Will-change optimization
- Efficient animations

**Visual Design**:
- Hundreds of animating letters
- Particle text effects
- Complex coordinated animations
- Demonstrating smooth 60fps motion

---

## Implementation Order

### Phase 1: Fix & Refine Existing
1. Fix broken scroll animation in script.js
2. Refine hero animation timing
3. Optimize existing animations

### Phase 2: Core Motion Features
1. **SCROLL section** - Most impactful
2. **INVIEW section** - Essential for modern web
3. **STAGGER section** - Visually compelling

### Phase 3: Advanced Features
1. **TIMELINE section** - Story-telling capability
2. **SPRING section** - Natural motion
3. **TRANSFORM showcase** - Expand existing

### Phase 4: Polish & Performance
1. **INTERACTIVE enhancements** - Better UX
2. **PERFORMANCE showcase** - Technical flex
3. Overall optimization and refinement

---

## Technical Specifications

### HTML Structure Pattern
```html
<section class="py-24 px-8 [bg-color]">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-5xl font-bold mb-16">
      SECTION<span class="text-xs align-super">NAME</span>
    </h2>
    <!-- Motion demo content -->
  </div>
</section>
```

### Color Scheme per Section
- Black backgrounds: Hero, Interactive
- White backgrounds: Features, Quote
- Gray backgrounds: Alternating sections
- High contrast always

### Typography Scale (Tailwind)
- `text-9xl` - Massive impact text
- `text-7xl` - Large headlines
- `text-5xl` - Section headers
- `text-3xl` - Subheads
- `text-xl` - Body
- `text-sm` - Captions
- `text-xs` - Superscripts

### Animation Principles
1. **Subtle by default** - MONO is minimalist
2. **Purposeful motion** - Every animation has meaning
3. **Performance first** - GPU-accelerated transforms
4. **Responsive** - Works on all screen sizes
5. **Accessible** - Respect prefers-reduced-motion

---

## File Structure
```
/motion
├── index.html          # Main showcase page
├── script.js           # All motion.dev animations
├── plan.md            # This file
└── README.md          # (Optional) Documentation
```

---

## Success Criteria
- [ ] All major motion.dev features demonstrated
- [ ] Animations are smooth (60fps)
- [ ] Design stays within MONO constraints
- [ ] Responsive on mobile/tablet/desktop
- [ ] Code is clean and well-commented
- [ ] Each section clearly shows what motion.dev feature it demonstrates

---

## Next Steps
1. Review and approve this plan
2. Implement Phase 1 (fix existing)
3. Implement Phase 2 (core features)
4. Review progress
5. Implement Phase 3 & 4
6. Final polish and optimization
