// Neon Shore — paints a GTA-poster-style cover on any 2D canvas.
//
// The painter is pure canvas: it takes a state object and draws the whole
// cover — panels, grades, lettering, badge, grain — at whatever size the
// canvas has, so the same scene renders identically at every export size.
// No DOM, no network, no state of its own beyond a cached grain tile.
//
// Seven layouts, seven grades, two title fonts, a gold-foil title, three
// panel-border styles. Photos are drawn cover-fit per panel with their own
// zoom and pan; grades are gradient-map / duotone overlays.

export const LAYOUTS = [
  { id: 'grid4', name: 'Four Panel', photos: 4 },
  { id: 'hero3', name: 'Hero + Three', photos: 4 },
  { id: 'full', name: 'Full Bleed', photos: 1 },
  { id: 'grid9', name: 'Nine Panel', photos: 8 },
  { id: 'tilt', name: 'Tilted Snapshot', photos: 2 },
  { id: 'magazine', name: 'Magazine', photos: 1 },
  { id: 'diptych', name: 'Diptych', photos: 2 },
];

export const GRADES = [
  { id: 'sunset', name: 'Sunset', hint: 'orange to magenta dusk' },
  { id: 'neon', name: 'Neon Vice', hint: 'pink and teal night' },
  { id: 'golden', name: 'Golden Hour', hint: 'warm late light' },
  { id: 'noir', name: 'Noir', hint: 'black and white contrast' },
  { id: 'teal', name: 'Palm Teal', hint: 'teal shadows, warm light' },
  { id: 'rose', name: 'Rose Gold', hint: 'blush pink and champagne gold' },
  { id: 'midnight', name: 'Midnight', hint: 'deep blue night, silver light' },
];

export const TITLE_FONTS = [
  { id: 'anton', name: 'Anton', family: 'Anton, sans-serif', hint: 'bold poster caps' },
  { id: 'playfair', name: 'Playfair', family: '"Playfair Display", serif', hint: 'elegant serif' },
];

export const BORDERS = [
  { id: 'white', name: 'White' },
  { id: 'gold', name: 'Gold thin' },
  { id: 'none', name: 'None' },
];

export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, name: 'Square · 1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, name: 'Portrait · 1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, name: 'Wide · 1920 × 1080' },
  { id: '1080x1920', w: 1080, h: 1920, name: 'Story · 1080 × 1920' },
];

// One-click looks: a layout + grade + lettering + border that work together.
export const PRESETS = [
  { id: 'vice', name: 'Vice Nights', layout: 'grid4', grade: 'neon', titleFont: 'anton', goldFoil: false, border: 'white', frame: true },
  { id: 'golden-hour', name: 'Golden Hour', layout: 'hero3', grade: 'golden', titleFont: 'anton', goldFoil: true, border: 'gold', frame: true },
  { id: 'noir-luxe', name: 'Noir Luxe', layout: 'magazine', grade: 'noir', titleFont: 'playfair', goldFoil: true, border: 'gold', frame: true },
  { id: 'rose-dawn', name: 'Rose Dawn', layout: 'diptych', grade: 'rose', titleFont: 'playfair', goldFoil: true, border: 'gold', frame: true },
];

export const SURPRISE_TITLES = [
  'NEON SHORE', 'VICE HEAT', 'PALM ROYALE', 'GOLDEN COAST', 'MIDNIGHT DRIVE', 'SOLMAR NIGHTS',
];

export function defaultState() {
  return {
    layout: 'grid4',
    grade: 'sunset',
    title: 'NEON SHORE',
    subtitle: 'a Vice City story',
    titleFont: 'anton',
    titleScale: 1,
    titleY: 0.86,
    goldFoil: false,
    border: 'white',
    issueLine: 'ISSUE 07 · SOLMAR CITY',
    frame: true,
    grain: true,
    vignette: true,
    badge: true,
    badgeText: 'SOLMAR CITY',
    heat: 4,
    // panels[i] = { src, img, zoom, ox, oy }
    panels: [],
  };
}

// ---------------------------------------------------------------------------
// Layout geometry
// ---------------------------------------------------------------------------

/** Panel rects for a layout, inside the art area (already inset for the frame). */
function panelRects(layout, ax, ay, aw, ah) {
  const g = Math.max(4, Math.min(aw, ah) * 0.012); // gutter between panels
  const rects = [];
  if (layout === 'grid4') {
    const cw = (aw - g) / 2, ch = (ah - g) / 2;
    rects.push(
      { x: ax, y: ay, w: cw, h: ch },
      { x: ax + cw + g, y: ay, w: cw, h: ch },
      { x: ax, y: ay + ch + g, w: cw, h: ch },
      { x: ax + cw + g, y: ay + ch + g, w: cw, h: ch },
    );
  } else if (layout === 'hero3') {
    const hh = ah * 0.6, bh = ah - hh - g;
    const cw = (aw - 2 * g) / 3;
    rects.push(
      { x: ax, y: ay, w: aw, h: hh },
      { x: ax, y: ay + hh + g, w: cw, h: bh },
      { x: ax + cw + g, y: ay + hh + g, w: cw, h: bh },
      { x: ax + 2 * (cw + g), y: ay + hh + g, w: cw, h: bh },
    );
  } else if (layout === 'full') {
    rects.push({ x: ax, y: ay, w: aw, h: ah });
  } else if (layout === 'grid9') {
    const cw = (aw - 2 * g) / 3, ch = (ah - 2 * g) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (r === 1 && c === 1) continue; // the centre cell is the title block
        rects.push({ x: ax + c * (cw + g), y: ay + r * (ch + g), w: cw, h: ch });
      }
    }
  } else if (layout === 'tilt') {
    // Main snapshot + a small one; rects are the unrotated bounds. Both end
    // above the title zone (~0.80H) so the title never covers a photo.
    rects.push(
      { x: ax + aw * 0.03, y: ay + ah * 0.08, w: aw * 0.72, h: ah * 0.62 },
      { x: ax + aw * 0.58, y: ay + ah * 0.56, w: aw * 0.36, h: ah * 0.22 },
    );
  } else if (layout === 'magazine') {
    // One hero photo, edge to edge; the title block floats over its foot.
    rects.push({ x: ax, y: ay, w: aw, h: ah });
  } else if (layout === 'diptych') {
    // Two tall panels side by side, the left one wider.
    const lw = aw * 0.55 - g / 2, rw = aw * 0.45 - g / 2;
    rects.push(
      { x: ax, y: ay, w: lw, h: ah },
      { x: ax + lw + g, y: ay, w: rw, h: ah },
    );
  }
  return rects;
}

/** Draw one photo into a rect, cover-fit, with per-panel zoom and pan. */
function drawPhoto(ctx, img, rect, zoom, ox, oy) {
  if (!img) return;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (zoom || 1);
  const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
  // ox/oy are fractions of the spare room, -1..1; clamp so the photo always covers
  const slackX = Math.max(0, pw - rect.w) / 2, slackY = Math.max(0, ph - rect.h) / 2;
  const dx = rect.x + (rect.w - pw) / 2 + (ox || 0) * slackX;
  const dy = rect.y + (rect.h - ph) / 2 + (oy || 0) * slackY;
  ctx.drawImage(img, dx, dy, pw, ph);
}

// ---------------------------------------------------------------------------
// Grades — gradient-map / duotone overlays, one per panel
// ---------------------------------------------------------------------------

function applyGrade(ctx, grade, r) {
  const { x, y, w, h } = r;
  const linear = (stops, mode, alpha) => {
    const gr = ctx.createLinearGradient(x, y, x, y + h);
    for (const [offset, color] of stops) gr.addColorStop(offset, color);
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  const flat = (color, mode, alpha) => {
    ctx.save();
    ctx.globalCompositeOperation = mode;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  };
  if (grade === 'sunset') {
    linear([[0, 'rgba(255,140,70,0)'], [0.55, 'rgba(255,110,60,0.22)'], [1, 'rgba(190,30,110,0.42)']], 'source-over', 1);
    flat('rgba(255,150,80,1)', 'soft-light', 0.35);
    flat('rgba(255,90,140,1)', 'overlay', 0.12);
  } else if (grade === 'neon') {
    flat('#808080', 'saturation', 0.5);
    const gr = ctx.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, 'rgba(255,45,150,0.55)');
    gr.addColorStop(0.5, 'rgba(120,40,180,0.25)');
    gr.addColorStop(1, 'rgba(0,220,220,0.55)');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = gr;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    flat('rgba(255,60,170,1)', 'screen', 0.1);
  } else if (grade === 'golden') {
    flat('rgba(255,190,90,1)', 'soft-light', 0.45);
    flat('rgba(255,160,60,1)', 'overlay', 0.2);
    linear([[0, 'rgba(255,220,150,0.20)'], [0.5, 'rgba(255,220,150,0)'], [1, 'rgba(120,50,0,0.18)']], 'source-over', 1);
  } else if (grade === 'noir') {
    flat('#808080', 'saturation', 1);
    flat('#000000', 'overlay', 0.22);
    flat('#ffffff', 'overlay', 0.12);
  } else if (grade === 'teal') {
    flat('rgba(20,120,130,1)', 'overlay', 0.3);
    flat('rgba(255,170,90,1)', 'soft-light', 0.3);
    linear([[0, 'rgba(0,180,180,0.18)'], [1, 'rgba(0,60,70,0.30)']], 'source-over', 1);
  } else if (grade === 'rose') {
    // Blush pink shadows, champagne-gold light — soft, warm, expensive.
    flat('rgba(255,150,170,1)', 'soft-light', 0.42);
    flat('rgba(232,180,120,1)', 'overlay', 0.18);
    linear([[0, 'rgba(255,210,200,0.22)'], [0.5, 'rgba(255,210,200,0)'], [1, 'rgba(120,30,60,0.26)']], 'source-over', 1);
  } else if (grade === 'midnight') {
    // Deep blue night: pull the colour out, push the shadows navy, silver highlights.
    flat('#808080', 'saturation', 0.45);
    flat('rgba(20,40,110,1)', 'overlay', 0.34);
    flat('rgba(140,170,255,1)', 'soft-light', 0.22);
    linear([[0, 'rgba(10,20,60,0.10)'], [1, 'rgba(5,10,40,0.38)']], 'source-over', 1);
  }
}

// ---------------------------------------------------------------------------
// Texture helpers
// ---------------------------------------------------------------------------

let grainTileCanvas = null;
function getGrainTile() {
  if (grainTileCanvas) return grainTileCanvas;
  grainTileCanvas = document.createElement('canvas');
  grainTileCanvas.width = 128;
  grainTileCanvas.height = 128;
  const g = grainTileCanvas.getContext('2d');
  const image = g.createImageData(128, 128);
  for (let i = 0; i < image.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 110);
    image.data[i] = v;
    image.data[i + 1] = v;
    image.data[i + 2] = v;
    image.data[i + 3] = 255;
  }
  g.putImageData(image, 0, 0);
  return grainTileCanvas;
}

function drawVignette(ctx, x, y, w, h) {
  const cx = x + w / 2, cy = y + h / 2, r = Math.hypot(w, h) / 2;
  const gr = ctx.createRadialGradient(cx, cy, r * 0.45, cx, cy, r);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = gr;
  ctx.fillRect(x, y, w, h);
}

// ---------------------------------------------------------------------------
// Lettering
// ---------------------------------------------------------------------------

function titleFamily(state) {
  const found = TITLE_FONTS.find((t) => t.id === (state.titleFont || 'anton'));
  return (found || TITLE_FONTS[0]).family;
}

function fitFont(ctx, text, maxWidth, startPx, family, weight) {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 10) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** A vertical gold gradient for the foil title, sized to the drawn text. */
function goldFill(ctx, cx, y, size, textWidth) {
  const gr = ctx.createLinearGradient(cx - textWidth / 2, y - size, cx + textWidth / 2, y + size * 0.1);
  gr.addColorStop(0, '#f7e7a1');
  gr.addColorStop(0.35, '#e8c15a');
  gr.addColorStop(0.5, '#b8860b');
  gr.addColorStop(0.65, '#f0d47e');
  gr.addColorStop(1, '#caa437');
  return gr;
}

function drawTitle(ctx, text, cx, y, maxWidth, basePx, state) {
  const title = (text || '').trim().toUpperCase();
  if (!title) return 0;
  const family = titleFamily(state);
  const weight = state.titleFont === 'playfair' ? '700' : '400';
  const size = fitFont(ctx, title, maxWidth, basePx, family, weight);
  const textWidth = ctx.measureText(title).width;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15,0,25,0.92)';
  ctx.lineWidth = Math.max(2, size * 0.09);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.shadowOffsetY = size * 0.04;
  ctx.font = `${weight} ${size}px ${family}`;
  if (state.titleFont === 'playfair') {
    try { ctx.letterSpacing = `${Math.round(size * 0.03)}px`; } catch { /* older canvas */ }
  }
  ctx.strokeText(title, cx, y);
  ctx.fillStyle = state.goldFoil ? goldFill(ctx, cx, y, size, textWidth) : '#ffffff';
  ctx.fillText(title, cx, y);
  ctx.restore();
  // Thin gold rule under the title, when the foil look is on.
  if (state.goldFoil) {
    const ruleW = Math.min(textWidth * 0.55, maxWidth * 0.42);
    const ruleH = Math.max(2, size * 0.03);
    ctx.save();
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(cx - ruleW / 2, y + size * 0.22, ruleW, ruleH);
    ctx.restore();
  }
  return size;
}

function drawSubtitle(ctx, text, cx, y, maxWidth, basePx, color) {
  const t = (text || '').trim();
  if (!t) return 0;
  const size = fitFont(ctx, t, maxWidth, basePx, 'Pacifico, cursive', '400');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.25;
  ctx.fillStyle = color || '#ff5da2';
  ctx.fillText(t, cx, y);
  ctx.restore();
  return size;
}

function drawStars(ctx, cx, y, size, filled, total) {
  const gap = size * 1.35, span = total * gap - (gap - size);
  let x = cx - span / 2;
  for (let i = 0; i < total; i++) {
    ctx.save();
    ctx.translate(x + size / 2, y);
    ctx.fillStyle = i < filled ? '#ffc44d' : 'rgba(255,255,255,0.35)';
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      const a2 = a + Math.PI / 5;
      const r1 = size / 2, r2 = size / 4.6;
      ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
      ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    x += gap;
  }
}

/** The small gold issue line above a magazine title, e.g. "ISSUE 07 · SOLMAR CITY". */
function drawIssueLine(ctx, text, cx, y, maxWidth, basePx) {
  const t = (text || '').trim().toUpperCase();
  if (!t) return 0;
  const size = fitFont(ctx, t, maxWidth, basePx, 'Anton, sans-serif', '400');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e8c15a';
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = size * 0.3;
  try { ctx.letterSpacing = `${Math.max(2, Math.round(size * 0.28))}px`; } catch { /* older canvas */ }
  ctx.font = `400 ${size}px Anton, sans-serif`;
  ctx.fillText(t, cx, y);
  ctx.restore();
  return size;
}

/** The title-block panel used by the nine-panel layout. */
function drawTitleBlock(ctx, r, state) {
  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  const gr = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  gr.addColorStop(0, 'rgba(255,45,150,0.35)');
  gr.addColorStop(1, 'rgba(0,220,220,0.22)');
  ctx.fillStyle = gr;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  const cx = r.x + r.w / 2;
  const words = (state.title || 'NEON SHORE').trim().toUpperCase().split(/\s+/);
  const half = Math.ceil(words.length / 2);
  const lines = words.length > 1 ? [words.slice(0, half).join(' '), words.slice(half).join(' ')] : words;
  const family = titleFamily(state);
  const weight = state.titleFont === 'playfair' ? '700' : '400';
  let y = r.y + r.h * 0.3;
  const ts = fitFont(ctx, lines[0], r.w * 0.88, r.h * 0.22, family, weight);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = state.goldFoil ? goldFill(ctx, cx, y, ts, ctx.measureText(lines[0]).width) : '#fff';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(15,0,25,0.9)';
  ctx.lineWidth = Math.max(1.5, ts * 0.08);
  for (const line of lines) {
    ctx.font = `${weight} ${ts}px ${family}`;
    ctx.strokeText(line, cx, y);
    ctx.fillText(line, cx, y);
    y += ts * 1.05;
  }
  ctx.restore();
  drawSubtitle(ctx, state.subtitle, cx, y + r.h * 0.1, r.w * 0.9, r.h * 0.13, '#ff5da2');
  drawStars(ctx, cx, r.y + r.h * 0.88, Math.min(18, r.h * 0.09), state.heat ?? 4, 5);
  ctx.restore();
}

/** Panel edge: white, a thin gold line, or nothing, per the border style. */
function drawPanelEdge(ctx, r, min, state) {
  const border = state.border || 'white';
  if (border === 'none') return;
  ctx.strokeStyle = border === 'gold' ? 'rgba(212,175,55,0.95)' : 'rgba(255,255,255,0.55)';
  ctx.lineWidth = border === 'gold' ? Math.max(1, min * 0.003) : Math.max(1, min * 0.002);
  ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
}

// ---------------------------------------------------------------------------
// The whole cover
// ---------------------------------------------------------------------------

/** Draw the whole cover onto `canvas` from `state`. Panels are {img, zoom, ox, oy}. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const min = Math.min(W, H);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, W, H);

  const frame = state.frame ? Math.round(min * 0.022) : 0;
  const ax = frame, ay = frame, aw = W - 2 * frame, ah = H - 2 * frame;
  const layout = state.layout || 'grid4';
  const grade = state.grade || 'sunset';
  const rects = panelRects(layout, ax, ay, aw, ah);
  const photos = state.panels || [];

  // Tilted snapshot: a dimmed full-bleed backdrop first, then the two prints.
  if (layout === 'tilt') {
    const bg = photos[0] && photos[0].img;
    if (bg) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      drawPhoto(ctx, bg, { x: 0, y: 0, w: W, h: H }, 1, 0, 0);
      ctx.restore();
      applyGrade(ctx, grade, { x: 0, y: 0, w: W, h: H });
    }
    ctx.fillStyle = 'rgba(22,10,36,0.35)';
    ctx.fillRect(0, 0, W, H);
  }

  // The panels.
  rects.forEach((r, i) => {
    const p = photos[i];
    const img = p && p.img;
    ctx.save();
    if (layout === 'tilt') {
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(i === 0 ? -0.07 : 0.09);
      ctx.translate(-r.w / 2, -r.h / 2);
      ctx.beginPath();
      ctx.rect(0, 0, r.w, r.h);
      ctx.clip();
      drawPhoto(ctx, img, { x: 0, y: 0, w: r.w, h: r.h }, p ? p.zoom : 1, p ? p.ox : 0, p ? p.oy : 0);
      applyGrade(ctx, grade, { x: 0, y: 0, w: r.w, h: r.h });
      ctx.restore();
      // A photo print keeps its white edge whatever the border style is.
      ctx.save();
      ctx.translate(r.x + r.w / 2, r.y + r.h / 2);
      ctx.rotate(i === 0 ? -0.07 : 0.09);
      ctx.strokeStyle = '#f5f0ea';
      ctx.lineWidth = Math.max(3, min * 0.012);
      ctx.strokeRect(-r.w / 2, -r.h / 2, r.w, r.h);
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.w, r.h);
      ctx.clip();
      if (img) drawPhoto(ctx, img, r, p.zoom, p.ox, p.oy);
      else {
        ctx.fillStyle = '#2a1740';
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
      applyGrade(ctx, grade, r);
      ctx.restore();
      drawPanelEdge(ctx, r, min, state);
    }
  });

  // Nine-panel: the centre cell is a title block, not a photo.
  if (layout === 'grid9') {
    const g = Math.max(4, Math.min(aw, ah) * 0.012);
    const cw = (aw - 2 * g) / 3, ch = (ah - 2 * g) / 3;
    drawTitleBlock(ctx, { x: ax + cw + g, y: ay + ch + g, w: cw, h: ch }, state);
  }

  // White frame around the art.
  if (frame > 0) {
    ctx.fillStyle = '#f5f0ea';
    ctx.fillRect(0, 0, W, frame);
    ctx.fillRect(0, H - frame, W, frame);
    ctx.fillRect(0, 0, frame, H);
    ctx.fillRect(W - frame, 0, frame, H);
  }

  // --- lettering ---
  if (layout === 'grid9') {
    // The title already lives in the centre block; nothing more to draw.
  } else if (layout === 'magazine') {
    // Elegant title block over the hero photo's foot: issue line, title,
    // thin gold rule, script subtitle, stars.
    const ty = H * (state.titleY ?? 0.86);
    const scrimH = H * 0.42;
    const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
    scrim.addColorStop(0, 'rgba(12,0,22,0)');
    scrim.addColorStop(0.55, 'rgba(12,0,22,0.45)');
    scrim.addColorStop(1, 'rgba(12,0,22,0.78)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - scrimH, W, scrimH);
    const tSize = drawTitle(ctx, state.title, W / 2, ty, W * 0.92, H * 0.115 * (state.titleScale || 1), state);
    if (state.issueLine) drawIssueLine(ctx, state.issueLine, W / 2, ty - tSize * 1.18, W * 0.9, H * 0.026);
    if (state.subtitle) drawSubtitle(ctx, state.subtitle, W / 2, ty + tSize * (state.goldFoil ? 0.82 : 0.62), W * 0.9, H * 0.042, '#ff5da2');
    if ((state.heat ?? 0) > 0) drawStars(ctx, W / 2, ty - tSize * 1.62, Math.min(26, H * 0.024), state.heat, 5);
  } else {
    const ty = H * (state.titleY ?? 0.86);
    const scrimH = H * 0.3;
    const scrim = ctx.createLinearGradient(0, H - scrimH, 0, H);
    scrim.addColorStop(0, 'rgba(12,0,22,0)');
    scrim.addColorStop(1, 'rgba(12,0,22,0.72)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H - scrimH, W, scrimH);
    const tSize = drawTitle(ctx, state.title, W / 2, ty, W * 0.92, H * 0.115 * (state.titleScale || 1), state);
    if (state.subtitle) drawSubtitle(ctx, state.subtitle, W / 2, ty + tSize * (state.goldFoil ? 0.82 : 0.62), W * 0.9, H * 0.042, '#ff5da2');
    if ((state.heat ?? 0) > 0) drawStars(ctx, W / 2, ty - tSize * 0.95, Math.min(26, H * 0.024), state.heat, 5);
  }

  // Badge ribbon, top right.
  if (state.badge) {
    const bw = W * 0.34, bh = Math.max(18, H * 0.045);
    ctx.save();
    ctx.translate(W - bw / 2 - W * 0.02, bh * 0.9);
    ctx.fillStyle = '#ff2d96';
    ctx.beginPath();
    ctx.moveTo(-bw / 2, -bh / 2);
    ctx.lineTo(bw / 2, -bh / 2);
    ctx.lineTo(bw / 2 - bh * 0.5, bh / 2);
    ctx.lineTo(-bw / 2 + bh * 0.5, bh / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `400 ${Math.round(bh * 0.52)}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((state.badgeText || 'SOLMAR CITY').toUpperCase(), 0, 1);
    ctx.restore();
  }

  // Grain + vignette over everything (not over the frame).
  if (state.grain) {
    const pattern = ctx.createPattern(getGrainTile(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pattern;
    ctx.fillRect(frame, frame, W - 2 * frame, H - 2 * frame);
    ctx.restore();
  }
  if (state.vignette) drawVignette(ctx, frame, frame, W - 2 * frame, H - 2 * frame);
}

/** Render the same scene to a fresh canvas at an exact export size. */
export function renderExport(state, w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  drawCover(c, state);
  return c;
}
