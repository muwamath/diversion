# URL Structure Redesign

*Phase 2.1 — Polish · 2026-04-14*

## Goal

Replace the current mixed URL shape (query param slug on the editor, path
slug on the fullscreen page) with a symmetric, self-descriptive structure
where the experiment and the mode are both visible in the path.

Also: rename the first experiment's slug from `hypotrochoid` to
`gyrograph` so the slug matches the display name, and update the slug
convention to reflect that slugs are chosen for readability rather than
mandated to be the math name.

## URL shape

| URL | Behavior |
| --- | --- |
| `/` | Redirect (replace) to `/<default-slug>/edit` — `<default-slug>` is the first experiment in the registry |
| `/:slug` | Redirect (replace) to `/:slug/edit` |
| `/:slug/edit?<params>` | Editor page (sidebar + live preview), currently `Home.tsx` |
| `/:slug/live?<params>` | Fullscreen view, currently `Show.tsx` |
| `/:slug/edit` or `/:slug/live` with unknown slug | Render `"Unknown experiment: <slug>"` (same as today's `Show.tsx`) |

`<params>` are standard URL query params, unchanged from today's shape
(`R`, `r`, `d`, `speed`, `trailLength`, `color`, …). The `?experiment=`
query param used by the current editor goes away entirely — the slug
lives in the path.

Redirects use React Router's `<Navigate replace>` so the browser back
button is not polluted.

## Code changes

### Folder and slug rename

- `src/experiments/hypotrochoid/` → `src/experiments/gyrograph/`
- In the experiment definition, `meta.slug`: `'hypotrochoid'` → `'gyrograph'`
- `meta.name` stays `'Gyrograph'`
- Grep the repo for any stray `hypotrochoid` references and update them

### Page renames

- `src/pages/Home.tsx` → `src/pages/Edit.tsx`
- `src/pages/Show.tsx` → `src/pages/Live.tsx`

Matches the URL verbs so filenames don't drift from routes.

### Router

`src/router.tsx` gains the new route tree. Root and bare-slug routes
render `<Navigate replace>`. A small helper can resolve the default slug
from the registry at render time so adding experiments later keeps
working.

### Component behavior

- **`Edit.tsx`**: read slug from `useParams()` instead of
  `searchParams.get('experiment')`. The old `?experiment=` query param
  is removed from all navigation targets.
- **`Live.tsx`**: the Escape handler navigates to
  `/<slug>/edit?<current params>` instead of
  `/?experiment=<slug>&<params>`.
- **`ShareBar.tsx`**: the fullscreen link builds `/<slug>/live?<params>`
  instead of `/show/<slug>?<params>`.
- **`ExperimentList`** (sidebar picker): selecting an experiment
  navigates to `/<slug>/edit?<defaults>` instead of
  `/?experiment=<slug>&<defaults>`.

## Doc updates

- **`CLAUDE.md`** — update the Conventions section so the slug is
  defined as a URL/folder identifier chosen for readability (not
  mandated to be the math name). Update the "Current experiments" line:
  `(hypotrochoid)` → `(gyrograph)`.
- **`ROADMAP.md`** — mark the URL-structure item *done* with today's
  date once implementation lands, and add a note that the slug
  convention changed in this phase.
- **`README.md`** — update any `hypotrochoid` or `/show/` references.
- **`public/404.html`** — verify the gh-pages SPA redirect still works
  with the new path shape. It should be path-agnostic, but worth a read.

## Out of scope

- Backwards compat for `/show/hypotrochoid` URLs. The project is two
  phases old with no external bookmarks to preserve. No redirect shim.
- Landing/catalog page. Phase 3 covers that.
- Any gyrograph config additions (trail duration, trail alpha) — those
  are separate roadmap items.

## Acceptance criteria

1. `/diversion/` loads the Gyrograph editor with default params in the
   URL.
2. `/diversion/gyrograph` redirects to `/diversion/gyrograph/edit?…`.
3. `/diversion/gyrograph/edit?R=5&r=3&…` shows the editor with the
   params applied.
4. `/diversion/gyrograph/live?R=5&r=3&…` shows the fullscreen view.
5. Escape from the live view returns to the editor with the same params.
6. The "Open fullscreen" button in the editor opens the matching
   `/gyrograph/live?…` URL in a new tab.
7. The share-bar URL input reflects the current editor URL.
8. No `hypotrochoid` strings remain in the repo outside git history.
9. `npm run build` passes; the deployed gh-pages site serves all of the
   above correctly.
