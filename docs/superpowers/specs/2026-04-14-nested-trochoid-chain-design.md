# Nested Trochoid Chain — Design

**Date:** 2026-04-14
**Status:** Approved (user review pending)
**Roadmap item:** Phase 2.2 item 8 (`ROADMAP.md`)

## Purpose

Generalize the single-level Gyrograph hypotrochoid into a chain of up to 6
rolling circles, each rolling inside or outside its parent. Each segment has
its own pen, so N segments produce N independent curves from one linked
mechanism. Also restructure the edit-page sidebar into pinned top (cycle time),
scrolling middle (globals + segments), and pinned bottom (share bar).

The existing flat URL schema is replaced. Old URLs (no production users) are
not preserved.

## Scope

In scope:

- New nested data model, URL schema, render pipeline, tests.
- Sidebar restructure into three regions.
- Add/remove segments and up/down reorder.
- Mechanism overlay extended to show every level of the chain.
- Composed cycle-time readout.

Out of scope (deferred to later roadmap items):

- Curated presets (Phase 2.2 item 2).
- Configurable trail duration (Phase 2.2 item 6).
- Oscillation for any field (Phase 2.2 item 7). The URL schema reserves room
  for oscillation to land as a separate `osc` param without changing the
  segment format.
- Non-circular rolling shapes (backlog).
- Drag-to-reorder (soft cap chose up/down buttons).

## Open questions — resolved

| Question | Resolution |
| --- | --- |
| Max segment depth | 6. Soft cap driven by sidebar UX, not URL length. |
| URL encoding shape | Compact per-segment string in one `seg` param. |
| Backward compatibility with flat URLs | None. No production users. |
| Cycle-time readout | Single composed number (LCM of per-segment periods). |
| Mechanism overlay at depth | Show everything — every level's circle and arm. |
| Default on first load | Single segment with current gyrograph defaults. |
| Add/remove/reorder UX | Append + per-segment remove + up/down arrows. |
| Render pipeline | Iterative frame composition, top-down each frame. |
| Validation on radii | None. Users are free to configure any values. |
| Oscillation impact on URL | Will land as a separate `osc` layer; segment format unchanged. |

## Data model

```ts
interface GyrographConfig {
  // Global
  R: number          // outermost fixed circle radius
  bg: string         // background color
  speed: number      // time scaling
  trail: number      // per-segment points buffer cap (stays global)
  arms: boolean      // mechanism overlay: show arms
  circles: boolean   // mechanism overlay: show circles
  hideLive: boolean  // hide mechanism in /live mode
  segments: Segment[]  // 1..6
}

interface Segment {
  r: number                    // this segment's rolling circle radius
  side: 'inside' | 'outside'   // rolls inside or outside its parent
  d: number                    // pen offset from this segment's center
  stroke: string               // per-curve color
  width: number                // per-curve line width
  alpha: number                // per-curve opacity
  visible: boolean             // whether this segment's pen draws
}
```

**Parent relationship.** The parent of segment 0 is the outer `R`. The parent
of segment k>0 is segment k-1's rolling circle. Each segment's body frame
composes on top of its parent's body frame.

**Defaults.** One segment on first load, mirroring today's visual output:
`r=60, side='inside', d=80, stroke='#aa3bff', width=2, alpha=0.15,
visible=true`, and globals `R=200, bg='#0a0a0a', speed=1, trail=2000,
arms=false, circles=false, hideLive=true`.

**No validation.** The `parse()` step reads numbers as-is. No clamping of `r`
against parent radius, no enforcement of geometric preconditions. Inputs in
`Controls.tsx` use `min`/`max` as soft hints only — typing past them works.
If the math produces NaN or infinity downstream, the renderer skips the
affected frame and draws nothing.

## URL schema

Globals remain individual params; segments pack into one `seg` param.

```
?R=200&bg=0a0a0a&speed=1&trail=2000&arms=0&circles=0&hideLive=1
 &seg=60,i,80,aa3bff,2,0.15,1;40,o,20,ff3b88,1.5,0.2,1
```

Rules:

- Segments are `;`-separated.
- Per-segment fields are `,`-separated in this order: `r, side, d, stroke,
  width, alpha, visible`.
- `side`: `i` for inside, `o` for outside.
- `visible`: `0` or `1`.
- Colors are hex without the leading `#`.
- Missing `seg` param → one default segment.
- A segment with fewer than 7 fields → missing fields fall back to per-field
  defaults (forward-tolerant for future extension).
- More than 6 segments in `seg` → truncated to 6.

`schema.ts` exposes `parse(URLSearchParams): GyrographConfig` and
`stringify(GyrographConfig): URLSearchParams`, with internal helpers
`parseSegment(string): Segment` and `stringifySegment(Segment): string`.

**Oscillation reservation.** When Phase 2.2 item 7 (oscillation) ships, it
lands as a separate top-level param, e.g.
`osc=R:180-220@5;seg0.width:1-4@10`. That keeps the segment format scalar and
avoids any breaking change.

## Render pipeline

Approach: iterative frame composition, top-down the chain, once per animation
frame.

**Per-frame state, owned by `Renderer`:**

- `t: number` — time accumulator, advanced by `dt = 0.05 * speed` each frame.
- `buffers: Array<Array<{x, y}>>` — one points buffer per segment, each
  capped at `trail`.

**Per-frame walk.** Each segment carries a body frame — a center position
and an orientation angle — in world space. Starting from the outer `R` as the
initial parent frame (center at origin, orientation driven by `t`), for each
segment `k = 0..N-1`:

1. Pick `sign = -1` for `inside`, `+1` for `outside`.
2. Compute the orbit radius: the distance from the parent's center to this
   segment's center. For rolling circles this is `parent.radius + sign * r_k`.
3. Place `center_k` on the circle of that orbit radius around
   `parent.center`, at an angle determined by the parent's orientation.
4. Compute this segment's body orientation from the rolling-without-slipping
   constraint applied to the parent's orientation, the parent's radius, and
   `r_k`. The sign of the rotation differs for inside vs outside rolling.
5. Place the pen at offset `d_k` from `center_k` in the segment's body
   frame, i.e. rotated by the body orientation.
6. Push the pen into `buffers[k]`.
7. Pass the segment's `{ center, radius: r_k, orientation }` as the new
   parent for segment `k+1`.

The exact body-orientation formula is derived in implementation (it's short,
but the sign conventions for inside vs outside require care) and pinned down
by two reduction tests: at N=1 with `side='inside'` the walk must reproduce
today's closed-form hypotrochoid pen positions, and at N=1 with
`side='outside'` it must reproduce the closed-form epitrochoid pen positions.
Those tests, not the prose in this spec, are the source of truth for the
formula.

**Drawing.** For each segment k where `visible === true`, stroke
`buffers[k]` with its own `stroke`, `width`, `alpha`. Same `CHUNK_SIZE=20`
batching as today.

**Mechanism overlay.** Runs once after curves, not interleaved. Re-walks the
chain. For `k=0`, draws the outer fixed circle at `R`. For every segment,
draws (when toggles on): the rolling circle at `center_k` with radius `r_k`,
the arm from `center_k` to `pen_k`, and endpoint dots. Overlay stroke/fill
colors stay at the current `#888`/`#ccc`.

**Reset semantics.**

- `R` changes → reset all buffers.
- Segment `k`'s `r`, `side`, or `d` changes → reset buffers `k..N-1`
  (descendants depend on parent frame), preserve `0..k-1`.
- A segment's `stroke`, `width`, `alpha`, or `visible` changes → no reset;
  just redraws the existing buffer at the new style.
- Segment added → new buffer starts empty at the end.
- Segment removed → its buffer is discarded and `t` carries on.
- Segment reordered via up/down → both swapped segments' buffers reset
  (their parents changed).
- `t` does NOT reset on config changes — phase is preserved across tweaks,
  same as today.

## UI restructure

The edit-page sidebar becomes three flex regions inside a
`display: flex; flex-direction: column; height: 100vh` container. No
library, plain CSS.

**Pinned top (`flex-shrink: 0`).** Cycle-time readout. Single composed number,
`T_total = LCM(T_0, T_1, …, T_{N-1})`, where each `T_k` is derived from the
rolling-without-slipping period of segment `k` in the iterative math. Formatted
human-friendly: `12.4s`, `1m 23s`, etc. Recomputes on any geometry change.

**Scrolling middle (`flex: 1`, `overflow-y: auto`).** Two subsections:

1. **Globals.** `R`, `bg`, `speed`, `trail`, `arms`, `circles`, and (when
   `arms || circles`) `hideLive`. Matches today's global controls. Per-curve
   `stroke`, `width`, `alpha` move out of this section into per-segment.
2. **Segments.** One section per segment, in chain order. Each section
   header shows:
   - `Segment N` label (1-indexed for display).
   - Color swatch reflecting the segment's `stroke`.
   - `↑` button (disabled on the first segment).
   - `↓` button (disabled on the last segment).
   - `×` remove button (disabled when only one segment remains).

   Section body: `r`, `side` (select or radio: inside / outside), `d`,
   `stroke`, `width`, `alpha`, `visible`.

   Below the last segment, a full-width `+ Add segment` button (disabled at
   the cap of 6). New segment defaults:
   - `r = round(parent.r / 2)` (where parent is segment N-1 if any, else R).
   - `side = 'inside'`.
   - `d = round(r / 2)`.
   - `stroke` from a rotating palette (simple 6-color cycle).
   - `width`, `alpha`, `visible` from gyrograph defaults.

**Pinned bottom (`flex-shrink: 0`).** Existing `ShareBar` component, moved
into the pinned region. No behavior change.

**Files touched.**

- `src/experiments/gyrograph/schema.ts` — new config shape, new parse/stringify.
- `src/experiments/gyrograph/defaults.ts` — new default shape.
- `src/experiments/gyrograph/draw.ts` — iterative composition and helpers;
  remove `computePoint`, add `walkChain` (or similar).
- `src/experiments/gyrograph/Renderer.tsx` — per-segment buffers, scoped
  reset effects, draws per-segment curves, overlay walks the chain.
- `src/experiments/gyrograph/Controls.tsx` — three-region layout, per-segment
  sections, add/remove/reorder handlers.
- CSS — extend existing styles or add a small Gyrograph-local stylesheet
  (check what's there first and match the project's plain-CSS convention).
- `src/experiments/gyrograph/schema.test.ts` — new assertions (see Testing).
- `src/experiments/gyrograph/draw.test.ts` — new assertions (see Testing).
- `ROADMAP.md` — mark Phase 2.2 item 8 in-progress, then done.
- `CLAUDE.md` — update the Gyrograph description to reflect the nested model.
- `README.md` — update the feature description.

## Testing

Automated (Vitest + React Testing Library):

- **`schema.test.ts`**
  - `parse()` of empty params returns single-segment default config.
  - `parse()` of a 3-segment `seg=` round-trips through `stringify()` unchanged.
  - `parse()` of a segment with fewer than 7 fields fills the missing fields
    from defaults.
  - `parse()` reads `side=i`/`side=o` correctly; any other value falls back to
    `'inside'`.
  - `parse()` with 7+ segments truncates to 6.
  - `parse()` of all new globals falls back to defaults when missing.
- **`draw.test.ts`**
  - `walkChain` with N=1, `side='inside'` produces the same pen positions as
    today's `computePoint` over a sweep of `t` values.
  - `walkChain` with N=1, `side='outside'` matches the closed-form epitrochoid
    over a sweep of `t` values.
  - `walkChain` with a 3-segment config produces 3 non-empty point arrays at
    the expected length.
  - Cycle-time `LCM` helper: known-good pairs, a large-composed case, and a
    case with `speed != 1` applied.
- **Reset scoping.** A test that invokes the reset logic (or its extracted
  helper) and confirms that changing segment `k`'s geometry invalidates
  `k..N-1` and preserves `0..k-1`.

The 31-test gate stays green; these are additions.

Manual (per the project's workflow):

- Dev server eyeballed in the user's browser first.
- First-load config looks visually identical to the pre-nested gyrograph.
- Adding a second segment shows a second curve from the same linked mechanism.
- Toggling `side` on segment 2 visibly changes curve shape and clears its
  buffer without resetting segment 1.
- Overlay toggles show every level's circle and arm when on.
- Dragging `r` on segment 1 resets segment 1 and segment 2 but preserves
  segment 0 (when there are 3 segments).
- Dragging `R` resets everything.
- Remove and reorder buttons behave correctly including disabled states.
- `ShareBar` copies a URL with the full nested config and round-trips cleanly
  on paste.

## Migration

No backward compatibility for old flat URLs. First landing after deploy reads
the new schema from fresh defaults. `docs ship gate` (README / CLAUDE /
ROADMAP) runs before the FF merge to main.
