const canvas = document.getElementById('canvas');
const filter = document.getElementById('filter');
const palettesEl = document.getElementById('palettes');
const modesEl = document.getElementById('modes');
const paletteToggle = document.getElementById('paletteToggle');
const modeToggle = document.getElementById('modeToggle');
const clearBtn = document.getElementById('clearBtn');

const palettes = [
  ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
  ['#2C3E50', '#E74C3C', '#ECF0F1', '#3498DB', '#95A5A6', '#1ABC9C'],
  ['#6C5CE7', '#A29BFE', '#FD79A8', '#FDCB6E', '#74B9FF', '#55EFC4'],
  ['#FF9FF3', '#54A0FF', '#48DBFB', '#1DD1A1', '#FECA57', '#FF6348'],
  ['#341F97', '#EE5A6F', '#F79F1F', '#EA8685', '#A3CB38', '#1289A7'],
  ['#FC427B', '#FED330', '#26DE81', '#2BCBBA', '#45AAF2', '#A55EEA'],
  ['#574B90', '#EE6F57', '#FFA781', '#778BEB', '#F8A5C2', '#63CDDA'],
  ['#1E272E', '#FD7272', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9FF3']
];

let activePalette = 0;
let mode = 0; // 0:circles, 1:squares, 2:radial, 3:spiral, 4:scatter
let shapes = [];
let shiftPressed = false;
let filterMode = 0;
let palettesExpanded = false;
let modesExpanded = false;

const modeIcons = ['fa-circle', 'fa-square', 'fa-sun', 'fa-hurricane', 'fa-spray-can'];

// Initialize palettes
palettes.forEach((pal, i) => {
  const btn = document.createElement('div');
  btn.className = 'pal' + (i === 0 ? ' active' : '');
  btn.style.background = `linear-gradient(135deg, ${pal[0]}, ${pal[2]}, ${pal[4]})`;
  btn.onclick = () => selectPalette(i);
  palettesEl.appendChild(btn);
});

// Initialize modes
modeIcons.forEach((icon, i) => {
  const btn = document.createElement('div');
  btn.className = 'mode-btn' + (i === 0 ? ' active' : '');
  btn.innerHTML = `<i class="fas ${icon}"></i>`;
  btn.onclick = () => selectMode(i);
  modesEl.appendChild(btn);
});

// Toggle functions
paletteToggle.onclick = () => {
  palettesExpanded = !palettesExpanded;
  palettesEl.classList.toggle('expanded', palettesExpanded);
  if (palettesExpanded && modesExpanded) {
    modesExpanded = false;
    modesEl.classList.remove('expanded');
  }
};

modeToggle.onclick = () => {
  modesExpanded = !modesExpanded;
  modesEl.classList.toggle('expanded', modesExpanded);
  if (modesExpanded && palettesExpanded) {
    palettesExpanded = false;
    palettesEl.classList.remove('expanded');
  }
};

// Close menus when clicking on canvas
canvas.onclick = (e) => {
  if (palettesExpanded) {
    palettesExpanded = false;
    palettesEl.classList.remove('expanded');
  }
  if (modesExpanded) {
    modesExpanded = false;
    modesEl.classList.remove('expanded');
  }
  handleInteraction(e.clientX, e.clientY);
};

clearBtn.onclick = clearCanvas;

function selectPalette(i) {
  activePalette = i;
  document.querySelectorAll('.pal').forEach((p, idx) => {
    p.classList.toggle('active', idx === i);
  });
  updateBackground();
  setTimeout(() => {
    palettesExpanded = false;
    palettesEl.classList.remove('expanded');
  }, 300);
}

function selectMode(i) {
  mode = i;
  document.querySelectorAll('.mode-btn').forEach((m, idx) => {
    m.classList.toggle('active', idx === i);
  });
  setTimeout(() => {
    modesExpanded = false;
    modesEl.classList.remove('expanded');
  }, 300);
}

function updateBackground() {
  const pal = palettes[activePalette];
  document.body.style.background = `linear-gradient(135deg, ${pal[0]}22, ${pal[2]}22, ${pal[4]}22)`;
}

function getColor(index) {
  return palettes[activePalette][index % palettes[activePalette].length];
}

function createShape(x, y, colorIdx, size = 80, angle = 0) {
  const shape = document.createElement('div');
  shape.className = 'shape';
  shape.style.left = (x - size/2) + 'px';
  shape.style.top = (y - size/2) + 'px';
  shape.style.width = size + 'px';
  shape.style.height = size + 'px';
  
  const color1 = getColor(colorIdx);
  const color2 = getColor(colorIdx + 1);
  shape.style.background = `radial-gradient(circle at 30% 30%, ${color1}, ${color2})`;
  
  if (mode === 0) { // circles
    shape.style.borderRadius = '50%';
  } else if (mode === 1) { // squares
    shape.style.borderRadius = '8px';
    shape.style.transform = `rotate(${angle}deg)`;
  } else if (mode === 2 || mode === 3) { // radial/spiral
    shape.style.borderRadius = '50%';
  } else { // scatter
    shape.style.borderRadius = Math.random() > 0.5 ? '50%' : '8px';
  }
  
  shape.style.opacity = '0.7';
  canvas.appendChild(shape);
  shapes.push(shape);
  
  if (shapes.length > 40) {
    const old = shapes.shift();
    old.style.opacity = '0';
    setTimeout(() => old.remove(), 800);
  }
}

function handleInteraction(x, y) {
  if (shiftPressed) {
    applyFilter();
    return;
  }
  
  switch(mode) {
    case 0: // circles - complementary overlay
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          createShape(x, y, i, 100 - i * 20);
        }, i * 100);
      }
      break;
      
    case 1: // squares - grid pattern
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          setTimeout(() => {
            createShape(x + i * 80, y + j * 80, Math.abs(i + j), 60, 45);
          }, (Math.abs(i) + Math.abs(j)) * 80);
        }
      }
      break;
      
    case 2: // radial burst
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 100;
        setTimeout(() => {
          createShape(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            i,
            60
          );
        }, i * 60);
      }
      break;
      
    case 3: // spiral
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 4;
        const dist = 30 + i * 15;
        setTimeout(() => {
          createShape(
            x + Math.cos(angle) * dist,
            y + Math.sin(angle) * dist,
            i,
            50 - i * 2
          );
        }, i * 50);
      }
      break;
      
    case 4: // scatter with complementary
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          createShape(
            x + (Math.random() - 0.5) * 200,
            y + (Math.random() - 0.5) * 200,
            i,
            60 + Math.random() * 40
          );
        }, i * 80);
      }
      break;
  }
}

function applyFilter() {
  filterMode = (filterMode + 1) % 5;
  const pal = palettes[activePalette];
  
  switch(filterMode) {
    case 0:
      filter.style.background = 'none';
      filter.style.mixBlendMode = 'normal';
      break;
    case 1: // hue shift
      filter.style.background = `linear-gradient(135deg, ${pal[0]}44, ${pal[3]}44)`;
      filter.style.mixBlendMode = 'hue';
      break;
    case 2: // saturation
      filter.style.background = `linear-gradient(90deg, ${pal[1]}66, ${pal[4]}66)`;
      filter.style.mixBlendMode = 'saturation';
      break;
    case 3: // color overlay
      filter.style.background = `radial-gradient(circle at 50% 50%, ${pal[2]}33, ${pal[5]}33)`;
      filter.style.mixBlendMode = 'color';
      break;
    case 4: // luminosity
      filter.style.background = `linear-gradient(45deg, ${pal[0]}55, transparent, ${pal[5]}55)`;
      filter.style.mixBlendMode = 'luminosity';
      break;
  }
}

function clearCanvas() {
  shapes.forEach(s => {
    s.style.opacity = '0';
    setTimeout(() => s.remove(), 800);
  });
  shapes = [];
  filter.style.background = 'none';
  filterMode = 0;
}

// Mouse drag support
canvas.addEventListener('mousemove', (e) => {
  if (e.buttons === 1 && !palettesExpanded && !modesExpanded) {
    handleInteraction(e.clientX, e.clientY);
  }
});

// Touch support for mobile
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!palettesExpanded && !modesExpanded) {
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  }
}, { passive: false });

canvas.addEventListener('touchstart', (e) => {
  if (!palettesExpanded && !modesExpanded) {
    const touch = e.touches[0];
    handleInteraction(touch.clientX, touch.clientY);
  }
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') {
    shiftPressed = true;
  } else if (e.key >= '1' && e.key <= '5') {
    selectMode(parseInt(e.key) - 1);
  } else if (e.key.toLowerCase() === 'c') {
    clearCanvas();
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    shiftPressed = false;
  }
});

// Initialize
updateBackground();