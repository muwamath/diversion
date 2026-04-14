# Diversion — Roadmap

A living document. Updated in the same commit as the work it describes.

## Phases

### Phase 1 — Foundation · *in-progress*
Bootstrap the repo, stack, and delivery pipeline so that new experiments can
be added with zero setup friction. Done when
`https://muwamath.github.io/diversion/` serves a clean placeholder page
deployed by CI on every push to `main`.

### Phase 2 — First experiment · *pending*
Ship one complete screensaver-style piece end-to-end. Establishes the
per-experiment pattern (folder layout, entry point, how multiple experiments
will coexist) that future pieces will follow.

### Phase 3 — Catalog · *pending*
Grow from one experiment to several, with a landing page that lists them and
basic navigation between them.

## Todos

Current tactical work, scoped to the active phase. Prune as items land.

- [ ] Commit Phase 1 scaffold and push to `main`
- [ ] Verify the GitHub Actions deploy workflow runs green
- [ ] Enable GitHub Pages (source: GitHub Actions) via `gh api`
- [ ] Open the live URL in a browser and confirm the placeholder loads with no console errors
- [ ] Mark Phase 1 *done*; open Phase 2 brainstorm
