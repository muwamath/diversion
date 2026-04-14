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
to see on screen, more to play with. Items ordered by current priority.

1. ~~**Configurable trail alpha**~~ *done 2026-04-14 — `alpha` field, range 0.01–1.0, default 0.15. Also bumped `width` default from 1.5 to 2.*
2. ~~**Configurable trail duration**~~ *done 2026-04-14 — trail
   semantics unchanged at the buffer level (still per-segment FIFO,
   one point per rAF frame, no fade), but the effective cap is now
   cycle-derived by default. New global fields: `autoTrail` (default
   `true`), `preDrawCycle` (default `false`), `maxHistorySeconds`
   (default 180). When `autoTrail` is true, effective trail equals
   one composed cycle's worth of frames at the reference 60fps rate,
   capped at `maxHistorySeconds * 60`. When `preDrawCycle` is true,
   the renderer pre-runs one full cycle at mount/config-change time
   and pre-fills the segment buffers so the "chasing itself" state
   is visible immediately. New helpers: `effectiveTrail.ts`
   (`computeEffectiveTrail`) and `preDrawCycle.ts` (`preDrawBuffers`).*
3. **Curated "interesting patterns" presets** — a row of preset
   buttons pinned above the config panel that set all knobs at once
   to visually striking combinations.
4. ~~**Visualize the arms and circles**~~ *done 2026-04-14 — optional
   mechanism overlay in the edit/live view: outer fixed circle,
   rolling inner circle, pen arm, endpoint dots. New `arms`,
   `circles`, `hideLive` config fields; conditional "Hide in
   fullscreen" checkbox in the controls panel. Completed out of
   order at the user's request — items 2 and 3 still pending.*
5. **Animation knobs (oscillation + per-segment speed)** — two
   overlapping animation mechanisms, designed together so we don't
   ship two competing systems:
   - **Oscillation:** let a config field animate between two values
     over a configurable period, so e.g. R can drift between 180 and
     220, or d can oscillate to make the curve breathe. Applies
     independently to each oscillation-capable field.
   - **Per-segment speed multiplier:** each segment gets an
     independent rate multiplier, breaking the rolling-without-slipping
     constraint. Opens the design space to cycloid/Lissajous-like
     shapes and polyrhythmic curves. Mechanism overlay will visibly
     show slipping when multipliers ≠ 1 (intentional).
   - **Open design questions:** which fields are oscillation-capable;
     period scale and easing; whether per-segment speed multipliers
     are restricted to rationals (so the composed-LCM cycle-time
     readout stays honest) or allow free decimals (readout falls back
     to `∞` for irrationals).
6. ~~**Nested trochoid chain (replaces the earlier "multi-arm" item)**~~
   *done 2026-04-14 — chain of up to 6 rolling segments, each
   rolling inside/outside its parent, each with its own pen, all
   driven by one linked mechanism. Globals: R, bg, speed, trail,
   arms, circles, `Show mechanism in fullscreen`. Per-segment: r,
   side (inside/outside), d, stroke, width, alpha, visible. Three-
   region sidebar: pinned-top cycle-time readout, scrolling-middle
   globals + per-segment sections with add/remove/up-down reorder,
   pinned-bottom share bar. URL schema: globals as individual
   params, segments packed into one `seg=...` param. Pure math in
   new `chain.ts` (walkChain) and `cycleTime.ts` (composed LCM).
   Old flat URL shape intentionally dropped — no prod users. Spec:
   `docs/superpowers/specs/2026-04-14-nested-trochoid-chain-design.md`.*

### Phase 3 — Catalog · *pending*
Grow from one experiment to several, with a landing page that lists them and
basic navigation between them.

## Backlog

Items identified but not scheduled to a specific phase yet.

- Playwright E2E smoke tests (SPA 404 redirect coverage; deferred from Phase 2.1)
- **Sidebar collapse for canvas headroom** — the polish batch shipped auto-fit canvas scaling with a responsive margin, so the curve already fills most of the edit-mode preview pane. Remaining open question: should the edit sidebar be collapsible so the canvas can grow into its space when the user wants to just stare at the curve? Not urgent now that the auto-fit exists.
- **Edit-mode playback controls (replaces live URL)** — rework the gyrograph edit UI to add playback controls, and drop the `/:slug/live` fullscreen route entirely (folding its "screensaver" intent into edit mode):
  - **Play/pause button** — pauses the animation. When paused, force-show arms and circles (regardless of the Show arms/Show circles toggles) so the mechanism is visible while tweaking config.
  - **Step forward / step back** — while paused, nudge the animation one small t-unit at a time to land on a specific frame.
  - **Fast forward** — while paused or running, skip ahead by a larger t-increment (or play temporarily at an accelerated rate) so the user doesn't have to wait a full cycle to preview something.
  - **Reset orientation** — snap all segments so their arms "point right" (t=0 alignment) so wheel sizes and pen arms are obvious at a glance.
  - Supersedes the earlier "Live-mode options menu" backlog item, which assumed the live route would stick around.
- **Longest-cycle saved preset** — a computed gyrograph preset that maximizes the composed-LCM cycle-time readout across all segments. Would serve as a "fun" saved session demonstrating the longest possible non-repeating trace for a given segment count.
- **Random config rework (gyrograph)** — a "randomize" button (or startup mode) that fills all globals and segments with random values inside their generous ranges. Exact scope TBD.
- **Non-circular rolling shapes** — explore curve families beyond the hypotrochoid/epitrochoid. Candidates: rolling polygons, ellipse-inside-circle, rosette curves, or a more general "rolling shape inside rolling shape" primitive. Substantial math rework — likely its own sub-experiment rather than a small tweak.
- **Jittery outside edges investigation (gyrograph)** — at certain config combinations, the outside edges of the drawn curve show visible jitter. Repro URL: `/gyrograph/live?R=199&bg=0a0a0a&speed=1&trail=4750&arms=0&circles=0&hideLive=1&seg=60,i,80,7AB6DE,20,0.15,1` (single segment with `d > r`, so the pen extends beyond the outer ring). Candidates to investigate: floating-point accumulation in the wall-clock `tRef` over many cycles; aliasing where the pen moves slowest at the curve extremes; trail-buffer slice shifting (`buffersRef.current[k] = buf.slice(-cfg.trail)`) causing visible chunk-boundary seams as points age out; sub-pixel rounding on the auto-fit scaled transform. Decide on a fix once the root cause is identified.

## Todos

Current tactical work, scoped to the active phase. Prune as items land.

(No active todos — next phase not yet started.)
