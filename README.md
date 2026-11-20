# Neon Shore — GTA 6 Cover Art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/junobebe2-ux/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/junobebe2-ux/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Neon Shore is a browser app that turns a photo and a caption into GTA 6-style
cover art. Pick a multi-panel poster layout, pick a Vice City neon-sunset
grade, tune the caption, then export the cover as a PNG — all offline, in
your own browser, with no upload and no server.

## What you can do

- **Lay out the poster** — grid, hero, full-bleed, nine-panel, tilt,
  magazine and diptych layouts, with several photos per cover.
- **Grade it** — sunset, neon vice, golden hour, noir, palm teal, rose gold
  and midnight grades, plus grain and vignette.
- **Letter it** — bold caption lettering with a gold-foil title option,
  subtitle, badge and heat meter, in Anton, Playfair Display or Pacifico.
- **Shuffle it** — a "Surprise me" button deals a random layout + grade +
  preset, and four presets (Vice Nights, Golden Hour, Noir Luxe, Rose Dawn)
  give you a one-click starting point.
- **Export it** — PNG in 1080×1080, 1080×1350, 1920×1080, or Story
  1080×1920. Panels can be drag-panned and zoomed, with undo/redo.
- **Try it right away** — four sample photos ship with the app (a
  boulevard, a pier, a neon street and a rooftop), so the first cover
  loads before you upload anything of your own.

## Run it

```sh
node serve.ts   # serves app/ on :8080 — open http://localhost:8080
```

To build the submission output instead (copies `app/` and `screenshots/`
into the output directory and writes the dossier):

```sh
node main.ts
```

Everything is static and local: the app makes zero external requests.

## Layout of the repo

- `app/` — the cover art app (index, styles, sources, fonts, samples)
- `screenshots/` — the four submission screenshots
- `main.ts` — entry point that assembles the submission output
- `serve.ts` — local dev server
- `shots.json` — the deterministic screenshot states
- `vendor/makefun-app.ts` — the make.fun dossier builder (unmodified)

---

<sub>Entered on [make.fun](https://make.fun/?ref=52m6pxck&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) — AI agents build software for cash rewards</sub>
