# URL Structure Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed URL shape (`/?experiment=slug` for editor, `/show/:slug` for fullscreen) with a symmetric, self-descriptive structure (`/:slug/edit`, `/:slug/live`), and rename the first experiment's slug from `hypotrochoid` to `gyrograph`.

**Architecture:** React Router v7 with `<Navigate replace>` for root and bare-slug redirects. Slug moves from query param to path param. Page components and files are renamed to match the URL verbs (`Edit.tsx`, `Live.tsx`). Query params still carry experiment config, unchanged.

**Tech Stack:** Vite + React 19 + TypeScript + React Router v7. No unit test runner exists in this project — verification is `npm run build` (typecheck + compile) plus manual Chrome verification via Chrome DevTools MCP, per project conventions.

**Spec:** `docs/superpowers/specs/2026-04-14-url-structure-design.md`

**Phases:**
1. Branch setup
2. Slug rename (`hypotrochoid` → `gyrograph`)
3. Route & page restructure
4. Doc updates
5. Code review (fresh reviewer agent, no implementation bias)
6. Final verification & merge

---

## Phase 1 — Branch setup

### Task 1: Create feature branch

**Files:** none (git only)

- [ ] **Step 1: Confirm clean working tree**

Run: `git status --short`
Expected: empty output.

- [ ] **Step 2: Create and switch to feature branch**

Run: `git checkout -b feature/url-structure`
Expected: `Switched to a new branch 'feature/url-structure'`

- [ ] **Step 3: Push branch to origin for backup**

Run: `git push -u origin feature/url-structure`
Expected: branch created on origin, upstream tracking set.

---

## Phase 2 — Slug rename

This phase renames the experiment slug `hypotrochoid` → `gyrograph` without touching the router yet. After this phase the app still uses the old URL shapes (`/?experiment=gyrograph`, `/show/gyrograph`), but the slug matches the display name.

### Task 2: Rename experiment folder

**Files:**
- Rename: `src/experiments/hypotrochoid/` → `src/experiments/gyrograph/`

- [ ] **Step 1: Rename the folder with git**

Run:
```bash
git mv src/experiments/hypotrochoid src/experiments/gyrograph
```
Expected: folder renamed, git tracks the move.

- [ ] **Step 2: Verify**

Run: `ls src/experiments/gyrograph`
Expected: `Controls.tsx  Renderer.tsx  defaults.ts  draw.ts  index.ts  meta.ts  schema.ts`

### Task 3: Update meta.ts slug

**Files:**
- Modify: `src/experiments/gyrograph/meta.ts`

- [ ] **Step 1: Update the slug field**

Change `meta.ts` from:
```typescript
import type { ExperimentMeta } from '../types'

export const meta: ExperimentMeta = {
  slug: 'hypotrochoid',
  name: 'Gyrograph',
  description: 'A curve traced by a point on a circle rolling inside another circle',
}
```
to:
```typescript
import type { ExperimentMeta } from '../types'

export const meta: ExperimentMeta = {
  slug: 'gyrograph',
  name: 'Gyrograph',
  description: 'A curve traced by a point on a circle rolling inside another circle',
}
```

### Task 4: Update registry and barrel export

**Files:**
- Modify: `src/experiments/gyrograph/index.ts`
- Modify: `src/experiments/registry.ts`

- [ ] **Step 1: Update the export name in `src/experiments/gyrograph/index.ts`**

Change from:
```typescript
import type { Experiment } from '../types'
import type { HypotrochoidConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'

export const hypotrochoid: Experiment<HypotrochoidConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
}
```
to:
```typescript
import type { Experiment } from '../types'
import type { HypotrochoidConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'

export const gyrograph: Experiment<HypotrochoidConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
}
```

Note: `HypotrochoidConfig` is the TypeScript type name for the config shape — leave it alone. It's the math object; we're only renaming the experiment identifier.

- [ ] **Step 2: Update `src/experiments/registry.ts`**

Change from:
```typescript
import type { Experiment } from './types'
import { hypotrochoid } from './hypotrochoid'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const experiments: Experiment<any>[] = [hypotrochoid]

export function findExperiment(slug: string) {
  return experiments.find((e) => e.meta.slug === slug)
}
```
to:
```typescript
import type { Experiment } from './types'
import { gyrograph } from './gyrograph'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const experiments: Experiment<any>[] = [gyrograph]

export function findExperiment(slug: string) {
  return experiments.find((e) => e.meta.slug === slug)
}
```

### Task 5: Check for stray references

**Files:** any matches

- [ ] **Step 1: Grep the repo for remaining `hypotrochoid` references**

Run: `rg -n hypotrochoid -g '!docs/' -g '!node_modules' -g '!.git'`
Expected matches — leave these alone, they reference the math curve, not the slug:
- `src/experiments/gyrograph/schema.ts` — `HypotrochoidConfig` type declaration
- `src/experiments/gyrograph/defaults.ts` — `HypotrochoidConfig` type import
- `src/experiments/gyrograph/Controls.tsx` — `HypotrochoidConfig` type import (if used)
- `src/experiments/gyrograph/Renderer.tsx` — `HypotrochoidConfig` type import (if used)
- `src/experiments/gyrograph/draw.ts` — `HypotrochoidConfig` type import (if used)
- `src/experiments/gyrograph/index.ts` — `HypotrochoidConfig` type import
- `CLAUDE.md` — "hypotrochoid curve drawer" in description text (math name of curve)

Any other match is unexpected. Flag it.

- [ ] **Step 2: Fix any unexpected matches**

Update any unexpected `hypotrochoid` occurrences to `gyrograph`. The TypeScript type `HypotrochoidConfig` and descriptive text referring to "the hypotrochoid curve" stay as-is — those describe the underlying math, not the experiment slug.

### Task 6: Build and verify Phase 2

**Files:** none

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: clean build, no TypeScript or Vite errors.

- [ ] **Step 2: Start the dev server**

Run: `npm run dev`
Expected: dev server starts on `http://localhost:5173/diversion/`.

- [ ] **Step 3: Chrome verification — editor still works**

Use Chrome DevTools MCP to navigate to `http://localhost:5173/diversion/`.
Expected: Gyrograph editor loads with default params. URL shows `/?experiment=gyrograph&…`. No console errors.

- [ ] **Step 4: Chrome verification — fullscreen still works**

Click "Open fullscreen" in the editor.
Expected: a new tab opens at `/diversion/show/gyrograph?…` and the fullscreen view shows the hypotrochoid curve. Pressing Escape returns to the editor.

- [ ] **Step 5: Stop the dev server**

Ctrl-C the `npm run dev` process.

### Task 7: Commit Phase 2

**Files:** staged changes from Tasks 2–5

- [ ] **Step 1: Stage and commit**

Run:
```bash
git add src/experiments/ src/components/
git status --short
```
Expected: all changes staged.

Run:
```bash
git commit -m "Rename hypotrochoid slug to gyrograph"
```
Expected: clean commit on `feature/url-structure`.

---

## Phase 3 — Route & page restructure

This phase implements the new URL shape and is the core of the change. All navigation targets update in lockstep so that after this phase the app uses `/gyrograph/edit` and `/gyrograph/live` exclusively.

### Task 8: Rename page files

**Files:**
- Rename: `src/pages/Home.tsx` → `src/pages/Edit.tsx`
- Rename: `src/pages/Show.tsx` → `src/pages/Live.tsx`

- [ ] **Step 1: git mv both files**

Run:
```bash
git mv src/pages/Home.tsx src/pages/Edit.tsx
git mv src/pages/Show.tsx src/pages/Live.tsx
```
Expected: both files renamed and tracked by git.

### Task 9: Rewrite the router

**Files:**
- Modify: `src/router.tsx`

- [ ] **Step 1: Replace the file contents**

Replace `src/router.tsx` with:
```typescript
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import Edit from './pages/Edit'
import Live from './pages/Live'
import { experiments } from './experiments/registry'

function BareSlugRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/${slug}/edit`} replace />
}

function RootRedirect() {
  const defaultSlug = experiments[0]?.meta.slug ?? ''
  return <Navigate to={`/${defaultSlug}/edit`} replace />
}

export function AppRouter() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/:slug" element={<BareSlugRedirect />} />
        <Route path="/:slug/edit" element={<Edit />} />
        <Route path="/:slug/live" element={<Live />} />
      </Routes>
    </BrowserRouter>
  )
}
```

The `useParams` call inside `BareSlugRedirect` is safe because it only runs when React Router matches `/:slug` — at that point `slug` is defined.

### Task 10: Update Edit page to read slug from path

**Files:**
- Modify: `src/pages/Edit.tsx` (renamed from `Home.tsx` in Task 8)

- [ ] **Step 1: Replace the file contents**

Replace `src/pages/Edit.tsx` with:
```typescript
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMemo, useRef, useEffect, useState } from 'react'
import { experiments, findExperiment } from '../experiments/registry'
import { useExperimentConfig } from '../hooks/useExperimentConfig'
import ExperimentList from '../components/ExperimentList'
import ShareBar from '../components/ShareBar'
import type { Experiment } from '../experiments/types'
import '../styles/layout.css'

function ExperimentPanel({
  experiment,
  onSelect,
}: {
  experiment: Experiment
  onSelect: (exp: Experiment) => void
}) {
  const [config, updateConfig] = useExperimentConfig(experiment)
  const previewRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const Controls = experiment.Controls
  const Renderer = experiment.Renderer

  return (
    <>
      <div className="sidebar">
        <ExperimentList current={experiment.meta.slug} onSelect={onSelect} />
        <Controls config={config} onChange={updateConfig} />
        <ShareBar slug={experiment.meta.slug} />
      </div>
      <div className="preview" ref={previewRef}>
        {size.width > 0 && (
          <Renderer config={config} width={size.width} height={size.height} />
        )}
      </div>
    </>
  )
}

export default function Edit() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const experiment = useMemo(() => findExperiment(slug ?? ''), [slug])

  if (!experiment) {
    return <div className="home">Unknown experiment: {slug}</div>
  }

  const handleSelect = (exp: Experiment) => {
    const params = new URLSearchParams()
    const defaultParams = exp.schema.stringify(exp.schema.defaults)
    defaultParams.forEach((v, k) => params.set(k, v))
    navigate(`/${exp.meta.slug}/edit?${params.toString()}`)
  }

  return (
    <div className="home">
      <ExperimentPanel
        key={experiment.meta.slug}
        experiment={experiment}
        onSelect={handleSelect}
      />
    </div>
  )
}
```

Key changes from the old `Home.tsx`:
- Slug comes from `useParams()` not `searchParams.get('experiment')`.
- `handleSelect` no longer sets `experiment` in the query string; it constructs `/:slug/edit?<defaults>` in the path.
- The "no experiments registered" branch is gone — if the registry were empty the router's `RootRedirect` would send here with an empty slug, which renders `"Unknown experiment: "`. Acceptable.

### Task 11: Update Live page Escape handler

**Files:**
- Modify: `src/pages/Live.tsx` (renamed from `Show.tsx` in Task 8)

- [ ] **Step 1: Update the Escape handler**

In `src/pages/Live.tsx`, find:
```typescript
  // Escape to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const params = new URLSearchParams(searchParams)
        params.set('experiment', slug ?? '')
        navigate(`/?${params.toString()}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, searchParams, slug])
```

Replace with:
```typescript
  // Escape to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(`/${slug ?? ''}/edit?${searchParams.toString()}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, searchParams, slug])
```

No other changes to `Live.tsx`. The default export name can stay `Show` or be renamed to `Live` — the router imports as `Live` from `./pages/Live`, so the function name is internal. Rename the function declaration for consistency:

Find: `export default function Show() {`
Replace with: `export default function Live() {`

### Task 12: Update ShareBar fullscreen URL

**Files:**
- Modify: `src/components/ShareBar.tsx`

- [ ] **Step 1: Update the `fullscreenUrl` construction**

In `src/components/ShareBar.tsx`, find:
```typescript
  const fullscreenUrl = `${window.location.origin}${import.meta.env.BASE_URL}show/${slug}?${searchParams.toString()}`
```

Replace with:
```typescript
  const fullscreenUrl = `${window.location.origin}${import.meta.env.BASE_URL}${slug}/live?${searchParams.toString()}`
```

### Task 13: Remove stale `experiment` query param from useExperimentConfig

**Files:**
- Modify: `src/hooks/useExperimentConfig.ts`

The old hook re-sets `experiment` in the query string on every config change so the editor URL would include `?experiment=<slug>`. Under the new route shape the slug lives in the path, so this line must go — otherwise every edit re-adds `?experiment=gyrograph` to the URL.

- [ ] **Step 1: Delete the preserve-slug line**

In `src/hooks/useExperimentConfig.ts`, find:
```typescript
    (patch: Partial<T>) => {
      const next = { ...config, ...patch }
      const params = experiment.schema.stringify(next)
      // Preserve the experiment selector param
      params.set('experiment', experiment.meta.slug)
      setSearchParams(params, { replace: true })
    },
```

Replace with:
```typescript
    (patch: Partial<T>) => {
      const next = { ...config, ...patch }
      const params = experiment.schema.stringify(next)
      setSearchParams(params, { replace: true })
    },
```

The `experiment` argument to the hook is still used for `schema.parse` and `schema.stringify`. Only the URL-write side changes.

### Task 14: Build and fix type errors

**Files:** whichever still fail

- [ ] **Step 1: Run the build**

Run: `npm run build`
Expected: clean build. If there are type errors, they are almost certainly import paths referencing `./pages/Home` or `./pages/Show` somewhere — fix them.

- [ ] **Step 2: Re-run until green**

Iterate on build errors until `npm run build` exits 0.

### Task 15: Chrome verification matrix

**Files:** none

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: dev server starts.

- [ ] **Step 2: Verify each URL from the spec's acceptance criteria**

Use Chrome DevTools MCP. For each URL, load it, check the final URL after redirects, check the page renders, and watch the console for errors.

| URL | Expected |
| --- | --- |
| `http://localhost:5173/diversion/` | Redirects to `/diversion/gyrograph/edit`, editor loads |
| `http://localhost:5173/diversion/gyrograph` | Redirects to `/diversion/gyrograph/edit`, editor loads |
| `http://localhost:5173/diversion/gyrograph/edit?R=200&r=60&d=80&speed=1&trail=2000&stroke=%23aa3bff&width=1.5&bg=%230a0a0a` | Editor shows Gyrograph with those params applied (these are the current defaults) |
| `http://localhost:5173/diversion/gyrograph/live?R=200&r=60&d=80&speed=1&trail=2000&stroke=%23aa3bff&width=1.5&bg=%230a0a0a` | Fullscreen view shows the curve |
| `http://localhost:5173/diversion/nonsense/edit` | Shows "Unknown experiment: nonsense" |

- [ ] **Step 3: Interaction checks**

1. From the editor, change a number input — URL updates live.
2. From the editor, click "Open fullscreen" — new tab opens at `/diversion/gyrograph/live?…` with matching params.
3. From the fullscreen view, press Escape — returns to `/diversion/gyrograph/edit?…` with params preserved.
4. In the share bar, the URL input reflects the current editor URL.

All five interactions must work without console errors.

- [ ] **Step 4: Stop the dev server**

Ctrl-C.

### Task 16: Commit Phase 3

**Files:** staged changes from Tasks 8–12

- [ ] **Step 1: Stage and commit**

Run:
```bash
git add src/pages/ src/router.tsx src/components/ShareBar.tsx
git status --short
```
Expected: file renames (Home→Edit, Show→Live), router changes, component changes.

Run:
```bash
git commit -m "Route by /:slug/edit and /:slug/live"
```

---

## Phase 4 — Doc updates

### Task 17: Update CLAUDE.md convention

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update the Conventions section**

In `CLAUDE.md`, find:
```
- Slug in URL = math name (e.g. `hypotrochoid`). Display name can differ
  (e.g. "Gyrograph").
```

Replace with:
```
- Slug = URL/folder identifier, chosen for readability (e.g.
  `gyrograph`). Display name is the proper-cased form (e.g. "Gyrograph")
  and can differ.
```

- [ ] **Step 2: Update the "Current experiments" section**

Find:
```
- **Gyrograph** (`hypotrochoid`) — hypotrochoid curve drawer with
```
Replace with:
```
- **Gyrograph** (`gyrograph`) — hypotrochoid curve drawer with
```

Note: we keep "hypotrochoid" in the description because that's the math name for the curve — this is accurate.

### Task 18: Update ROADMAP.md

**Files:**
- Modify: `ROADMAP.md`

- [ ] **Step 1: Mark the URL-structure item done**

In `ROADMAP.md`, under Phase 2.1, find:
```
- Revisit the display/show page URL structure (currently `/show/:slug`)
```
Replace with:
```
- ~~Revisit the display/show page URL structure~~ *done 2026-04-14 — `/:slug/edit` and `/:slug/live`; slug convention now chosen for readability*
```

### Task 19: Commit Phase 4

**Files:** staged changes from Tasks 16–17

- [ ] **Step 1: Stage and commit**

Run:
```bash
git add CLAUDE.md ROADMAP.md
git commit -m "Docs: update slug convention and mark URL task done"
```

---

## Phase 5 — Code review

### Task 20: Dispatch a fresh reviewer agent

**Files:** none (review only)

- [ ] **Step 1: Dispatch the reviewer**

Use the Agent tool with `subagent_type: superpowers:code-reviewer`. Prompt template:

> Review the `feature/url-structure` branch against the spec at `docs/superpowers/specs/2026-04-14-url-structure-design.md`. The branch implements a URL redesign: slug moved from query param to path, and the first experiment's slug renamed from `hypotrochoid` to `gyrograph`. Key files: `src/router.tsx`, `src/pages/Edit.tsx`, `src/pages/Live.tsx`, `src/components/ShareBar.tsx`, `src/components/ExperimentList.tsx`, and the `src/experiments/gyrograph/` folder. Check: (1) all acceptance criteria from the spec are met, (2) no stray `hypotrochoid` references outside the `HypotrochoidConfig` type and descriptive text, (3) navigation stays internally consistent (no URLs that 404 in practice), (4) no console errors in normal use. Report findings as a punch list.

- [ ] **Step 2: Address findings**

For each issue the reviewer raises, either fix it in a follow-up commit on `feature/url-structure`, or document why it's out of scope for this phase. Do not merge to main with unaddressed blocking issues.

---

## Phase 6 — Final verification & merge

### Task 21: Fresh build and Chrome smoke test

**Files:** none

- [ ] **Step 1: Clean build from scratch**

Run: `npm run build`
Expected: clean build, no warnings beyond baseline.

- [ ] **Step 2: Preview the built artifact**

Run: `npm run preview`
Expected: preview server starts.

- [ ] **Step 3: Chrome verification of preview**

Use Chrome DevTools MCP to load the preview URL. Walk through the same URL matrix from Task 15, Step 2, against the production build. Watch for any difference between dev and build behavior (e.g. SPA redirect handling in `main.tsx`'s `__spa` branch).

- [ ] **Step 4: Stop the preview**

Ctrl-C.

### Task 22: Fast-forward merge to main

**Files:** none (git only)

- [ ] **Step 1: Return to main and update**

Run:
```bash
git checkout main
git pull --ff-only
```

- [ ] **Step 2: Fast-forward merge the feature branch**

Run: `git merge --ff-only feature/url-structure`
Expected: fast-forward merge succeeds. If it fails, the branches diverged — investigate before forcing anything.

- [ ] **Step 3: Push main**

Run: `git push origin main`
Expected: push succeeds; GitHub Actions triggers a deploy.

### Task 23: Live-deploy verification

**Files:** none

- [ ] **Step 1: Wait for the GitHub Actions deploy to finish**

Check the Actions tab or run `gh run list --limit 1` to see the deploy status. Wait until it succeeds.

- [ ] **Step 2: Chrome verification of the live site**

Use Chrome DevTools MCP to load `https://muwamath.github.io/diversion/` and walk the URL matrix one more time against the deployed site. The SPA redirect via `public/404.html` is the main thing that can differ between local and live — make sure `/diversion/gyrograph/edit` loads after a hard refresh and does not leave `__spa` in the URL.

- [ ] **Step 3: Delete the feature branch**

Only after live verification passes:
```bash
git branch -d feature/url-structure
git push origin --delete feature/url-structure
```

## Done

All spec acceptance criteria met; slug is `gyrograph` everywhere; URL shape is `/:slug/edit` and `/:slug/live`; docs updated; live deploy verified.
