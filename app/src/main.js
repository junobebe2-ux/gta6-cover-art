// Neon Shore — editor entry point. Owns the state, the toolbar, photo
// handling, drag-to-pan / wheel zoom, undo + redo and PNG export.

import {
  SAMPLE_PHOTOS,
  EXPORT_SIZES,
  LAYOUTS,
  GRADES,
  PRESETS,
  FONTS,
  BORDERS,
  buildCover,
  drawCoverToCanvas,
  resolvePhoto,
} from './cover.js';
import { applyShotParams } from './shots.js';

const $ = (id) => document.getElementById(id);

function defaultState() {
  const photos = [];
  const views = [];
  for (let i = 0; i < 9; i++) {
    photos.push(SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length].id);
    views.push({ px: 0.5, py: 0.5, zoom: 1 });
  }
  return {
    layout: 'magazine',
    grade: 'rose-gold',
    font: 'playfair',
    foil: true,
    border: 'gold',
    grain: true,
    vignette: true,
    caption: 'SOLMAR NIGHTS',
    subtitle: 'Vice City · 2026',
    badge: 'EST. 2026',
    heat: 4,
    size: 'square',
    photos,
    views,
    customPhotos: [],
  };
}

const state = defaultState();
// UI-only state, never part of undo snapshots.
const ui = { selected: 0, drag: null, wheelTimer: 0 };

let undoStack = [];
let redoStack = [];
let coverEl = null;

function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function commit() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function undo() {
  if (undoStack.length === 0) return;
  redoStack.push(snapshot());
  Object.assign(state, undoStack.pop());
  render();
  syncUndoButtons();
}

function redo() {
  if (redoStack.length === 0) return;
  undoStack.push(snapshot());
  Object.assign(state, redoStack.pop());
  render();
  syncUndoButtons();
}

function syncUndoButtons() {
  $('undoBtn').disabled = undoStack.length === 0;
  $('redoBtn').disabled = redoStack.length === 0;
}

function panelCount() {
  return (LAYOUTS[state.layout] ?? LAYOUTS.grid4).panels.length;
}

function clampSelected() {
  ui.selected = Math.min(ui.selected, panelCount() - 1);
}

function fitCover() {
  const stage = document.querySelector('.stage');
  if (!stage || !coverEl) return;
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  const availW = stage.clientWidth - 36;
  const availH = stage.clientHeight - 36;
  const aspect = size.w / size.h;
  let w = availW;
  let h = w / aspect;
  if (h > availH) {
    h = availH;
    w = h * aspect;
  }
  coverEl.style.width = `${Math.max(120, Math.floor(w))}px`;
  coverEl.style.height = `${Math.max(120, Math.floor(h))}px`;
}

function render() {
  clampSelected();
  buildCover(state, coverEl);
  fitCover();
  coverEl.querySelectorAll('.panel').forEach((panel) => {
    panel.classList.toggle('selected', Number(panel.dataset.index) === ui.selected);
  });
  syncPickers();
}

function chip(container, items, activeId, onPick) {
  container.replaceChildren();
  for (const [id, item] of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.id = id;
    b.textContent = item.label ?? item;
    if (id === activeId) b.classList.add('active');
    b.addEventListener('click', () => onPick(id));
    container.append(b);
  }
}

function syncPickers() {
  chip($('layoutPicker'), Object.entries(LAYOUTS), state.layout, (id) => {
    commit();
    state.layout = id;
    render();
  });
  chip($('gradePicker'), Object.entries(GRADES), state.grade, (id) => {
    commit();
    state.grade = id;
    render();
  });
  chip($('fontPicker'), Object.entries(FONTS), state.font, (id) => {
    commit();
    state.font = id;
    render();
  });
  chip($('presetPicker'), Object.entries(PRESETS), null, (id) => {
    const p = PRESETS[id];
    commit();
    state.layout = p.layout;
    state.grade = p.grade;
    state.font = p.font;
    state.foil = p.foil;
    state.border = p.border;
    render();
  });
  chip($('borderPicker'), Object.entries(BORDERS), state.border, (id) => {
    commit();
    state.border = id;
    render();
  });
  $('foilToggle').checked = state.foil;
  $('grainToggle').checked = state.grain;
  $('vignetteToggle').checked = state.vignette;
  $('captionInput').value = state.caption;
  $('subtitleInput').value = state.subtitle;
  $('badgeInput').value = state.badge;
  syncHeat();
  syncPhotoPanel();
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  $('sizeSelect').value = size.id;
  const view = state.views[ui.selected] ?? { zoom: 1 };
  $('zoomSlider').value = String(Math.round(view.zoom * 100));
  $('zoomLabel').textContent = `${Math.round(view.zoom * 100)}%`;
}

function syncHeat() {
  $('heatStars').querySelectorAll('button').forEach((b, i) => {
    b.textContent = i < state.heat ? '★' : '☆';
    b.classList.toggle('lit', i < state.heat);
  });
}

function syncPhotoPanel() {
  const list = $('photoThumbs');
  list.replaceChildren();
  const all = [...SAMPLE_PHOTOS, ...state.customPhotos];
  for (const photo of all) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'thumb';
    b.title = photo.label;
    if (state.photos[ui.selected] === photo.id) b.classList.add('active');
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = photo.label;
    b.append(img);
    b.addEventListener('click', () => {
      commit();
      state.photos[ui.selected] = photo.id;
      render();
    });
    list.append(b);
  }
  $('panelLabel').textContent = `Panel ${ui.selected + 1} of ${panelCount()}`;
}

function applyText(input, key) {
  input.addEventListener('change', () => {
    commit();
    state[key] = input.value;
    render();
  });
}

function shuffle() {
  commit();
  const layouts = Object.keys(LAYOUTS);
  const grades = Object.keys(GRADES);
  const fonts = Object.keys(FONTS);
  const presetIds = Object.keys(PRESETS);
  const preset = PRESETS[presetIds[Math.floor(Math.random() * presetIds.length)]];
  state.layout = layouts[Math.floor(Math.random() * layouts.length)];
  state.grade = grades[Math.floor(Math.random() * grades.length)];
  state.font = fonts[Math.floor(Math.random() * fonts.length)];
  state.foil = Math.random() < 0.7;
  state.border = Math.random() < 0.5 ? 'gold' : 'white';
  // One in three shuffles lands on a whole preset look instead.
  if (Math.random() < 0.33) {
    state.layout = preset.layout;
    state.grade = preset.grade;
    state.font = preset.font;
    state.foil = preset.foil;
    state.border = preset.border;
  }
  render();
}

async function exportPng(sizeId) {
  const size = EXPORT_SIZES.find((s) => s.id === sizeId) ?? EXPORT_SIZES[0];
  await document.fonts.ready;
  const canvas = await drawCoverToCanvas(state, size.w, size.h);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  return { size, blob };
}

async function downloadExport() {
  const btn = $('exportBtn');
  btn.disabled = true;
  btn.textContent = 'Rendering…';
  try {
    const { size, blob } = await exportPng(state.size);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-shore-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Export PNG';
  }
}

function readFilesAsPhotos(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (images.length === 0) return;
  commit();
  let pending = images.length;
  for (const file of images) {
    const reader = new FileReader();
    reader.onload = () => {
      const id = `upload-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
      state.customPhotos.push({ id, src: String(reader.result), label: file.name });
      state.photos[ui.selected] = id;
      pending -= 1;
      if (pending === 0) render();
    };
    reader.readAsDataURL(file);
  }
}

function bindPanZoom() {
  coverEl.addEventListener('pointerdown', (ev) => {
    const panel = ev.target.closest('.panel');
    if (!panel) return;
    const index = Number(panel.dataset.index);
    ui.selected = index;
    render();
    const view = state.views[index];
    // Capture the pre-drag state now: the drag mutates the view live, so a
    // snapshot taken at pointerup would already hold the new position.
    ui.drag = { index, startX: ev.clientX, startY: ev.clientY, px: view.px, py: view.py, moved: false, preState: snapshot() };
    // setPointerCapture can throw for synthetic pointer events (no active
    // pointer); the drag still works through the cover-level listeners.
    try {
      panel.setPointerCapture(ev.pointerId);
    } catch {
      // ignore: pointer capture is an optimisation, not required.
    }
  });
  coverEl.addEventListener('pointermove', (ev) => {
    if (!ui.drag) return;
    const panel = coverEl.querySelector(`.panel[data-index="${ui.drag.index}"]`);
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    const dx = ev.clientX - ui.drag.startX;
    const dy = ev.clientY - ui.drag.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) ui.drag.moved = true;
    const view = state.views[ui.drag.index];
    const zoom = Math.max(1, view.zoom || 1);
    view.px = Math.min(1, Math.max(0, ui.drag.px - dx / (rect.width * zoom)));
    view.py = Math.min(1, Math.max(0, ui.drag.py - dy / (rect.height * zoom)));
    const img = panel.querySelector('img');
    if (img) img.style.transformOrigin = `${view.px * 100}% ${view.py * 100}%`;
  });
  const endDrag = () => {
    if (!ui.drag) return;
    if (ui.drag.moved) {
      // One undo step for the whole drag: push the pre-drag snapshot.
      undoStack.push(ui.drag.preState);
      if (undoStack.length > 60) undoStack.shift();
      redoStack = [];
      syncUndoButtons();
    }
    ui.drag = null;
  };
  coverEl.addEventListener('pointerup', endDrag);
  coverEl.addEventListener('pointercancel', () => {
    ui.drag = null;
  });
  coverEl.addEventListener('wheel', (ev) => {
    const panel = ev.target.closest('.panel');
    if (!panel) return;
    ev.preventDefault();
    const index = Number(panel.dataset.index);
    ui.selected = index;
    // First wheel event of a burst: remember the pre-burst state.
    if (!ui.wheelPre) ui.wheelPre = snapshot();
    const view = state.views[index];
    const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
    view.zoom = Math.min(3, Math.max(1, (view.zoom || 1) * factor));
    const img = panel.querySelector('img');
    if (img) img.style.transform = `scale(${view.zoom})`;
    panel.classList.add('selected');
    syncPhotoPanel();
    $('zoomSlider').value = String(Math.round(view.zoom * 100));
    $('zoomLabel').textContent = `${Math.round(view.zoom * 100)}%`;
    clearTimeout(ui.wheelTimer);
    ui.wheelTimer = setTimeout(() => {
      // Burst over: one undo step for the whole wheel burst.
      if (ui.wheelPre) {
        undoStack.push(ui.wheelPre);
        if (undoStack.length > 60) undoStack.shift();
        redoStack = [];
        ui.wheelPre = null;
        syncUndoButtons();
      }
    }, 350);
  }, { passive: false });
}

function init() {
  coverEl = $('cover');
  const { mode } = applyShotParams(state);
  if (mode === 'cover') document.body.classList.add('shot-cover');

  const sizeSelect = $('sizeSelect');
  for (const s of EXPORT_SIZES) {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.label;
    sizeSelect.append(opt);
  }
  sizeSelect.addEventListener('change', () => {
    commit();
    state.size = sizeSelect.value;
    render();
  });

  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  $('shuffleBtn').addEventListener('click', shuffle);
  $('exportBtn').addEventListener('click', downloadExport);
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) redo();
      else undo();
    }
  });

  applyText($('captionInput'), 'caption');
  applyText($('subtitleInput'), 'subtitle');
  applyText($('badgeInput'), 'badge');
  $('heatStars').querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      commit();
      state.heat = i + 1;
      render();
    });
  });

  const toggle = (id, key) => {
    $(id).addEventListener('change', (ev) => {
      commit();
      state[key] = ev.target.checked;
      render();
    });
  };
  toggle('foilToggle', 'foil');
  toggle('grainToggle', 'grain');
  toggle('vignetteToggle', 'vignette');

  $('zoomSlider').addEventListener('input', (ev) => {
    const view = state.views[ui.selected];
    view.zoom = Number(ev.target.value) / 100;
    const panel = coverEl.querySelector(`.panel[data-index="${ui.selected}"] img`);
    if (panel) panel.style.transform = `scale(${view.zoom})`;
    $('zoomLabel').textContent = `${ev.target.value}%`;
  });
  $('zoomSlider').addEventListener('change', () => {
    commit();
    render();
  });

  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (ev) => {
    readFilesAsPhotos(ev.target.files);
    ev.target.value = '';
  });
  coverEl.addEventListener('dragover', (ev) => ev.preventDefault());
  coverEl.addEventListener('drop', (ev) => {
    ev.preventDefault();
    const panel = ev.target.closest('.panel');
    if (panel) ui.selected = Number(panel.dataset.index);
    readFilesAsPhotos(ev.dataTransfer.files);
  });

  bindPanZoom();
  render();
  syncUndoButtons();
  window.addEventListener('resize', fitCover);

  // Test hooks: the verification harness drives the app through these.
  window.__cover = {
    state,
    render,
    layouts: Object.keys(LAYOUTS),
    grades: Object.keys(GRADES),
    exportTest: async (sizeId) => {
      const { size, blob } = await exportPng(sizeId);
      const buf = new Uint8Array(await blob.arrayBuffer());
      const pngW = (buf[16] << 24) | (buf[17] << 16) | (buf[18] << 8) | buf[19];
      const pngH = (buf[20] << 24) | (buf[21] << 16) | (buf[22] << 8) | buf[23];
      return { w: size.w, h: size.h, bytes: blob.size, pngW, pngH };
    },
  };
  document.fonts.ready.then(() => {
    window.__shotReady = true;
  });
}

init();
