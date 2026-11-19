// Fixed scenes for screenshots: ?shot=editor shows the editor with photos
// loaded; ?shot=cover / cover2 / cover3 show finished covers alone.
// window.__shotReady is set once painted. Query params override
// title/subtitle/grade/layout for flexibility.
import { LAYOUTS } from './cover.js';

const SCENES = {
  // The elegant upgrade on show: Magazine layout, Playfair serif title in
  // gold foil with the thin gold rule, Rose Gold grade, gold panel borders.
  cover: {
    layout: 'magazine', grade: 'rose', title: 'SOLMAR NIGHTS',
    subtitle: 'a Vice City story', titleFont: 'playfair', goldFoil: true,
    border: 'gold', issueLine: 'ISSUE 07 · SOLMAR CITY', heat: 4,
    frame: true, badge: true,
  },
  cover2: {
    layout: 'hero3', grade: 'golden', title: 'PIER PRESSURE',
    subtitle: 'golden hour in Solmar', titleFont: 'anton', goldFoil: false,
    border: 'white', heat: 5, frame: true, badge: true,
  },
  cover3: {
    layout: 'tilt', grade: 'noir', title: 'NIGHT SHIFT',
    subtitle: 'downtown after dark', titleFont: 'anton', goldFoil: false,
    border: 'white', heat: 3, frame: false, badge: true,
  },
  editor: {
    layout: 'grid4', grade: 'sunset', title: 'BOULEVARD QUEEN',
    subtitle: 'a Vice City story', titleFont: 'anton', goldFoil: false,
    border: 'white', heat: 4, frame: true, badge: true,
  },
};

export async function runShot(shot, query, state, env) {
  const scene = SCENES[shot] || SCENES.cover;
  const canvas = document.getElementById('cover');
  if (shot !== 'editor') document.body.classList.add('shot-cover');
  // Scene values, overridable by query params.
  Object.assign(state, scene, {
    title: query.get('caption') ?? scene.title,
    grade: query.get('grade') ?? scene.grade,
    layout: query.get('layout') ?? scene.layout,
  });
  await env.loadSamples();
  await env.fontsReady;
  // Fill every panel with the samples in a fixed order (the tray is exposed
  // on window by main.js).
  const order = ['neon', 'rooftop', 'pier', 'boulevard'];
  const n = (LAYOUTS.find((l) => l.id === state.layout) || LAYOUTS[0]).photos;
  const tray = window.__neonShoreTray || [];
  state.panels = [];
  for (let i = 0; i < n; i++) {
    const s = tray.find((x) => x.id === order[i % order.length]);
    state.panels.push(s
      ? { src: s.id, img: s.img, zoom: 1, ox: 0, oy: 0 }
      : { src: null, img: null, zoom: 1, ox: 0, oy: 0 });
  }
  if (shot !== 'editor') {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  env.redraw();
  env.setStatus(`Shot: ${shot} — ${state.title}.`);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
