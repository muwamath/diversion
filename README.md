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
  draw.ts        — pure drawing function (all math here)
  index.ts       — re-exports a single Experiment object
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
