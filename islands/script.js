// MONOTONE Islands - Global Instrument of Chaos
// Canvas Setup
const canvas = document.getElementById('stage');
const c = canvas.getContext('2d');
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

// GitHub base URL for instrument samples
const SAMPLE_BASE = 'https://raw.githubusercontent.com/nbrosowsky/tonejs-instruments/master/samples';

// Drum samples (using original URLs - they work great!)
const drumSamples = {
  kick: new Audio('https://raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/master/src/01-javascript-drum-kit/sounds/kick.wav'),
  snare: new Audio('https://raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/master/src/01-javascript-drum-kit/sounds/snare.wav'),
  hihatClose: new Audio('https://raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/master/src/01-javascript-drum-kit/sounds/hihat-close.wav'),
  crash: new Audio('https://raw.githubusercontent.com/ArunMichaelDsouza/javascript-30-course/master/src/01-javascript-drum-kit/sounds/crash.wav')
};

// Preload drum samples
Object.values(drumSamples).forEach(audio => {
  audio.load();
  audio.volume = 0.8;
});

// Melodic instruments using Tone.Sampler with GitHub URLs
const instruments = {};

// Load Piano samples (subset for performance)
const pianoUrls = {
  'C3': `${SAMPLE_BASE}/piano/C3.mp3`,
  'E3': `${SAMPLE_BASE}/piano/E3.mp3`,
  'G3': `${SAMPLE_BASE}/piano/G3.mp3`,
  'C4': `${SAMPLE_BASE}/piano/C4.mp3`,
  'E4': `${SAMPLE_BASE}/piano/E4.mp3`,
  'G4': `${SAMPLE_BASE}/piano/G4.mp3`,
  'C5': `${SAMPLE_BASE}/piano/C5.mp3`
};

// Load Guitar samples
const guitarUrls = {
  'D2': `${SAMPLE_BASE}/guitar-acoustic/D2.mp3`,
  'A2': `${SAMPLE_BASE}/guitar-acoustic/A2.mp3`,
  'D3': `${SAMPLE_BASE}/guitar-acoustic/D3.mp3`,
  'A3': `${SAMPLE_BASE}/guitar-acoustic/A3.mp3`,
  'D4': `${SAMPLE_BASE}/guitar-acoustic/D4.mp3`
};

// Load Bass samples (ONLY notes that exist in repo!)
const bassUrls = {
  'E1': `${SAMPLE_BASE}/bass-electric/E1.mp3`,
  'G1': `${SAMPLE_BASE}/bass-electric/G1.mp3`,
  'E2': `${SAMPLE_BASE}/bass-electric/E2.mp3`,
  'G2': `${SAMPLE_BASE}/bass-electric/G2.mp3`
};

// Load Trumpet samples (ONLY notes that exist in repo!)
const trumpetUrls = {
  'F3': `${SAMPLE_BASE}/trumpet/F3.mp3`,
  'A3': `${SAMPLE_BASE}/trumpet/A3.mp3`,
  'C4': `${SAMPLE_BASE}/trumpet/C4.mp3`,
  'F4': `${SAMPLE_BASE}/trumpet/F4.mp3`,
  'G4': `${SAMPLE_BASE}/trumpet/G4.mp3`
};

// Load Saxophone samples (ONLY notes that exist in repo!)
const saxUrls = {
  'D3': `${SAMPLE_BASE}/saxophone/D3.mp3`,
  'E3': `${SAMPLE_BASE}/saxophone/E3.mp3`,
  'G3': `${SAMPLE_BASE}/saxophone/G3.mp3`,
  'D4': `${SAMPLE_BASE}/saxophone/D4.mp3`,
  'E4': `${SAMPLE_BASE}/saxophone/E4.mp3`,
  'G4': `${SAMPLE_BASE}/saxophone/G4.mp3`
};

// Create Tone.Sampler instances
instruments.piano = new Tone.Sampler({ urls: pianoUrls }).toDestination();
instruments.guitar = new Tone.Sampler({ urls: guitarUrls }).toDestination();
instruments.bass = new Tone.Sampler({ urls: bassUrls }).toDestination();
instruments.trumpet = new Tone.Sampler({ urls: trumpetUrls }).toDestination();
instruments.sax = new Tone.Sampler({ urls: saxUrls }).toDestination();

// Islands configuration - THE SONIC ARCHIPELAGO
const islands = [
  // DRUMS (darker, bottom area)
  { x: 0.12, y: 0.75, r: 110, color: 20, type: 'drum', sound: 'kick', note: null, name: '🥁' },
  { x: 0.68, y: 0.65, r: 80, color: 100, type: 'drum', sound: 'snare', note: null, name: '💿' },
  { x: 0.25, y: 0.85, r: 50, color: 220, type: 'drum', sound: 'hihatClose', note: null, name: '●' },
  { x: 0.88, y: 0.75, r: 90, color: 180, type: 'drum', sound: 'crash', note: null, name: '✱' },
  
  // PIANO (medium gray, harmonic islands)
  { x: 0.35, y: 0.55, r: 85, color: 130, type: 'melodic', sound: 'piano', note: 'C4', name: '🎹' },
  { x: 0.22, y: 0.48, r: 75, color: 140, type: 'melodic', sound: 'piano', note: 'E4', name: '🎹' },
  { x: 0.48, y: 0.62, r: 70, color: 135, type: 'melodic', sound: 'piano', note: 'G4', name: '🎹' },
  
  // GUITAR (lighter, melodic strumming)
  { x: 0.55, y: 0.38, r: 75, color: 160, type: 'melodic', sound: 'guitar', note: 'D3', name: '🎸' },
  { x: 0.72, y: 0.42, r: 68, color: 170, type: 'melodic', sound: 'guitar', note: 'A3', name: '🎸' },
  
  // BASS (darker, foundation)
  { x: 0.15, y: 0.62, r: 95, color: 60, type: 'melodic', sound: 'bass', note: 'E2', name: '🔉' },
  { x: 0.42, y: 0.75, r: 72, color: 70, type: 'melodic', sound: 'bass', note: 'A2', name: '🔉' },
  
  // BRASS (bright, fanfare!)
  { x: 0.82, y: 0.25, r: 78, color: 200, type: 'melodic', sound: 'trumpet', note: 'C4', name: '🎺' },
  { x: 0.65, y: 0.18, r: 70, color: 195, type: 'melodic', sound: 'trumpet', note: 'G4', name: '🎺' },
  
  // SAX (smooth jazz zone)
  { x: 0.38, y: 0.28, r: 72, color: 175, type: 'melodic', sound: 'sax', note: 'D4', name: '🎷' },
  { x: 0.52, y: 0.22, r: 68, color: 182, type: 'melodic', sound: 'sax', note: 'A4', name: '🎷' }
];

// Initialize islands
islands.forEach((island, idx) => {
  island.absX = island.x * w;
  island.absY = island.y * h;
  island.pulse = 0;
  island.steps = new Array(16).fill(false);
  island.id = idx;
});

// Sequencer state
let isPlaying = false;
let currentStep = 0;
let bpm = 120;
let stepInterval = null;
let selectedIslandId = null;

// Visual effects
const ripples = [];
const oceanTrail = [];
const maxTrailPoints = 50;

// Get island at position
const getIsland = (x, y) => {
  for (let island of islands) {
    const dx = x - island.absX;
    const dy = y - island.absY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= island.r) {
      return { island, dist, centerDist: dist / island.r };
    }
  }
  return null;
};

// Play sound
const playSound = (island, velocity = 1) => {
  if (island.type === 'drum') {
    const audio = drumSamples[island.sound];
    if (!audio) return;
    
    const clone = audio.cloneNode();
    clone.volume = Math.max(0.3, velocity) * 0.8;
    clone.play().catch(e => console.log('Audio play failed:', e));
  } else if (island.type === 'melodic') {
    const inst = instruments[island.sound];
    if (inst && island.note) {
      inst.triggerAttackRelease(island.note, '8n', Tone.now(), velocity);
    }
  }
  
  // Visual feedback
  island.pulse = 1;
  ripples.push({ x: island.absX, y: island.absY, r: 0, life: 1 });
  
  // Update UI
  document.getElementById('currentSound').textContent = island.name;
  document.getElementById('velocity').innerHTML = `<i class="fas fa-volume-up text-[8px]"></i><span>${Math.round(velocity * 100)}</span>`;
};

// Build sequencer UI
const buildSequencerUI = () => {
  const grid = document.getElementById('stepGrid');
  grid.innerHTML = '';

  islands.forEach((island, islandIdx) => {
    // Island label
    const label = document.createElement('div');
    label.className = 'flex items-center justify-center text-lg cursor-pointer hover:bg-gray-100 p-2 border border-gray-300';
    label.textContent = island.name;
    label.onclick = () => selectIsland(islandIdx);
    grid.appendChild(label);

    // Steps
    for (let step = 0; step < 16; step++) {
      const btn = document.createElement('button');
      btn.className = 'step-btn aspect-square border-2 border-black bg-white hover:bg-gray-200';
      btn.dataset.island = islandIdx;
      btn.dataset.step = step;
      
      if (island.steps[step]) {
        btn.classList.add('step-active');
      }

      btn.onclick = () => toggleStep(islandIdx, step);
      grid.appendChild(btn);
    }
  });
};

// Select island
const selectIsland = (id) => {
  selectedIslandId = id;
  document.getElementById('selectedIsland').textContent = islands[id].name;
};

// Toggle step
const toggleStep = (islandId, step) => {
  islands[islandId].steps[step] = !islands[islandId].steps[step];
  buildSequencerUI();
};

// Sequencer tick
const tick = () => {
  islands.forEach(island => {
    if (island.steps[currentStep]) {
      playSound(island, 0.9);
    }
  });

  updateStepHighlight();
  currentStep = (currentStep + 1) % 16;
};

// Update step highlight
const updateStepHighlight = () => {
  document.querySelectorAll('.step-btn').forEach(btn => {
    const step = parseInt(btn.dataset.step);
    btn.style.boxShadow = step === currentStep ? '0 0 0 3px #000' : 'none';
  });
};

// Transport controls
document.getElementById('playBtn').onclick = async () => {
  await Tone.start();
  
  if (isPlaying) {
    clearInterval(stepInterval);
    isPlaying = false;
    document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
  } else {
    const stepTime = (60 / bpm) * 1000 / 4; // 16th notes
    stepInterval = setInterval(tick, stepTime);
    isPlaying = true;
    document.getElementById('playBtn').innerHTML = '<i class="fas fa-pause"></i>';
  }
};

document.getElementById('stopBtn').onclick = () => {
  clearInterval(stepInterval);
  isPlaying = false;
  currentStep = 0;
  updateStepHighlight();
  document.getElementById('playBtn').innerHTML = '<i class="fas fa-play"></i>';
};

// BPM control
document.getElementById('bpmSlider').oninput = (e) => {
  bpm = parseInt(e.target.value);
  document.getElementById('bpmDisplay').textContent = bpm;
  
  if (isPlaying) {
    clearInterval(stepInterval);
    const stepTime = (60 / bpm) * 1000 / 4;
    stepInterval = setInterval(tick, stepTime);
  }
};

// Sequencer toggle
document.getElementById('seqToggle').onclick = () => {
  document.getElementById('seqPanel').classList.toggle('sequencer-hidden');
};

// Draw loop
const draw = () => {
  c.clearRect(0, 0, w, h);
  
  // Ocean trail
  if (oceanTrail.length > 1) {
    for (let i = 1; i < oceanTrail.length; i++) {
      const alpha = i / oceanTrail.length;
      c.strokeStyle = `rgba(0, 0, 0, ${alpha * 0.15})`;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(oceanTrail[i-1].x, oceanTrail[i-1].y);
      c.lineTo(oceanTrail[i].x, oceanTrail[i].y);
      c.stroke();
    }
  }
  
  // Draw islands
  islands.forEach(island => {
    const gray = island.color;
    c.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
    c.beginPath();
    c.arc(island.absX, island.absY, island.r, 0, Math.PI * 2);
    c.fill();
    
    // Pulse effect
    if (island.pulse > 0) {
      const pulseR = island.r + (island.pulse * 20);
      c.strokeStyle = `rgba(0, 0, 0, ${island.pulse * 0.5})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(island.absX, island.absY, pulseR, 0, Math.PI * 2);
      c.stroke();
      island.pulse -= 0.05;
      if (island.pulse < 0) island.pulse = 0;
    }
    
    // Border (thicker for selected island)
    c.strokeStyle = '#000';
    c.lineWidth = selectedIslandId === island.id ? 4 : 2;
    c.beginPath();
    c.arc(island.absX, island.absY, island.r, 0, Math.PI * 2);
    c.stroke();
    
    // Icon/emoji
    if (island.r > 55) {
      c.fillStyle = gray > 128 ? '#000' : '#fff';
      c.font = `${island.r / 3}px Space Mono`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(island.name, island.absX, island.absY);
    }
  });
  
  // Ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const ripple = ripples[i];
    ripple.r += 3;
    ripple.life -= 0.02;
    
    if (ripple.life <= 0) {
      ripples.splice(i, 1);
      continue;
    }
    
    c.strokeStyle = `rgba(0, 0, 0, ${ripple.life * 0.3})`;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(ripple.x, ripple.y, ripple.r, 0, Math.PI * 2);
    c.stroke();
  }
  
  requestAnimationFrame(draw);
};

// Mouse handlers
canvas.addEventListener('mousedown', async (e) => {
  await Tone.start();
  const result = getIsland(e.clientX, e.clientY);
  if (result) {
    const velocity = 1 - (result.centerDist * 0.4);
    playSound(result.island, velocity);
    selectIsland(result.island.id);
  }
});

canvas.addEventListener('mousemove', (e) => {
  const result = getIsland(e.clientX, e.clientY);
  
  if (!result) {
    oceanTrail.push({ x: e.clientX, y: e.clientY });
    if (oceanTrail.length > maxTrailPoints) oceanTrail.shift();
    canvas.style.cursor = 'crosshair';
  } else {
    oceanTrail.length = 0;
    canvas.style.cursor = 'pointer';
  }
});

canvas.addEventListener('mouseleave', () => {
  oceanTrail.length = 0;
});

// Touch support
canvas.addEventListener('touchstart', async (e) => {
  e.preventDefault();
  await Tone.start();
  const touch = e.touches[0];
  const result = getIsland(touch.clientX, touch.clientY);
  if (result) {
    playSound(result.island, 1 - (result.centerDist * 0.4));
    selectIsland(result.island.id);
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const result = getIsland(touch.clientX, touch.clientY);
  
  if (!result) {
    oceanTrail.push({ x: touch.clientX, y: touch.clientY });
    if (oceanTrail.length > maxTrailPoints) oceanTrail.shift();
  } else {
    oceanTrail.length = 0;
  }
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    oceanTrail.length = 0;
    ripples.length = 0;
  }
});

// Resize
window.addEventListener('resize', () => {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  islands.forEach(island => {
    island.absX = island.x * w;
    island.absY = island.y * h;
  });
});

// Initialize
buildSequencerUI();
draw();

console.log('🌍 MONOTONE Islands loaded! Welcome to the Sonic Archipelago!');