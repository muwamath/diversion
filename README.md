# Diversion

A collection of small visual experiments — screensaver-style interactive
pieces and miniature games — built with React, TypeScript, and Vite.

**Live:** https://muwamath.github.io/diversion/

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview  # serve the built artifact locally
```

## Tests

```bash
npm test          # watch mode (Vitest + React Testing Library)
npm run test:run  # one-shot; this is the CI gate before the build step
```

Tests live next to the code they cover (`*.test.ts` / `*.test.tsx`). The
suite covers schema serialization, the `walkChain` math (hypotrochoid
and epitrochoid reduction at N=1), cycle-time LCM math, mechanism
visibility, router URL matrix, ShareBar, and the regression for
`useExperimentConfig`.

## Adding an experiment

Each experiment lives in `src/experiments/<slug>/` and exports a single
`Experiment` object. Create these files:

```
src/experiments/<slug>/
  meta.ts        — slug, display name, description
  schema.ts      — config type + parse/stringify for URL params
  defaults.ts    — default config values
  Controls.tsx   — form inputs for this experiment
  Renderer.tsx   — canvas component (receives config + size)
  draw.ts        — canvas drawing functions
  index.ts       — re-exports a single Experiment object (may also
                   provide an optional TopBar component for the
                   pinned-top region of the edit sidebar)
```

Then register it in `src/experiments/registry.ts`.

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for the active phase plan and short-term
todos. The roadmap is a living document; it evolves in the same commits as
the work it describes.

## License

MIT — see [`LICENSE`](./LICENSE).

## Attributions

External sources (code, art, ideas) used in this project are credited in
[`ATTRIBUTIONS.md`](./ATTRIBUTIONS.md). When something is borrowed or
adapted, it's attributed back to the original.
