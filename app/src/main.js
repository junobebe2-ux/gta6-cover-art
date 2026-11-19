// Neon Shore — wires the editor: photos, layouts, grades, lettering, presets,
// the surprise shuffle, crop, undo/redo, export. A `?shot=` query sets up a
// fixed scene for a screenshot instead (./shots.js).
import { drawCover, renderExport, defaultState, LAYOUTS, GRADES, SIZES, TITLE_FONTS, BORDERS, PRESETS, SURPRISE_TITLES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

// --- fonts (vendored OFL woff2, loaded before any draw) ---
const fontsReady = (async () => {
  try {
    const faces = [
      new FontFace('Anton', 'url(./fonts/Anton-Regular.woff2)', { weight: '400' }),
      new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.woff2)', { weight: '400' }),
      new FontFace('Playfair Display', 'url(./fonts/PlayfairDisplay-Bold.woff2)', { weight: '700' }),
    ];
    for (const face of faces) document.fonts.add(face);
    await Promise.all(faces.map((f) => f.load()));
    await document.fonts.ready;
  } catch (e) {
    console.warn('font load failed, falling back to system fonts', e);
  }
})();

// --- state ---
const state = defaultState();
const SAMPLES = [
  { id: 'pier', label: 'Pier', url: 'samples/pier.jpg' },
  { id: 'boulevard', label: 'Boulevard', url: 'samples/boulevard.jpg' },
  { id: 'neon', label: 'Neon Street', url: 'samples/neon.jpg' },
  { id: 'rooftop', label: 'Rooftop', url: 'samples/rooftop.jpg' },
];
const tray = []; // {id, label, img, url}
window.__neonShoreTray = tray;
let selectedPanel = 0;
let selectedTray = null; // tray index awaiting assignment, or null

// --- undo / redo (state snapshots, images referenced by id) ---
const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({
    ...state,
    panels: state.panels.map((p) => ({ src: p.src, zoom: p.zoom, ox: p.ox, oy: p.oy })),
  });
}
function restore(snap) {
  const saved = JSON.parse(snap);
  Object.assign(state, saved);
  state.panels = saved.panels.map((p) => ({ ...p, img: findImage(p.src) }));
  syncControls();
  redraw();
}
function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
  updateUndoButtons();
}
// Text and range fields mutate state on every `input` event, so a `change`-
// time push would snapshot the NEW value and undo would be a no-op.
// Snapshot on the interaction that precedes the first keystroke and push
// that on change, only if the state actually changed. Capture on focus,
// pointerdown AND keydown: focus alone is not enough — a programmatic
// .focus() can move activeElement without firing the event (headless
// Chromium does exactly that), which silently broke text undo.
function trackField(el) {
  let before = null;
  const capture = () => { if (before === null) before = snapshot(); };
  el.addEventListener('focus', capture);
  el.addEventListener('pointerdown', capture);
  el.addEventListener('keydown', capture);
  el.addEventListener('change', () => {
    if (before !== null && snapshot() !== before) {
      undoStack.push(before);
      if (undoStack.length > 60) undoStack.shift();
      redoStack.length = 0;
      updateUndoButtons();
    }
    before = null;
  });
}
function updateUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}
$('undo').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  updateUndoButtons();
  setStatus('Undid the last change.');
});
$('redo').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  updateUndoButtons();
  setStatus('Redid the change.');
});

// --- images ---
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
function findImage(src) {
  if (!src) return null;
  const found = tray.find((x) => x.id === src);
  return found ? found.img : null;
}
async function loadSamples() {
  for (const s of SAMPLES) {
    try {
      const img = await loadImage(s.url);
      tray.push({ id: s.id, label: s.label, img, url: s.url });
    } catch (e) {
      console.warn('sample failed', s.id, e);
    }
  }
  renderTray();
}

function layoutPhotoCount() {
  return (LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0]).photos;
}
function ensurePanels() {
  const n = layoutPhotoCount();
  while (state.panels.length < n) {
    // Default assignment: cycle through the tray.
    const t = tray[state.panels.length % Math.max(1, tray.length)];
    state.panels.push(t
      ? { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 }
      : { src: null, img: null, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = n;
  if (selectedPanel >= n) selectedPanel = 0;
}

function redraw() {
  ensurePanels();
  drawCover(canvas, state);
  renderPanelList();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// --- tray UI ---
function renderTray() {
  const el = $('tray');
  el.innerHTML = '';
  tray.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb' + (selectedTray === i ? ' picked' : '');
    b.title = `${t.label} — click, then click a panel to place it`;
    const im = document.createElement('img');
    im.src = t.url;
    im.alt = t.label;
    im.draggable = true;
    im.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/tray', String(i)));
    b.appendChild(im);
    const sp = document.createElement('span');
    sp.textContent = t.label;
    b.appendChild(sp);
    b.addEventListener('click', () => {
      selectedTray = selectedTray === i ? null : i;
      renderTray();
      setStatus(selectedTray === null
        ? 'Photo unpicked.'
        : `${t.label} picked — click a panel below to place it.`);
    });
    el.appendChild(b);
  });
}

// --- panel list (assign + crop controls) ---
function renderPanelList() {
  const el = $('panels');
  el.innerHTML = '';
  state.panels.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'panel-btn' + (selectedPanel === i ? ' sel' : '');
    const label = p.src ? (tray.find((t) => t.id === p.src)?.label || p.src) : 'Empty';
    b.textContent = `Panel ${i + 1} · ${label}`;
    b.addEventListener('click', () => {
      if (selectedTray !== null) {
        pushUndo();
        const t = tray[selectedTray];
        state.panels[i] = { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 };
        selectedTray = null;
        selectedPanel = i;
        renderTray();
        redraw();
        setStatus(`${t.label} placed in panel ${i + 1}. Drag on the cover to reposition it.`);
      } else {
        selectedPanel = i;
        redraw();
        setStatus(`Panel ${i + 1} selected. Drag on the cover to pan, scroll to zoom.`);
      }
    });
    el.appendChild(b);
  });
  const p = state.panels[selectedPanel];
  $('zoom').value = p ? String(p.zoom ?? 1) : '1';
  $('zoomVal').textContent = `${Math.round((p ? p.zoom ?? 1 : 1) * 100)}%`;
}

// --- canvas interaction: drag to pan the selected panel, wheel to zoom ---
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
let dragging = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  // Pan the selected panel regardless of where the pointer lands — it is the
  // one being edited, and hit-testing rotated snapshot rects is overkill.
  dragging = {
    x: pt.x, y: pt.y,
    ox: state.panels[selectedPanel]?.ox || 0,
    oy: state.panels[selectedPanel]?.oy || 0,
    before: snapshot(),
    moved: false,
  };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = state.panels[selectedPanel];
  if (!p || !p.img) return;
  const pt = canvasPoint(e);
  const dx = (pt.x - dragging.x) / canvas.width;
  const dy = (pt.y - dragging.y) / canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.004) dragging.moved = true;
  // Pan in panel space: scale by the panel's share of the canvas.
  p.ox = Math.max(-1, Math.min(1, dragging.ox + dx * 3));
  p.oy = Math.max(-1, Math.min(1, dragging.oy + dy * 3));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (dragging && dragging.moved && dragging.before !== snapshot()) {
    undoStack.push(dragging.before);
    if (undoStack.length > 60) undoStack.shift();
    redoStack.length = 0;
    updateUndoButtons();
  }
  dragging = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const p = state.panels[selectedPanel];
  if (!p || !p.img) return;
  pushUndo();
  p.zoom = Math.max(1, Math.min(4, (p.zoom || 1) * (e.deltaY < 0 ? 1.1 : 0.91)));
  redraw();
  $('zoom').value = String(p.zoom);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
}, { passive: false });
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const ti = e.dataTransfer.getData('text/tray');
  if (ti === '') return;
  const t = tray[Number(ti)];
  if (!t) return;
  pushUndo();
  state.panels[selectedPanel] = { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 };
  redraw();
  setStatus(`${t.label} dropped into panel ${selectedPanel + 1}.`);
});

// --- controls ---
function makePick(item, label, title) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pick';
  b.dataset.id = item.id;
  b.textContent = label;
  if (title) b.title = title;
  return b;
}
function buildPickers() {
  const layoutEl = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = makePick(l, l.name);
    b.addEventListener('click', () => {
      pushUndo();
      state.layout = l.id;
      syncControls();
      redraw();
      setStatus(`Layout: ${l.name}.`);
    });
    layoutEl.appendChild(b);
  });
  const gradeEl = $('grades');
  GRADES.forEach((g) => {
    const b = makePick(g, g.name, g.hint);
    b.addEventListener('click', () => {
      pushUndo();
      state.grade = g.id;
      syncControls();
      redraw();
      setStatus(`Grade: ${g.name} — ${g.hint}.`);
    });
    gradeEl.appendChild(b);
  });
  const fontEl = $('titleFonts');
  TITLE_FONTS.forEach((f) => {
    const b = makePick(f, f.name, f.hint);
    b.style.fontFamily = f.family;
    b.addEventListener('click', () => {
      pushUndo();
      state.titleFont = f.id;
      syncControls();
      redraw();
      setStatus(`Title font: ${f.name}.`);
    });
    fontEl.appendChild(b);
  });
  const borderEl = $('borders');
  BORDERS.forEach((bd) => {
    const b = makePick(bd, bd.name);
    b.addEventListener('click', () => {
      pushUndo();
      state.border = bd.id;
      syncControls();
      redraw();
      setStatus(`Panel border: ${bd.name}.`);
    });
    borderEl.appendChild(b);
  });
  const presetEl = $('presets');
  PRESETS.forEach((pr) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.dataset.id = pr.id;
    b.textContent = pr.name;
    b.addEventListener('click', () => {
      pushUndo();
      Object.assign(state, {
        layout: pr.layout, grade: pr.grade, titleFont: pr.titleFont,
        goldFoil: pr.goldFoil, border: pr.border, frame: pr.frame,
      });
      syncControls();
      redraw();
      setStatus(`Look: ${pr.name}.`);
    });
    presetEl.appendChild(b);
  });
  const sizeEl = $('sizes');
  SIZES.forEach((s) => {
    const b = makePick(s, `${s.w} × ${s.h}`);
    b.addEventListener('click', () => {
      document.querySelectorAll('#sizes .pick').forEach((x) => x.classList.toggle('sel', x === b));
      setStatus(`Export size: ${s.name}.`);
    });
    sizeEl.appendChild(b);
  });
  sizeEl.firstChild.classList.add('sel');
}
function syncControls() {
  document.querySelectorAll('#layouts .pick').forEach((b) => b.classList.toggle('sel', b.dataset.id === state.layout));
  document.querySelectorAll('#grades .pick').forEach((b) => b.classList.toggle('sel', b.dataset.id === state.grade));
  document.querySelectorAll('#titleFonts .pick').forEach((b) => b.classList.toggle('sel', b.dataset.id === state.titleFont));
  document.querySelectorAll('#borders .pick').forEach((b) => b.classList.toggle('sel', b.dataset.id === state.border));
  document.querySelectorAll('#presets .preset').forEach((b) => {
    const pr = PRESETS.find((p) => p.id === b.dataset.id);
    b.classList.toggle('sel', !!pr
      && pr.layout === state.layout && pr.grade === state.grade
      && pr.titleFont === state.titleFont && pr.goldFoil === state.goldFoil
      && pr.border === state.border);
  });
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('issueLine').value = state.issueLine || '';
  $('titleSize').value = String(state.titleScale);
  $('titleY').value = String(state.titleY);
  $('goldFoil').checked = !!state.goldFoil;
  $('frame').checked = !!state.frame;
  $('grain').checked = !!state.grain;
  $('vignette').checked = !!state.vignette;
  $('badge').checked = !!state.badge;
  $('badgeText').value = state.badgeText || '';
  $('heat').value = String(state.heat ?? 4);
  $('heatVal').textContent = `${state.heat ?? 4} ★`;
  updateUndoButtons();
}

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
trackField($('title'));
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
trackField($('subtitle'));
$('issueLine').addEventListener('input', (e) => { state.issueLine = e.target.value; redraw(); });
trackField($('issueLine'));
$('titleSize').addEventListener('input', (e) => { state.titleScale = Number(e.target.value); redraw(); });
trackField($('titleSize'));
$('titleY').addEventListener('input', (e) => { state.titleY = Number(e.target.value); redraw(); });
trackField($('titleY'));
$('goldFoil').addEventListener('change', (e) => {
  pushUndo();
  state.goldFoil = e.target.checked;
  syncControls();
  redraw();
  setStatus(state.goldFoil ? 'Gold-foil title on.' : 'Gold-foil title off.');
});
$('frame').addEventListener('change', (e) => { pushUndo(); state.frame = e.target.checked; redraw(); });
$('grain').addEventListener('change', (e) => { pushUndo(); state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { pushUndo(); state.vignette = e.target.checked; redraw(); });
$('badge').addEventListener('change', (e) => { pushUndo(); state.badge = e.target.checked; redraw(); });
$('badgeText').addEventListener('input', (e) => { state.badgeText = e.target.value; redraw(); });
trackField($('badgeText'));
$('heat').addEventListener('input', (e) => {
  state.heat = Number(e.target.value);
  $('heatVal').textContent = `${state.heat} ★`;
  redraw();
});
trackField($('heat'));
$('zoom').addEventListener('input', (e) => {
  const p = state.panels[selectedPanel];
  if (!p) return;
  p.zoom = Number(e.target.value);
  $('zoomVal').textContent = `${Math.round(p.zoom * 100)}%`;
  redraw();
});
trackField($('zoom'));

// Surprise me: shuffle layout + grade + photos + title (and lettering to match).
$('surprise').addEventListener('click', () => {
  pushUndo();
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  state.layout = pick(LAYOUTS).id;
  state.grade = pick(GRADES).id;
  state.titleFont = pick(TITLE_FONTS).id;
  state.goldFoil = Math.random() < 0.5;
  state.title = pick(SURPRISE_TITLES);
  // Shuffle the tray order into the panels.
  const order = [...tray].sort(() => Math.random() - 0.5);
  const n = layoutPhotoCount();
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const t = order[i % Math.max(1, order.length)];
    state.panels.push(t
      ? { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 }
      : { src: null, img: null, zoom: 1, ox: 0, oy: 0 });
  }
  syncControls();
  redraw();
  setStatus(`Surprise: ${state.title} — ${state.layout}, ${state.grade}.`);
});

// Upload: multiple files go to the tray; the first ones fill empty panels.
$('photo').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  if (!files.length) return;
  for (const f of files) {
    const img = await loadImage(URL.createObjectURL(f));
    tray.push({
      id: 'up' + Date.now() + Math.floor(Math.random() * 1e6),
      label: f.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo',
      img,
      url: URL.createObjectURL(f),
    });
  }
  // Fill empty panels with the new photos.
  const fresh = tray.slice(-files.length);
  state.panels.forEach((p, i) => {
    if (!p.img && fresh.length) {
      const t = fresh.shift();
      state.panels[i] = { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 };
    }
  });
  pushUndo();
  renderTray();
  redraw();
  setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} added. Click a tray photo, then a panel, to place it.`);
  e.target.value = '';
});

// Sample quick-load.
$('loadSamples').addEventListener('click', async () => {
  pushUndo();
  const order = ['pier', 'boulevard', 'neon', 'rooftop'];
  state.panels.forEach((p, i) => {
    const t = tray.find((x) => x.id === order[i % order.length]);
    if (t) state.panels[i] = { src: t.id, img: t.img, zoom: 1, ox: 0, oy: 0 };
  });
  redraw();
  setStatus('Sample photos loaded into every panel.');
});

// --- export ---
function exportSize(size) {
  const c = renderExport(state, size.w, size.h);
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-shore-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
}
function chosenSize() {
  const sel = document.querySelector('#sizes .pick.sel');
  return SIZES.find((s) => s.id === (sel ? sel.dataset.id : '1080x1080')) || SIZES[0];
}
$('export').addEventListener('click', () => {
  const s = chosenSize();
  exportSize(s);
  setStatus(`Exported ${s.name} as PNG.`);
});
$('exportAll').addEventListener('click', () => {
  SIZES.forEach((s, i) => setTimeout(() => exportSize(s), i * 350));
  setStatus('Exporting all four sizes — 1080×1080, 1080×1350, 1920×1080 and 1080×1920.');
});

// --- boot ---
buildPickers();
syncControls();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), state, { loadImage, loadSamples, redraw, setStatus, fontsReady });
} else {
  (async () => {
    await loadSamples();
    await fontsReady;
    redraw();
    setStatus('Ready — pick a layout and a grade, then export your cover.');
  })();
}
