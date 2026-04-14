# Diversion — Roadmap

A living document. Updated in the same commit as the work it describes.

## Phases

### Phase 1 — Foundation · *done 2026-04-14*
Bootstrap the repo, stack, and delivery pipeline so that new experiments can
be added with zero setup friction. Live at
`https://muwamath.github.io/diversion/`, deployed by GitHub Actions on push
to `main`.

### Phase 2 — First experiment (Gyrograph) · *done 2026-04-14*
Ship the first interactive experiment end-to-end: a hypotrochoid curve
drawer ("Gyrograph") with live-updating number inputs, URL-as-state
sharing, and a fullscreen screensaver mode. Establishes the per-experiment
folder pattern that future experiments will follow.

### Phase 2.1 — Foundational polish · *done 2026-04-14*
Route redesign and test infrastructure, so future feature work has a
clean URL surface and a real regression net underneath it.
- ~~URL structure~~ *done 2026-04-14 — `/:slug/edit` and `/:slug/live`; slug convention now chosen for readability; bookmarks with query params redirect cleanly*
- ~~Test infrastructure~~ *done 2026-04-14 — Vitest + React Testing Library, 22 tests across 5 files (schema, draw math, hook regression, router URL matrix, ShareBar). CI gate enforces `npm run test:run` before build.*

### Phase 2.2 — Gyrograph feature expansion · *pending*
Build on the foundation. Turn Gyrograph from a single-pen hypotrochoid
into a richer visual playground — more expressive configuration, more
to see on screen, more to play with. Items ordered simplest first.

1. ~~**Configurable trail alpha**~~ *done 2026-04-14 — `alpha` field, range 0.01–1.0, default 0.15. Also bumped `width` default from 1.5 to 2.*
2. **Curated "interesting patterns" presets** — a row of preset
   buttons pinned above the config panel that set all knobs at once
   to visually striking combinations.
3. **Configurable trail duration** — how long the line lasts before
   it fades or truncates (current `trail` is a segment count; this
   item gives it meaningful semantics).
4. **Visualize the arms and circles** — optionally render the outer
   circle, the rolling inner circle, and the pen arm so the
   mechanism is visible, not just the curve it traces. Toggle in the
   config panel.
5. **Oscillation for any field** — let a config field animate between
   two values over a configurable period, so e.g. R can drift between
   180 and 220, or d can oscillate to make the curve breathe. Applies
   independently to each oscillation-capable field.
6. **Multi-arm gyrograph with per-arm config** — support an arbitrary
   number of pens, each with its own independent config (R, r, d,
   stroke, alpha, oscillation, etc.), all rendered into the same
   canvas. Add/remove arms from the UI.

### Phase 3 — Catalog · *pending*
Grow from one experiment to several, with a landing page that lists them and
basic navigation between them.

## Backlog

Items identified but not scheduled to a specific phase yet.

- Number input UX refinements (constrained ranges, validation) — cross-cutting, applies to any experiment
- Animation pause/play toggle — cross-cutting fullscreen-mode concern
- Playwright E2E smoke tests (SPA 404 redirect coverage; deferred from Phase 2.1)

## Todos

Current tactical work, scoped to the active phase. Prune as items land.

(No active todos — next phase not yet started.)
