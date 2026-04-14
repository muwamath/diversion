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
- **Routes**: `/` (home — config + preview), `/show/:slug` (fullscreen).

## Current experiments

- **Gyrograph** (`hypotrochoid`) — hypotrochoid curve drawer with
  configurable radii, pen offset, speed, trail length, and colors.

## Conventions

- Slug in URL = math name (e.g. `hypotrochoid`). Display name can differ
  (e.g. "Gyrograph").
- Desktop-first. No responsive work yet.
- Dark theme only (`color-scheme: dark`).
- Git identity: `muwamath <muwamath@proton.me>` via `--local` config.
