// Neon Shore — cover geometry, grades, presets and rendering.
// Everything in this file is authored for this rebuild: layouts, grades and
// the canvas export are defined here from the feature spec, not copied.

export const SAMPLE_PHOTOS = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard' },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier' },
  { id: 'neon', src: 'samples/neon.jpg', label: 'Neon Street' },
  { id: 'rooftop', src: 'samples/rooftop.jpg', label: 'Rooftop' },
];

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
  { id: 'story', label: '1080 × 1920', w: 1080, h: 1920 },
];

// A layout is a list of photo panels (fractions of the cover, 0..1) plus a
// title block. `rot` is a tilt in degrees. `band` is a plain colour block
// (the magazine's paper strip). `gap` is the fraction inset between panels.
export const LAYOUTS = {
  grid4: {
    label: 'Four Panel',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
    title: { x: 0.06, y: 0.76, w: 0.88, align: 'center', ink: 'light', scrim: true },
  },
  hero3: {
    label: 'Hero + Three',
    panels: [
      { x: 0, y: 0, w: 0.665, h: 1 },
      { x: 0.665, y: 0, w: 0.335, h: 0.333 },
      { x: 0.665, y: 0.333, w: 0.335, h: 0.334 },
      { x: 0.665, y: 0.667, w: 0.335, h: 0.333 },
    ],
    title: { x: 0.04, y: 0.72, w: 0.58, align: 'left', ink: 'light', scrim: true },
  },
  fullbleed: {
    label: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
    title: { x: 0.05, y: 0.74, w: 0.9, align: 'center', ink: 'light', scrim: true },
  },
  grid9: {
    label: 'Nine Panel',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 1 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 0, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 1 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
      { x: 2 / 3, y: 2 / 3, w: 1 / 3, h: 1 / 3 },
    ],
    title: { x: 1 / 3, y: 1 / 3, w: 1 / 3, align: 'center', ink: 'cell', scrim: false },
  },
  tilt: {
    label: 'Tilted Snapshots',
    panels: [
      { x: 0.07, y: 0.18, w: 0.58, h: 0.54, rot: -3 },
      { x: 0.56, y: 0.38, w: 0.38, h: 0.36, rot: 4 },
      { x: 0.14, y: 0.66, w: 0.46, h: 0.26, rot: -4 },
    ],
    title: { x: 0.08, y: 0.02, w: 0.84, align: 'center', ink: 'light', scrim: false },
  },
  magazine: {
    label: 'Magazine',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0.7, y: 0.64, w: 0.26, h: 0.3 },
    ],
    band: { x: 0, y: 0.6, w: 1, h: 0.4, fill: '#f4eee1' },
    title: { x: 0.05, y: 0.64, w: 0.6, align: 'left', ink: 'dark', scrim: false },
  },
  diptych: {
    label: 'Diptych',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 1 },
      { x: 0.5, y: 0, w: 0.5, h: 1 },
    ],
    title: { x: 0.1, y: 0.72, w: 0.8, align: 'center', ink: 'light', scrim: true },
  },
};

// A grade is a CSS filter for the photos plus a colour wash drawn over the
// whole cover (gradient + blend mode). The same definition drives the DOM
// overlay and the canvas export.
export const GRADES = {
  sunset: {
    label: 'Sunset',
    filter: 'saturate(1.25) contrast(1.06) brightness(1.02)',
    overlay: { blend: 'overlay', angle: 165, stops: [[0, 'rgba(255,122,26,0.30)'], [0.55, 'rgba(255,44,110,0.20)'], [1, 'rgba(24,8,64,0.22)']] },
  },
  'neon-vice': {
    label: 'Neon Vice',
    filter: 'saturate(1.5) contrast(1.08) hue-rotate(-12deg)',
    overlay: { blend: 'soft-light', angle: 140, stops: [[0, 'rgba(255,0,160,0.42)'], [0.5, 'rgba(120,0,255,0.20)'], [1, 'rgba(0,220,255,0.38)']] },
  },
  'golden-hour': {
    label: 'Golden Hour',
    filter: 'saturate(1.15) brightness(1.07) sepia(0.20)',
    overlay: { blend: 'soft-light', angle: 180, stops: [[0, 'rgba(255,190,80,0.34)'], [1, 'rgba(150,60,0,0.22)']] },
  },
  noir: {
    label: 'Noir',
    filter: 'grayscale(1) contrast(1.18) brightness(0.96)',
    overlay: null,
  },
  'palm-teal': {
    label: 'Palm Teal',
    filter: 'saturate(1.10) contrast(1.05)',
    overlay: { blend: 'soft-light', angle: 150, stops: [[0, 'rgba(0,180,170,0.30)'], [1, 'rgba(0,60,80,0.34)']] },
  },
  'rose-gold': {
    label: 'Rose Gold',
    filter: 'saturate(1.20) contrast(1.04)',
    overlay: { blend: 'soft-light', angle: 160, stops: [[0, 'rgba(255,170,150,0.32)'], [0.55, 'rgba(220,140,110,0.20)'], [1, 'rgba(90,30,60,0.24)']] },
  },
  midnight: {
    label: 'Midnight',
    filter: 'saturate(1.05) contrast(1.10) brightness(0.88)',
    overlay: { blend: 'multiply', angle: 180, stops: [[0, 'rgba(20,30,90,0.30)'], [1, 'rgba(4,6,26,0.42)']] },
  },
};

export const PRESETS = {
  'vice-nights': { label: 'Vice Nights', layout: 'grid4', grade: 'neon-vice', font: 'anton', foil: true, border: 'white' },
  'golden-hour': { label: 'Golden Hour', layout: 'hero3', grade: 'golden-hour', font: 'playfair', foil: true, border: 'gold' },
  'noir-luxe': { label: 'Noir Luxe', layout: 'tilt', grade: 'noir', font: 'playfair', foil: true, border: 'gold' },
  'rose-dawn': { label: 'Rose Dawn', layout: 'magazine', grade: 'rose-gold', font: 'playfair', foil: true, border: 'gold' },
};

export const FONTS = {
  anton: { label: 'Anton', family: "'Anton', 'Arial Narrow', sans-serif", cap: 0.088 },
  playfair: { label: 'Playfair', family: "'Playfair Display', Georgia, serif", cap: 0.076 },
};

export const BORDERS = {
  gold: { label: 'Gold thin', css: '2px solid rgba(212,175,55,0.95)', canvas: '#d4af37' },
  white: { label: 'White', css: '2px solid rgba(255,255,255,0.9)', canvas: '#ffffff' },
  none: { label: 'None', css: 'none', canvas: null },
};

const GAP = 0.012; // fraction of cover width between panels

function inset(rect, g) {
  return { x: rect.x + g / 2, y: rect.y + g / 2, w: rect.w - g, h: rect.h - g, rot: rect.rot ?? 0 };
}

/** The panel rectangles (fractions) for a layout, gutters applied. */
export function layoutPanels(layoutId) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.grid4;
  return layout.panels.map((p) => inset(p, GAP));
}

function starRow(heat) {
  let out = '';
  for (let i = 0; i < 5; i++) out += i < heat ? '★' : '☆';
  return out;
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Render the cover into a DOM element from state. Panels are absolutely
 * positioned; photos use an <img> with object-fit cover, panned by
 * transform-origin and zoomed by scale. The title block, grade wash, grain
 * and vignette are overlays on top.
 */
export function buildCover(state, coverEl) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid4;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const size = EXPORT_SIZES.find((s) => s.id === state.size) ?? EXPORT_SIZES[0];
  coverEl.style.aspectRatio = `${size.w} / ${size.h}`;
  coverEl.className = `cover layout-${state.layout} grade-${state.grade} border-${state.border}${state.foil ? ' foil-on' : ''}`;
  coverEl.replaceChildren();

  if (layout.band) {
    const band = el('div', 'band');
    band.style.left = `${layout.band.x * 100}%`;
    band.style.top = `${layout.band.y * 100}%`;
    band.style.width = `${layout.band.w * 100}%`;
    band.style.height = `${layout.band.h * 100}%`;
    band.style.background = layout.band.fill;
    coverEl.append(band);
  }

  const panels = layoutPanels(state.layout);
  panels.forEach((rect, i) => {
    const panel = el('div', 'panel');
    panel.dataset.index = String(i);
    panel.style.left = `${rect.x * 100}%`;
    panel.style.top = `${rect.y * 100}%`;
    panel.style.width = `${rect.w * 100}%`;
    panel.style.height = `${rect.h * 100}%`;
    if (rect.rot) panel.style.transform = `rotate(${rect.rot}deg)`;
    const view = state.views[i] ?? { px: 0.5, py: 0.5, zoom: 1 };
    const photo = resolvePhoto(state, state.photos[i]);
    const img = el('img');
    img.src = photo.src;
    img.alt = photo.label;
    img.draggable = false;
    img.style.filter = grade.filter;
    img.style.transformOrigin = `${view.px * 100}% ${view.py * 100}%`;
    img.style.transform = `scale(${view.zoom})`;
    panel.append(img);
    coverEl.append(panel);
  });

  const wash = el('div', 'grade-wash');
  if (grade.overlay) {
    const stops = grade.overlay.stops.map(([at, c]) => `${c} ${at * 100}%`).join(', ');
    wash.style.background = `linear-gradient(${grade.overlay.angle}deg, ${stops})`;
    wash.style.mixBlendMode = grade.overlay.blend;
  }
  coverEl.append(wash);

  const title = layout.title;
  if (title.scrim) {
    const scrim = el('div', 'title-scrim');
    scrim.style.left = `${(title.x - 0.02) * 100}%`;
    scrim.style.top = `${(title.y - 0.03) * 100}%`;
    scrim.style.width = `${(title.w + 0.04) * 100}%`;
    coverEl.append(scrim);
  }
  const block = el('div', `title-block ink-${title.ink}`);
  block.style.left = `${title.x * 100}%`;
  block.style.top = `${title.y * 100}%`;
  block.style.width = `${title.w * 100}%`;
  block.style.textAlign = title.align;
  const font = FONTS[state.font] ?? FONTS.anton;
  const caption = el('h1', 'caption');
  caption.style.fontFamily = font.family;
  caption.textContent = state.caption || 'UNTITLED';
  block.append(caption);
  if (state.foil) {
    const rule = el('div', 'gold-rule');
    block.append(rule);
  }
  const subtitle = el('div', 'subtitle', state.subtitle || '');
  block.append(subtitle);
  const meta = el('div', 'meta');
  if (state.badge) meta.append(el('span', 'badge', state.badge));
  meta.append(el('span', 'heat', starRow(state.heat)));
  block.append(meta);
  coverEl.append(block);

  if (state.grain) coverEl.append(el('div', 'grain'));
  if (state.vignette) coverEl.append(el('div', 'vignette'));
}

/** Find a photo by id across the samples and any uploaded photos. */
export function resolvePhoto(state, id) {
  const all = [...SAMPLE_PHOTOS, ...(state.customPhotos ?? [])];
  return all.find((p) => p.id === id) ?? SAMPLE_PHOTOS[0];
}

// ---------------------------------------------------------------- canvas export

const imageCache = new Map();
function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const done = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
  imageCache.set(src, done);
  return done;
}

/** Deterministic pseudo-random generator (fixed seed) for the grain. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPanelImage(ctx, img, rect, view) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const panelRatio = rect.w / rect.h;
  const imgRatio = iw / ih;
  let sw;
  let sh;
  if (imgRatio > panelRatio) {
    sh = ih;
    sw = ih * panelRatio;
  } else {
    sw = iw;
    sh = iw / panelRatio;
  }
  const zoom = Math.max(1, view.zoom || 1);
  sw /= zoom;
  sh /= zoom;
  let sx = (view.px ?? 0.5) * iw - sw / 2;
  let sy = (view.py ?? 0.5) * ih - sh / 2;
  sx = Math.min(Math.max(sx, 0), iw - sw);
  sy = Math.min(Math.max(sy, 0), ih - sh);
  ctx.drawImage(img, sx, sy, sw, sh, rect.x, rect.y, rect.w, rect.h);
}

function fitCaption(ctx, text, fontFamily, weight, maxWidth, startPx) {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${fontFamily}`;
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    ctx.font = `${weight} ${px}px ${fontFamily}`;
  }
  return px;
}

function goldGradient(ctx, x, y, w, h) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#f9e08a');
  g.addColorStop(0.35, '#d4af37');
  g.addColorStop(0.55, '#fff3c4');
  g.addColorStop(0.75, '#b8860b');
  g.addColorStop(1, '#f2d06b');
  return g;
}

/**
 * Draw the whole cover onto a canvas of exactly w x h pixels and return it.
 * Shares the layout and grade definitions with the DOM preview, so the PNG
 * matches what the editor shows.
 */
export async function drawCoverToCanvas(state, w, h) {
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.grid4;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);

  const panels = layoutPanels(state.layout).map((r) => ({
    x: r.x * w,
    y: r.y * h,
    w: r.w * w,
    h: r.h * h,
    rot: r.rot,
  }));

  // Photos, each clipped to its panel (rotated when the layout tilts).
  for (let i = 0; i < panels.length; i++) {
    const rect = panels[i];
    const view = state.views[i] ?? { px: 0.5, py: 0.5, zoom: 1 };
    const photo = resolvePhoto(state, state.photos[i]);
    const img = await loadImage(photo.src);
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-(rect.x + rect.w / 2), -(rect.y + rect.h / 2));
    }
    ctx.filter = grade.filter;
    drawPanelImage(ctx, img, rect, view);
    ctx.restore();
  }
  ctx.filter = 'none';

  if (layout.band) {
    ctx.fillStyle = layout.band.fill;
    ctx.fillRect(layout.band.x * w, layout.band.y * h, layout.band.w * w, layout.band.h * h);
  }

  // Grade wash over the whole cover.
  if (grade.overlay) {
    const angle = ((grade.overlay.angle - 90) * Math.PI) / 180;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle));
    const x0 = cx - (Math.cos(angle) * len) / 2;
    const y0 = cy - (Math.sin(angle) * len) / 2;
    const x1 = cx + (Math.cos(angle) * len) / 2;
    const y1 = cy + (Math.sin(angle) * len) / 2;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [at, color] of grade.overlay.stops) g.addColorStop(at, color);
    ctx.save();
    ctx.globalCompositeOperation = grade.overlay.blend;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Panel borders.
  const border = BORDERS[state.border];
  if (border?.canvas) {
    ctx.save();
    ctx.strokeStyle = border.canvas;
    ctx.lineWidth = Math.max(2, Math.round(w / 540));
    for (const rect of panels) {
      if (rect.rot) {
        ctx.save();
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        ctx.rotate((rect.rot * Math.PI) / 180);
        ctx.strokeRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
        ctx.restore();
      } else {
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      }
    }
    ctx.restore();
  }

  // Title block.
  const title = layout.title;
  const tx = title.x * w;
  const ty = title.y * h;
  const tw = title.w * w;
  const font = FONTS[state.font] ?? FONTS.anton;
  const ink = title.ink === 'dark' ? '#1c1710' : '#ffffff';
  const align = title.align;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const anchorX = align === 'center' ? tx + tw / 2 : align === 'right' ? tx + tw : tx;
  let cursorY = ty;
  const captionText = (state.caption || 'UNTITLED').toUpperCase();
  const capPx = fitCaption(ctx, captionText, font.family, state.font === 'playfair' ? 700 : 400, tw, Math.round(w * font.cap));
  if (state.foil) {
    ctx.fillStyle = goldGradient(ctx, tx, cursorY, tw, capPx);
  } else {
    ctx.fillStyle = ink;
  }
  ctx.shadowColor = title.ink === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = Math.round(w * 0.006);
  ctx.shadowOffsetY = Math.round(w * 0.002);
  ctx.fillText(captionText, anchorX, cursorY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  cursorY += capPx * 1.05;
  if (state.foil) {
    const rule = ctx.createLinearGradient(tx, 0, tx + tw, 0);
    rule.addColorStop(0, 'rgba(212,175,55,0)');
    rule.addColorStop(0.5, '#d4af37');
    rule.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = rule;
    ctx.fillRect(tx, cursorY, tw, Math.max(2, Math.round(h * 0.002)));
    cursorY += Math.max(6, Math.round(h * 0.012));
  }
  if (state.subtitle) {
    const subPx = Math.round(w * 0.028);
    ctx.font = `400 ${subPx}px 'Pacifico', cursive`;
    ctx.fillStyle = title.ink === 'dark' ? '#6b4a2f' : '#ffd9ec';
    ctx.fillText(state.subtitle, anchorX, cursorY);
    cursorY += subPx * 1.6;
  }
  const metaPx = Math.round(w * 0.02);
  ctx.font = `400 ${metaPx}px 'Anton', sans-serif`;
  try {
    ctx.letterSpacing = `${Math.round(w * 0.003)}px`;
  } catch {
    // letterSpacing is optional; spacing stays default when unsupported.
  }
  ctx.fillStyle = ink;
  const bits = [];
  if (state.badge) bits.push(state.badge.toUpperCase());
  bits.push(starRow(state.heat));
  ctx.fillText(bits.join('   ·   '), anchorX, cursorY);
  try {
    ctx.letterSpacing = '0px';
  } catch {
    // ignore
  }

  // Grain: a seeded noise pattern tiled over the cover.
  if (state.grain) {
    const noise = document.createElement('canvas');
    noise.width = 128;
    noise.height = 128;
    const nctx = noise.getContext('2d');
    const data = nctx.createImageData(128, 128);
    const rand = mulberry32(7);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(rand() * 255);
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 28;
    }
    nctx.putImageData(data, 0, 0);
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = ctx.createPattern(noise, 'repeat');
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Vignette.
  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  return canvas;
}
