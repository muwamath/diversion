# Diversion — Project Notes

## What this is

A collection of interactive visual math experiments deployed to GitHub
Pages at https://muwamath.github.io/diversion/.

Stack: Vite + React 19 + TypeScript. No styling library — plain CSS.

## Architecture

- **Router**: React Router v7, `BrowserRouter` with `basename` for
  gh-pages subpath. SPA routing handled by `public/404.html` redirect.
- **Experiments**: Each experiment is a self-contained folder under
  `src/experiments/<slug>/` implementing the `Experiment` interface from
  `src/experiments/types.ts`. Registry at `src/experiments/registry.ts`.
- **State**: URL search params are the single source of truth for all
  config. No context, no store.
- **Routes**: `/:slug/edit` (config + live preview), `/:slug/live`
  (fullscreen). `/` and bare `/:slug` redirect to the default
  experiment's edit page.

## Current experiments

- **Gyrograph** (`gyrograph`) — nested trochoid chain drawer. A global
  outer circle `R` plus a chain of up to 6 rolling segments, each
  rolling inside or outside its parent. Every segment has its own pen,
  so N segments produce N curves from one linked mechanism. Globals:
  `R`, `bg`, `speed`, `trail`, and mechanism-overlay toggles (`arms`,
  `circles`, `hideLive`). Per-segment: `r`, `side` (inside/outside),
  `d` (pen offset), `stroke`, `width`, `alpha`, `visible`. UI labels
  are human-readable ("Outer ring", "Wheel size", "Pen arm", "Color",
  "Opacity"); the field names stay as math letters in the schema and
  URL. The edit sidebar is three regions — pinned-top cycle-time
  readout + experiment list, scrolling-middle globals and per-segment
  sections with add / remove / up-down reorder, pinned-bottom share
  bar. The pure math lives in `chain.ts` (`walkChain`), `cycleTime.ts`
  (composed LCM readout), and `extent.ts` (sampling-based max pen
  distance used by the canvas auto-fit). The renderer scales the
  whole scene so the drawn curve fills most of the preview with a
  responsive margin (1–4% depending on viewport size). URL schema:
  globals as individual params, segments packed into one
  `seg=r,side,d,stroke,width,alpha,visible;...` param.

## Conventions

- Slug = URL/folder identifier, chosen for readability (e.g.
  `gyrograph`). Display name is the proper-cased form (e.g.
  "Gyrograph") and can differ.
- Desktop-first. No responsive work yet.
- Dark theme only (`color-scheme: dark`).
- Git identity: `muwamath <muwamath@proton.me>` via `--local` config.
