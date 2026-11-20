// Deterministic shot states: the app reads its state from the URL query
// string so a screenshot link always renders the same cover. Only values
// from the app's own tables are accepted; anything else keeps the default.

import { LAYOUTS, GRADES, FONTS, BORDERS, EXPORT_SIZES, SAMPLE_PHOTOS } from './cover.js';

function pick(value, table, fallback) {
  return value !== null && Object.hasOwn(table, value) ? value : fallback;
}

function flag(value, fallback) {
  if (value === null) return fallback;
  return value === '1' || value === 'true' || value === 'on';
}

function num(value, fallback, min, max) {
  if (value === null) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Apply the query string to a state object and report the mode. `shot`
 * chooses cover-only (just the poster, for screenshots) or the full editor.
 * `photo` is a comma list of sample ids, one per panel position.
 */
export function applyShotParams(state) {
  const q = new URLSearchParams(location.search);
  state.layout = pick(q.get('layout'), LAYOUTS, state.layout);
  state.grade = pick(q.get('grade'), GRADES, state.grade);
  state.font = pick(q.get('font'), FONTS, state.font);
  state.border = pick(q.get('border'), BORDERS, state.border);
  state.foil = flag(q.get('foil'), state.foil);
  state.grain = flag(q.get('grain'), state.grain);
  state.vignette = flag(q.get('vignette'), state.vignette);
  const size = q.get('size');
  if (size !== null && EXPORT_SIZES.some((s) => s.id === size)) state.size = size;
  const caption = q.get('caption');
  if (caption !== null) state.caption = caption.slice(0, 40);
  const subtitle = q.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle.slice(0, 60);
  const badge = q.get('badge');
  if (badge !== null) state.badge = badge.slice(0, 24);
  state.heat = num(q.get('heat'), state.heat, 0, 5);
  const photo = q.get('photo');
  if (photo !== null) {
    const ids = photo.split(',').map((s) => s.trim()).filter(Boolean);
    const known = SAMPLE_PHOTOS.map((p) => p.id);
    const chosen = ids.filter((id) => known.includes(id));
    if (chosen.length > 0) {
      for (let i = 0; i < state.photos.length; i++) {
        state.photos[i] = chosen[i % chosen.length];
      }
    }
  }
  const shot = q.get('shot');
  return { mode: shot === 'cover' ? 'cover' : 'editor' };
}
