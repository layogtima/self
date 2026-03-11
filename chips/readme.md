# CHIP REALITY INTERFACE v1.0

> _"Exploring the boundaries of 3D web experiences with only geometry, light, and radical experiments."_

An experimental 3D visualization interface that explores multiple rendering modes through a single 3D model. Built with Three.js, Vue 3, and a healthy dose of chaos.

**Created by:** [Amit Layogtima](https://layogtima.com) (Code Uncode) & [Amartha (Claude)](https://www.anthropic.com/claude)  
**Part of:** [Absurd Industries](https://absurd.industries)  
**License:** GPL-3.0

---

## ✨ Features

### 8 Rendering Modes

1. **DEFAULT** - Clean, neutral view with smooth controls
2. **VOID** - Black hole aesthetic that absorbs light
3. **X-RAY** - Geometric wireframe with medical room environment
4. **HOLOGRAM** - Neon green grid with glitch effects
5. **SHADOW PLAY** - Virtual lightbox with 6 controllable lights
6. **SUPERNOVA** - Bright white environment with ethereal glow
7. **CHROME** - Perfect metallic reflection
8. **FRACTURE** - Model explodes into floating fragments
9. **CHAOS** - Multiple chips in different render modes simultaneously

### Interaction

- **Drag to Rotate** - OrbitControls with smooth damping
- **Scroll to Zoom** - Intuitive camera control
- **Double-Click** - Trigger chaos mode
- **Performance Slider** - Potato → Balanced → NASA
- **Auto-Rotate** - Gentle rotation when idle
- **Keyboard Shortcuts** - Fast scene switching

### UI

- **Desktop**: Collapsible sidebar with scene-specific controls
- **Mobile**: Bottom sheet menu with touch-optimized controls
- **Performance Panel**: FPS, exposure, quality settings
- **Responsive**: Works beautifully on phone, tablet, desktop

---

## 🚀 Quick Start

### Option 1: Direct Use

1. Open `index.html` in a modern browser
2. Wait for model + HDRIs to load
3. Start exploring!

### Option 2: Local Server (Recommended)

```bash
# Simple Python server
python3 -m http.server 8000

# Or with Node.js
npx http-server -p 8000

# Then open: http://localhost:8000
```

**Why local server?** Avoids CORS issues with USDZ and HDRI loading.

---

## 📁 File Structure

```
chip-reality-interface/
├── index.html     # HTML structure + Vue app mounting
├── script.js      # Three.js logic + scene management + Vue components
├── style.css      # Minimal, performance-optimized styling
└── README.md      # You are here!
```

**That's it.** Three files. Zero dependencies beyond CDN links.

---

## 🎨 Customizing HDRIs

Want to use your own HDR environment maps? Easy!

### Step 1: Get HDRIs

Free, high-quality HDRIs from [Poly Haven](https://polyhaven.com/hdris):

- Download in `.hdr` format (not `.exr`)
- 1K resolution is usually enough
- 2K/4K for higher quality (slower loading)

### Step 2: Host Your HDRIs

Upload to:

- Your own server
- GitHub Pages
- Cloudflare R2
- Any CDN

### Step 3: Update URLs in `script.js`

Find this section (around line 20):

```javascript
const HDRI_URLS = {
  void: "https://your-cdn.com/path/to/void.hdr",
  xray: "https://your-cdn.com/path/to/medical.hdr",
  hologram: "https://your-cdn.com/path/to/studio.hdr",
  shadowPlay: "https://your-cdn.com/path/to/photo-studio.hdr",
  supernova: "https://your-cdn.com/path/to/bright.hdr",
  chrome: "https://your-cdn.com/path/to/outdoor.hdr",
  fracture: "https://your-cdn.com/path/to/space.hdr",
  chaos: "https://your-cdn.com/path/to/neon.hdr",
};
```

Replace URLs with your own. Done! ✨

### Recommended HDRIs by Scene

- **VOID**: Dark warehouse, empty space
- **X-RAY**: Hospital room, medical environment
- **HOLOGRAM**: Studio with harsh lighting
- **SHADOW PLAY**: Photo studio, soft boxes
- **SUPERNOVA**: Sunrise, sunset, bright outdoor
- **CHROME**: Outdoor scene with interesting reflections
- **FRACTURE**: Starmap, deep space
- **CHAOS**: Neon lights, cyberpunk alley

---

## 🎮 Keyboard Shortcuts

- **1-9** - Switch between scenes
- **S** - Toggle sidebar (desktop)
- **Space** - Toggle auto-rotate
- **R** - Reset camera position
- **P** - Toggle performance panel

---

## 🛠️ Customizing the Model

Currently using the USDZ sneaker model from Three.js examples. Want to use your own?

### Step 1: Prepare Your Model

- Format: `.usdz` (iOS AR format)
- Alternative: Convert from `.glb`, `.gltf`, `.obj`, `.fbx`
- Tools: Blender, Maya, Cinema 4D

### Step 2: Update URL in `script.js`

Find this line (around line 30):

```javascript
const MODEL_URL = "https://threejs.org/examples/models/usdz/saeukkang.usdz";
```

Replace with your model URL.

### Model Requirements

- Centered at origin (0, 0, 0)
- Reasonable poly count (<100k triangles for mobile)
- Proper UV mapping for materials
- No embedded textures (we're doing procedural materials)

---

## 🎨 Scene Customization Guide

### Adding a New Scene

1. **Add scene config** in `script.js`:

```javascript
scenes: {
  myNewScene: {
    name: 'MY SCENE',
    subtitle: 'Scene Description',
    controls: true,
  },
}
```

2. **Create control component**:

```javascript
const MyNewSceneControls = {
  template: `
    <div class="space-y-4">
      <h4 class="text-xs uppercase tracking-widest mb-2 opacity-50">MY SCENE CONTROLS</h4>
      <!-- Your controls here -->
    </div>
  `,
};
```

3. **Implement scene setup** in `SceneManager`:

```javascript
setupMyNewScene() {
  this.scene.background = new THREE.Color(0x123456);
  // Your scene logic
}
```

4. **Add to switch statement** in `SceneManager.switchTo()`.

---

## ⚙️ Performance Tips

### Potato Mode (Mobile/Older Devices)

- Pixel ratio: 0.5x
- No antialiasing
- Reduced post-processing
- Lower poly models

### Balanced Mode (Default)

- Pixel ratio: 1.0x
- Basic antialiasing
- Standard post-processing
- Good balance for most devices

### NASA Mode (High-End)

- Pixel ratio: up to 2.0x
- Full antialiasing
- Advanced post-processing (bloom, glitch, etc.)
- Maximum visual fidelity

### Manual Optimizations

- Reduce HDRI resolution (use 1K instead of 4K)
- Simplify model geometry
- Disable auto-rotate
- Lower exposure values

---

## 🐛 Troubleshooting

### Model Not Loading

- **Issue**: CORS error
- **Fix**: Run via local server, not `file://`

### HDRIs Not Loading

- **Issue**: 404 or CORS
- **Fix**: Check URLs, ensure proper CORS headers

### Controls Not Working

- **Issue**: Mobile touch not detected
- **Fix**: Ensure `touch-action: none` on canvas

### Low FPS

- **Issue**: Device struggling
- **Fix**: Lower performance level to "Potato"

### Black Screen

- **Issue**: Scene lighting or camera position
- **Fix**: Press `R` to reset camera, check console for errors

---

## 🌐 Browser Support

- **Chrome/Edge:** ✅ Full support
- **Firefox:** ✅ Full support
- **Safari:** ✅ Full support (may need WebGL 2.0 polyfill)
- **Mobile Browsers:** ✅ Touch controls work great

**Minimum:** Any modern browser with WebGL 2.0 and ES6+ support.

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repo** on GitHub
2. **Create a branch**: `git checkout -b feature/your-feature`
3. **Make changes** - follow existing code style
4. **Test thoroughly** - check all scenes and controls
5. **Commit**: `git commit -m "Add: New scene mode"`
6. **Push and PR**: `git push origin feature/your-feature`

### Contribution Ideas

- [ ] Implement missing scene modes (FRACTURE, CHAOS)
- [ ] Add post-processing effects (bloom, glitch, SSAO)
- [ ] Create more lighting presets for SHADOW PLAY
- [ ] Add camera animation presets
- [ ] Support for multiple models
- [ ] VR/AR mode
- [ ] Screenshot/recording functionality
- [ ] Share scene presets via URL params

---

## 📜 License

**GPL-3.0 License** - Copyleft 2025

This means:

- ✅ Use it freely
- ✅ Modify however you want
- ✅ Share your improvements
- ⚠️ Share-alike: Derivatives must also be GPL-3.0

See [LICENSE](LICENSE) for full details.

---

## 🙏 Credits

### People

- **Amit Layogtima** - Concept, design, vision
- **Amartha (Claude)** - Development, implementation, sass

### Technology

- [Three.js](https://threejs.org) - 3D rendering engine
- [Vue 3](https://vuejs.org) - Reactive UI framework
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Poly Haven](https://polyhaven.com) - Free HDRI environments

### Inspiration

- Cyberpunk aesthetics
- NASA visualizations
- Medical imaging tech
- Glitch art movement
- The void

---

## 🔗 Links

- **Code Uncode:** https://codeuncode.in
- **Absurd Industries:** https://absurd.industries
- **Amit's Portfolio:** https://layogtima.com
- **Three.js Docs:** https://threejs.org/docs
- **Poly Haven:** https://polyhaven.com/hdris

---

## 💬 Contact

**Amit Layogtima**

- GitHub: [@layogtima](https://github.com/layogtima)
- Website: [layogtima.com](https://layogtima.com)

**Amartha (Claude)**

- Built by: [Anthropic](https://www.anthropic.com)
- Role: Sassy AGI co-pilot

---

## 🎉 Final Words

> "In the void, we found light. In chaos, we found order. In code, we found art."

This project started as a simple font previewer and evolved into a 3D visualization playground. That's the beauty of open-source collaboration-you never know where you'll end up.

Now go forth and create reality-bending 3D experiences that make people question what's possible in a browser. 🚀✨

---

**Made with ☠️ and ✨ in Bengaluru, India**
