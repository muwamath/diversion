# Diversion — Roadmap

A living document. Updated in the same commit as the work it describes.

## Phases

### Phase 1 — Foundation · *done 2026-04-14*
Bootstrap the repo, stack, and delivery pipeline so that new experiments can
be added with zero setup friction. Live at
`https://muwamath.github.io/diversion/`, deployed by GitHub Actions on push
to `main`.

### Phase 2 — First experiment (Gyrograph) · *in-progress*
Ship the first interactive experiment end-to-end: a hypotrochoid curve
drawer ("Gyrograph") with live-updating number inputs, URL-as-state
sharing, and a fullscreen screensaver mode. Establishes the per-experiment
folder pattern that future experiments will follow.

### Phase 2.1 — Polish · *pending*
- Revisit the display/show page URL structure (currently `/show/:slug`)
- Number input UX refinements (constrained ranges, validation)
- Animation pause/play toggle

### Phase 3 — Catalog · *pending*
Grow from one experiment to several, with a landing page that lists them and
basic navigation between them.

## Todos

Current tactical work, scoped to the active phase. Prune as items land.

- [ ] Code review pass on Phase 2 diff
- [ ] Final verification: local dev, prod build, deploy, live check
- [ ] Update README with adding-an-experiment section
