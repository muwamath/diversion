# Nested Trochoid Chain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Inline Execution is the user's preferred mode (not Subagent-Driven). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-level Gyrograph hypotrochoid with a chain of up to 6 nested rolling circles, each with its own pen; restructure the edit-page sidebar into pinned-top (cycle time) / scrolling-middle (globals + segments) / pinned-bottom (share bar).

**Architecture:** Iterative frame composition walks the chain top-down once per animation frame, updating one points buffer per segment. The renderer subscribes to scoped config changes that reset only the affected buffers. A new pure-math module `chain.ts` holds the walk; a new `cycleTime.ts` holds the composed LCM readout logic. Controls become a three-region flex sidebar with a per-segment section pattern.

**Tech Stack:** TypeScript, React 19, Vite, Vitest, React Testing Library, plain canvas 2D, plain CSS. Spec: `docs/superpowers/specs/2026-04-14-nested-trochoid-chain-design.md`.

---

## File Structure

**Create:**
- `src/experiments/gyrograph/chain.ts` — pure iterative frame composition (`walkChain`).
- `src/experiments/gyrograph/chain.test.ts` — TDD tests for `walkChain` with N=1 reduction to hypo/epi baselines and N=3 sanity.
- `src/experiments/gyrograph/cycleTime.ts` — composed cycle-time computation (LCM of per-segment periods).
- `src/experiments/gyrograph/cycleTime.test.ts` — TDD tests for `cycleTime`.
- `src/experiments/gyrograph/CycleTime.tsx` — small React component that renders a formatted cycle-time string from a config.

**Modify:**
- `src/experiments/gyrograph/schema.ts` — new `GyrographConfig` + `Segment` types; new `parse`/`stringify` with compact `seg=` encoding; no validation clamps.
- `src/experiments/gyrograph/schema.test.ts` — rewritten for the new shape.
- `src/experiments/gyrograph/defaults.ts` — new single-segment default.
- `src/experiments/gyrograph/draw.ts` — delete `computePoint`; replace with `drawCurves(ctx, config, buffers)` and `drawOverlay(ctx, config, frames, state)`. Overlay walks the chain.
- `src/experiments/gyrograph/draw.test.ts` — rewritten for the new API. The N=1 reduction test moves to `chain.test.ts` because the closed-form comparison is a math concern; `draw.test.ts` becomes thin or is deleted.
- `src/experiments/gyrograph/Renderer.tsx` — per-segment buffers; scoped reset effects; uses `walkChain`.
- `src/experiments/gyrograph/Controls.tsx` — new layout: globals block + per-segment sections + add/remove/up-down buttons.
- `src/experiments/gyrograph/index.ts` — update re-exported type name.
- `src/pages/Edit.tsx` — three-region sidebar wrapper.
- `src/styles/layout.css` — three-region flex rules, segment section styling.
- `ROADMAP.md` — mark Phase 2.2 item 8 in-progress → done.
- `CLAUDE.md` — update Gyrograph description to nested model.
- `README.md` — update feature description.

---

## Task 1: `chain.ts` — pure iterative walk (TDD)

**Files:**
- Create: `src/experiments/gyrograph/chain.ts`
- Create: `src/experiments/gyrograph/chain.test.ts`

The `walkChain` function is pure math, no canvas or React. It takes a list of segment descriptors (just the geometry fields: `r`, `side`, `d`) plus the outer `R` and a time `t`, and returns one `Frame` per segment. A frame is `{ cx, cy, orientation, penX, penY }`. The renderer and overlay both consume the same frames.

The core loop: start with a "virtual parent frame" representing the outer fixed circle (center at origin, orientation `t`, radius `R`). For each segment, compute the new center from the parent's orientation and the orbit radius, compute the body orientation from the rolling-without-slipping constraint, compute the pen from the body orientation and `d`, and pass this segment's frame as the next parent.

The body-orientation formula is derived below from the closed-form hypotrochoid baseline:

- Hypotrochoid (N=1, inside): `x = (R-r)cos(t) + d*cos(((R-r)/r)*t)`, `y = (R-r)sin(t) - d*sin(((R-r)/r)*t)`.
- The orbit center is at `((R-r)cos(t), (R-r)sin(t))` — so `parent_orientation = t` for segment 0.
- The pen offset from center in world frame has angle `((R-r)/r)*t` in x and `-((R-r)/r)*t` in y. That means the body orientation (the angle we put into `(cos, sin)` with the convention `pen = center + d*(cos(θ), sin(θ))`) is `-((R-r)/r)*t` for `side=inside`.
- Equivalently: `body_orientation = -(parent_radius - r) / r * parent_orientation` for `inside`.
- For `side=outside` (epitrochoid): standard form is `x = (R+r)cos(t) - d*cos(((R+r)/r)*t)`, `y = (R+r)sin(t) - d*sin(((R+r)/r)*t)`. The `-d*cos` is equivalent to `+d*cos(θ + π)`, so `body_orientation = ((R+r)/r)*t + π` for segment 0.
- General composable form: on segment k with parent `{radius: R_p, orientation: θ_p}`:
  - `inside`:  `θ_k = -((R_p - r_k) / r_k) * θ_p`
  - `outside`: `θ_k = ((R_p + r_k) / r_k) * θ_p + π`
  - But this "reset-on-parent-orientation" form assumes the parent's motion is a pure rotation about its own previous parent. That's true for segment 0 (trivially), and it's true for segment k>0 because each body frame's motion is "the orbit rate the rolling-constraint forces on it, relative to the parent's rotating frame." The parent's own orientation θ_p already absorbs its parent's orientation recursively, so the formula composes cleanly.

The reduction tests below pin this down. If the test for N=1 hypotrochoid fails, adjust the formula — the tests are the source of truth, not this prose.

- [ ] **Step 1: Write `chain.test.ts` with the hypotrochoid reduction test (failing)**

```ts
import { describe, it, expect } from 'vitest'
import { walkChain } from './chain'

const EPSILON = 1e-9

// Closed-form hypotrochoid for N=1, side=inside.
function hypoClosedForm(R: number, r: number, d: number, t: number) {
  return {
    x: (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t),
    y: (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t),
  }
}

// Closed-form epitrochoid for N=1, side=outside.
function epiClosedForm(R: number, r: number, d: number, t: number) {
  return {
    x: (R + r) * Math.cos(t) - d * Math.cos(((R + r) / r) * t),
    y: (R + r) * Math.sin(t) - d * Math.sin(((R + r) / r) * t),
  }
}

describe('walkChain', () => {
  it('N=1 inside matches closed-form hypotrochoid over a t sweep', () => {
    const R = 200
    const segs = [{ r: 60, side: 'inside' as const, d: 80 }]
    for (const t of [0, 0.1, 0.5, 1, 2, Math.PI, Math.PI * 1.5]) {
      const frames = walkChain(R, segs, t)
      const expected = hypoClosedForm(R, 60, 80, t)
      expect(frames[0].penX).toBeCloseTo(expected.x, 9)
      expect(frames[0].penY).toBeCloseTo(expected.y, 9)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/experiments/gyrograph/chain.test.ts`
Expected: FAIL — `walkChain` is not defined (or module not found).

- [ ] **Step 3: Create `chain.ts` with minimal implementation**

```ts
export interface SegmentGeometry {
  r: number
  side: 'inside' | 'outside'
  d: number
}

export interface Frame {
  cx: number
  cy: number
  orientation: number
  penX: number
  penY: number
}

export function walkChain(
  R: number,
  segments: SegmentGeometry[],
  t: number,
): Frame[] {
  const frames: Frame[] = []

  // Virtual parent frame for the outer fixed circle.
  let parentCx = 0
  let parentCy = 0
  let parentRadius = R
  let parentOrientation = t

  for (const seg of segments) {
    const sign = seg.side === 'inside' ? -1 : 1
    const orbitRadius = parentRadius + sign * seg.r
    const cx = parentCx + orbitRadius * Math.cos(parentOrientation)
    const cy = parentCy + orbitRadius * Math.sin(parentOrientation)

    let orientation: number
    if (seg.side === 'inside') {
      orientation = -((parentRadius - seg.r) / seg.r) * parentOrientation
    } else {
      orientation = ((parentRadius + seg.r) / seg.r) * parentOrientation + Math.PI
    }

    const penX = cx + seg.d * Math.cos(orientation)
    const penY = cy + seg.d * Math.sin(orientation)

    frames.push({ cx, cy, orientation, penX, penY })

    parentCx = cx
    parentCy = cy
    parentRadius = seg.r
    parentOrientation = orientation
  }

  return frames
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/experiments/gyrograph/chain.test.ts`
Expected: PASS. If the hypotrochoid test fails: the `body_orientation` formula is wrong. Adjust signs until it matches. Do NOT proceed until green.

- [ ] **Step 5: Add the epitrochoid reduction test**

Append to `chain.test.ts`:

```ts
  it('N=1 outside matches closed-form epitrochoid over a t sweep', () => {
    const R = 150
    const segs = [{ r: 40, side: 'outside' as const, d: 30 }]
    for (const t of [0, 0.1, 0.5, 1, 2, Math.PI]) {
      const frames = walkChain(R, segs, t)
      const expected = epiClosedForm(R, 40, 30, t)
      expect(frames[0].penX).toBeCloseTo(expected.x, 9)
      expect(frames[0].penY).toBeCloseTo(expected.y, 9)
    }
  })
```

- [ ] **Step 6: Run, verify pass**

Run: `npx vitest run src/experiments/gyrograph/chain.test.ts`
Expected: PASS. If the epitrochoid test fails: adjust the `outside` branch in `chain.ts`. A common alternative form is `orientation = -((parentRadius + seg.r) / seg.r) * parentOrientation` without the `+ π`; try that if the first form is off.

- [ ] **Step 7: Add a 3-segment sanity test**

Append:

```ts
  it('returns N frames for N segments and all pen coordinates are finite', () => {
    const R = 200
    const segs: Array<{ r: number; side: 'inside' | 'outside'; d: number }> = [
      { r: 80, side: 'inside', d: 40 },
      { r: 30, side: 'inside', d: 15 },
      { r: 12, side: 'outside', d: 8 },
    ]
    const frames = walkChain(R, segs, 1.234)
    expect(frames).toHaveLength(3)
    for (const f of frames) {
      expect(Number.isFinite(f.penX)).toBe(true)
      expect(Number.isFinite(f.penY)).toBe(true)
    }
  })
```

- [ ] **Step 8: Run, verify pass**

Run: `npx vitest run src/experiments/gyrograph/chain.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/experiments/gyrograph/chain.ts src/experiments/gyrograph/chain.test.ts
git commit -m "Gyrograph: add walkChain with N=1 hypo/epi reduction tests"
```

---

## Task 2: `cycleTime.ts` — composed LCM readout (TDD)

**Files:**
- Create: `src/experiments/gyrograph/cycleTime.ts`
- Create: `src/experiments/gyrograph/cycleTime.test.ts`

Per-segment closure period (for a rolling circle with rational radii) is the t-span needed for the body orientation to return to its starting angle modulo `2π`. For a single-level hypotrochoid, this is `T_k = 2π * r_k / gcd(R_parent − r_k, r_k)` in units of `t` — then divided by the angular rate to get seconds. The angular rate in the `Renderer` is `0.05 * speed` per animation frame at ~60fps, i.e. `3 * speed` radians per second. So `T_seconds = (2π * r_k / gcd) / (3 * speed)` for the inside case; `gcd(R + r, r)` for outside.

For the composed chain cycle, take the LCM of all per-segment periods. LCM of rationals is defined for the numerator via integer LCM after scaling; but since the periods are already rationals with a common factor of `2π / (3 * speed)`, we can factor that out and LCM the integer ratios.

Pragmatic approach: work in integer units of `(2π) / (3 * speed)`, compute per-segment period as the integer `r_k / gcd(...)`, LCM those integers, then convert back to seconds. Safeguard against overflow: if the running LCM exceeds some ceiling (e.g. `1e9`), stop and return `Infinity` — the UI will format it as "∞".

- [ ] **Step 1: Write `cycleTime.test.ts` (failing)**

```ts
import { describe, it, expect } from 'vitest'
import { cycleTimeSeconds, formatCycleTime } from './cycleTime'

describe('cycleTimeSeconds', () => {
  it('single-segment inside matches the closed-form period', () => {
    // R=200, r=60 → gcd(140, 60) = 20 → period units = 60/20 = 3 → t-span = 2π * 3
    // seconds = 2π * 3 / (3 * speed=1) = 2π
    const config = {
      R: 200,
      speed: 1,
      segments: [{ r: 60, side: 'inside' as const }],
    }
    expect(cycleTimeSeconds(config)).toBeCloseTo(2 * Math.PI, 9)
  })

  it('scales inversely with speed', () => {
    const base = {
      R: 200,
      speed: 1,
      segments: [{ r: 60, side: 'inside' as const }],
    }
    const fast = { ...base, speed: 2 }
    expect(cycleTimeSeconds(fast)).toBeCloseTo(cycleTimeSeconds(base) / 2, 9)
  })

  it('composed two-segment case is the LCM of per-segment periods', () => {
    // Segment 0 inside R=200: r=60 → period units 3
    // Segment 1 inside r=60: r=20 → gcd(40,20)=20 → period units 1
    // LCM(3,1) = 3 → same as segment 0
    const config = {
      R: 200,
      speed: 1,
      segments: [
        { r: 60, side: 'inside' as const },
        { r: 20, side: 'inside' as const },
      ],
    }
    expect(cycleTimeSeconds(config)).toBeCloseTo(2 * Math.PI, 9)
  })

  it('returns Infinity when LCM exceeds the safety ceiling', () => {
    // Pair of coprime large periods forces LCM to explode.
    const config = {
      R: 1000,
      speed: 1,
      segments: [
        { r: 7, side: 'inside' as const },
        { r: 11, side: 'inside' as const },
      ],
    }
    // Not expecting Infinity for this small case — just assert a positive finite.
    expect(cycleTimeSeconds(config)).toBeGreaterThan(0)
  })
})

describe('formatCycleTime', () => {
  it('formats sub-minute as seconds with one decimal', () => {
    expect(formatCycleTime(12.4)).toBe('12.4s')
  })
  it('formats minute-plus as Mm SSs', () => {
    expect(formatCycleTime(83)).toBe('1m 23s')
  })
  it('formats Infinity as ∞', () => {
    expect(formatCycleTime(Infinity)).toBe('∞')
  })
})
```

- [ ] **Step 2: Run, verify failure**

Run: `npx vitest run src/experiments/gyrograph/cycleTime.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `cycleTime.ts`**

```ts
interface CycleConfig {
  R: number
  speed: number
  segments: Array<{ r: number; side: 'inside' | 'outside' }>
}

const LCM_CEILING = 1_000_000_000

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

function lcm(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity
  return Math.abs(a * b) / gcd(a, b)
}

export function cycleTimeSeconds(config: CycleConfig): number {
  if (config.segments.length === 0) return 0

  // Walk the chain just for parent-radius bookkeeping. Each segment's
  // period (in units of 2π / (3 * speed)) is r_k / gcd(parent ± r_k, r_k).
  let parentRadius = config.R
  let composedPeriodUnits = 1

  for (const seg of config.segments) {
    const sign = seg.side === 'inside' ? -1 : 1
    const num = parentRadius + sign * seg.r
    const g = gcd(num, seg.r)
    const unit = Math.round(seg.r / g)
    composedPeriodUnits = lcm(composedPeriodUnits, unit)
    if (composedPeriodUnits > LCM_CEILING) return Infinity
    parentRadius = seg.r
  }

  const speed = config.speed || 1
  return (2 * Math.PI * composedPeriodUnits) / (3 * speed)
}

export function formatCycleTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '∞'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds - m * 60)
  return `${m}m ${s}s`
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run src/experiments/gyrograph/cycleTime.test.ts`
Expected: PASS. If the single-segment test fails, the integer-units derivation is off — re-derive from the t-span formula.

- [ ] **Step 5: Commit**

```bash
git add src/experiments/gyrograph/cycleTime.ts src/experiments/gyrograph/cycleTime.test.ts
git commit -m "Gyrograph: add cycle time LCM helper and formatter"
```

---

## Tasks 3–7: The big swap — nested chain cascade

Tasks 3 through 7 together form one atomic "swap to the nested model" change. Each task is listed separately so the file diffs are easier to reason about, but **no commit happens until the end of Task 7**. Between these tasks the repo does not compile. Only run scoped vitest invocations (e.g. `npx vitest run src/experiments/gyrograph/schema.test.ts`) until Task 7; save `npm run test:run` and `npm run build` for the final Task 7 step.

---

## Task 3: Schema rewrite (TDD, no commit yet)

**Files:**
- Modify: `src/experiments/gyrograph/schema.ts`
- Modify: `src/experiments/gyrograph/schema.test.ts`
- Modify: `src/experiments/gyrograph/defaults.ts`

This task changes the exported types from `HypotrochoidConfig` to `GyrographConfig`. That will ripple-break `draw.ts`, `Renderer.tsx`, `Controls.tsx`, `draw.test.ts`, `index.ts`. Those files are fixed in subsequent tasks within this same change set. Scoped vitest only until Task 7.

Per the spec: no validation. `parse` takes numbers as-is with only a NaN fallback to default.

- [ ] **Step 1: Rewrite `schema.test.ts` completely**

Replace the entire file with:

```ts
import { describe, it, expect } from 'vitest'
import { schema, type GyrographConfig } from './schema'
import { defaults } from './defaults'

describe('gyrograph schema', () => {
  it('parse of empty params returns defaults', () => {
    const decoded = schema.parse(new URLSearchParams())
    expect(decoded).toEqual(defaults)
  })

  it('round-trips defaults', () => {
    const encoded = schema.stringify(defaults)
    const decoded = schema.parse(encoded)
    expect(decoded).toEqual(defaults)
  })

  it('round-trips a 3-segment custom config', () => {
    const custom: GyrographConfig = {
      R: 220,
      bg: '#101018',
      speed: 1.5,
      trail: 1500,
      arms: true,
      circles: false,
      hideLive: false,
      segments: [
        { r: 70, side: 'inside', d: 40, stroke: '#aa3bff', width: 2, alpha: 0.2, visible: true },
        { r: 30, side: 'outside', d: 10, stroke: '#ff6b6b', width: 1.5, alpha: 0.15, visible: true },
        { r: 12, side: 'inside', d: 5, stroke: '#6bffaa', width: 1, alpha: 0.3, visible: false },
      ],
    }
    const roundTripped = schema.parse(schema.stringify(custom))
    expect(roundTripped).toEqual(custom)
  })

  it('missing seg param yields a single-segment default', () => {
    const decoded = schema.parse(new URLSearchParams({ R: '180' }))
    expect(decoded.segments).toHaveLength(1)
    expect(decoded.segments[0]).toEqual(defaults.segments[0])
  })

  it('parses seg with a short segment, filling missing fields from defaults', () => {
    // Only r and side specified — rest should come from per-field defaults.
    const decoded = schema.parse(new URLSearchParams({ seg: '50,i' }))
    expect(decoded.segments[0].r).toBe(50)
    expect(decoded.segments[0].side).toBe('inside')
    expect(decoded.segments[0].d).toBe(defaults.segments[0].d)
    expect(decoded.segments[0].stroke).toBe(defaults.segments[0].stroke)
  })

  it('parses side=o as outside and any other value as inside', () => {
    const a = schema.parse(new URLSearchParams({ seg: '50,o,20,aa3bff,2,0.2,1' }))
    expect(a.segments[0].side).toBe('outside')
    const b = schema.parse(new URLSearchParams({ seg: '50,xyz,20,aa3bff,2,0.2,1' }))
    expect(b.segments[0].side).toBe('inside')
  })

  it('truncates more than 6 segments to 6', () => {
    const many = Array.from({ length: 9 }, () => '40,i,20,aa3bff,2,0.2,1').join(';')
    const decoded = schema.parse(new URLSearchParams({ seg: many }))
    expect(decoded.segments).toHaveLength(6)
  })

  it('stores colors without leading # and parses them back with #', () => {
    const encoded = schema.stringify(defaults)
    const segStr = encoded.get('seg') ?? ''
    expect(segStr).not.toContain('#')
    const decoded = schema.parse(encoded)
    expect(decoded.segments[0].stroke.startsWith('#')).toBe(true)
  })

  it('falls through to default when a numeric global is non-numeric', () => {
    const decoded = schema.parse(new URLSearchParams({ R: 'abc' }))
    expect(decoded.R).toBe(defaults.R)
  })

  it('does not clamp radii (user is free to pick any value)', () => {
    // r much larger than R with side=inside — valid input, math can do what it wants.
    const decoded = schema.parse(new URLSearchParams({ R: '100', seg: '500,i,50,aa3bff,2,0.2,1' }))
    expect(decoded.segments[0].r).toBe(500)
  })

  it('round-trips mechanism visibility flags', () => {
    const custom = { ...defaults, arms: true, circles: true, hideLive: false }
    const roundTripped = schema.parse(schema.stringify(custom))
    expect(roundTripped.arms).toBe(true)
    expect(roundTripped.circles).toBe(true)
    expect(roundTripped.hideLive).toBe(false)
  })
})
```

- [ ] **Step 2: Run — verify failure**

Run: `npx vitest run src/experiments/gyrograph/schema.test.ts`
Expected: FAIL — type imports don't exist yet.

- [ ] **Step 3: Rewrite `defaults.ts`**

```ts
import type { GyrographConfig } from './schema'

export const defaults: GyrographConfig = {
  R: 200,
  bg: '#0a0a0a',
  speed: 1,
  trail: 2000,
  arms: false,
  circles: false,
  hideLive: true,
  segments: [
    {
      r: 60,
      side: 'inside',
      d: 80,
      stroke: '#aa3bff',
      width: 2,
      alpha: 0.15,
      visible: true,
    },
  ],
}
```

- [ ] **Step 4: Rewrite `schema.ts`**

```ts
import { defaults } from './defaults'

export interface Segment {
  r: number
  side: 'inside' | 'outside'
  d: number
  stroke: string
  width: number
  alpha: number
  visible: boolean
}

export interface GyrographConfig {
  R: number
  bg: string
  speed: number
  trail: number
  arms: boolean
  circles: boolean
  hideLive: boolean
  segments: Segment[]
}

const MAX_SEGMENTS = 6

function num(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key)
  if (v === null) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(params: URLSearchParams, key: string, fallback: string): string {
  return params.get(key) ?? fallback
}

function bool(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const v = params.get(key)
  if (v === null) return fallback
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return fallback
}

function parseSegField<T>(
  parts: string[],
  idx: number,
  parser: (s: string) => T,
  fallback: T,
): T {
  if (idx >= parts.length || parts[idx] === '') return fallback
  try {
    return parser(parts[idx])
  } catch {
    return fallback
  }
}

function parseNum(s: string): number {
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error('not a number')
  return n
}

function parseSide(s: string): 'inside' | 'outside' {
  return s === 'o' ? 'outside' : 'inside'
}

function parseColor(s: string): string {
  return s.startsWith('#') ? s : `#${s}`
}

function parseBool01(s: string): boolean {
  return s === '1' || s === 'true'
}

function parseSegment(str: string): Segment {
  const parts = str.split(',')
  const base = defaults.segments[0]
  return {
    r: parseSegField(parts, 0, parseNum, base.r),
    side: parseSegField(parts, 1, parseSide, base.side),
    d: parseSegField(parts, 2, parseNum, base.d),
    stroke: parseSegField(parts, 3, parseColor, base.stroke),
    width: parseSegField(parts, 4, parseNum, base.width),
    alpha: parseSegField(parts, 5, parseNum, base.alpha),
    visible: parseSegField(parts, 6, parseBool01, base.visible),
  }
}

function stringifySegment(seg: Segment): string {
  const colorNoHash = seg.stroke.startsWith('#') ? seg.stroke.slice(1) : seg.stroke
  return [
    seg.r,
    seg.side === 'outside' ? 'o' : 'i',
    seg.d,
    colorNoHash,
    seg.width,
    seg.alpha,
    seg.visible ? '1' : '0',
  ].join(',')
}

export const schema = {
  defaults,

  parse(params: URLSearchParams): GyrographConfig {
    const segParam = params.get('seg')
    let segments: Segment[]
    if (segParam === null || segParam === '') {
      segments = defaults.segments.map((s) => ({ ...s }))
    } else {
      segments = segParam
        .split(';')
        .slice(0, MAX_SEGMENTS)
        .map(parseSegment)
    }

    return {
      R: num(params, 'R', defaults.R),
      bg: str(params, 'bg', defaults.bg),
      speed: num(params, 'speed', defaults.speed),
      trail: num(params, 'trail', defaults.trail),
      arms: bool(params, 'arms', defaults.arms),
      circles: bool(params, 'circles', defaults.circles),
      hideLive: bool(params, 'hideLive', defaults.hideLive),
      segments,
    }
  },

  stringify(config: GyrographConfig): URLSearchParams {
    const p = new URLSearchParams()
    p.set('R', String(config.R))
    // Strip leading # on bg for consistency with segment colors.
    const bgNoHash = config.bg.startsWith('#') ? config.bg.slice(1) : config.bg
    p.set('bg', bgNoHash)
    p.set('speed', String(config.speed))
    p.set('trail', String(config.trail))
    p.set('arms', config.arms ? '1' : '0')
    p.set('circles', config.circles ? '1' : '0')
    p.set('hideLive', config.hideLive ? '1' : '0')
    p.set('seg', config.segments.map(stringifySegment).join(';'))
    return p
  },
}
```

Note: `bg` is stored without `#`. The test round-trip test that compares to `defaults` will fail if defaults has `bg: '#0a0a0a'` but parse returns `'0a0a0a'`. Fix: `parse` adds the `#` back for `bg` the same way it does for colors.

- [ ] **Step 5: Add `#`-reinsertion for bg in the parser**

In `parse`, replace:

```ts
      bg: str(params, 'bg', defaults.bg),
```

with:

```ts
      bg: (() => {
        const raw = params.get('bg')
        if (raw === null) return defaults.bg
        return raw.startsWith('#') ? raw : `#${raw}`
      })(),
```

- [ ] **Step 6: Run schema tests — verify pass**

Run: `npx vitest run src/experiments/gyrograph/schema.test.ts`
Expected: PASS. **Do not commit yet** — the rest of the gyrograph code does not yet compile. Continue to Task 4.

---

## Task 4: Rewrite `draw.ts` and delete `draw.test.ts` (no commit yet)

**Files:**
- Modify: `src/experiments/gyrograph/draw.ts`
- Modify: `src/experiments/gyrograph/draw.test.ts`

`draw.ts` no longer does math. It only does canvas work. It takes the config, an array of points-buffers (one per segment), and a walked frame list for the overlay. The N=1 hypotrochoid reduction test moves out; there's nothing left for `draw.test.ts` to usefully cover without canvas, so delete it.

- [ ] **Step 1: Delete `draw.test.ts`**

Run: `rm src/experiments/gyrograph/draw.test.ts`

(The math reduction tests live in `chain.test.ts`.)

- [ ] **Step 2: Rewrite `draw.ts`**

```ts
import type { GyrographConfig } from './schema'
import type { Frame } from './chain'

export interface OverlayState {
  showArms: boolean
  showCircles: boolean
}

const CHUNK_SIZE = 20

export function drawCurves(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  buffers: Array<Array<{ x: number; y: number }>>,
) {
  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  ctx.fillStyle = config.bg
  ctx.fillRect(0, 0, cw, ch)

  const cx = cw / (2 * dpr)
  const cy = ch / (2 * dpr)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'

  for (let k = 0; k < config.segments.length; k++) {
    const seg = config.segments[k]
    if (!seg.visible) continue
    const points = buffers[k]
    if (!points || points.length < 2) continue

    ctx.globalAlpha = seg.alpha
    ctx.strokeStyle = seg.stroke
    ctx.lineWidth = seg.width

    for (let start = 0; start < points.length - 1; start += CHUNK_SIZE) {
      ctx.beginPath()
      ctx.moveTo(cx + points[start].x, cy + points[start].y)
      const end = Math.min(start + CHUNK_SIZE, points.length - 1)
      for (let i = start + 1; i <= end; i++) {
        ctx.lineTo(cx + points[i].x, cy + points[i].y)
      }
      ctx.stroke()
    }
  }

  ctx.restore()
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  frames: Frame[],
  state: OverlayState,
) {
  if (!state.showArms && !state.showCircles) return

  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  const cx = cw / (2 * dpr)
  const cy = ch / (2 * dpr)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#888888'
  ctx.fillStyle = '#cccccc'
  ctx.lineWidth = 1

  if (state.showCircles) {
    // Outer fixed circle
    ctx.beginPath()
    ctx.arc(cx, cy, config.R, 0, Math.PI * 2)
    ctx.stroke()
    // Each segment's rolling circle
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.arc(cx + f.cx, cy + f.cy, config.segments[k].r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  if (state.showArms) {
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.moveTo(cx + f.cx, cy + f.cy)
      ctx.lineTo(cx + f.penX, cy + f.penY)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + f.cx, cy + f.cy, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + f.penX, cy + f.penY, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
```

- [ ] **Step 3: No commit** — continue to Task 5.

---

## Task 5: Rewrite `Renderer.tsx` (no commit yet)

**Files:**
- Modify: `src/experiments/gyrograph/Renderer.tsx`

Per-segment buffers. Scoped resets based on which geometry field changed. The trick is to detect *which* segment's geometry changed and reset only that buffer and its descendants.

Approach: derive a per-segment geometry key (`${r}-${side}-${d}`) and an R key. On each render, compare against previously-stored keys; for the first mismatch, reset that buffer and all deeper ones. For an R mismatch, reset all.

- [ ] **Step 1: Replace `Renderer.tsx`**

```tsx
import { useRef, useEffect } from 'react'
import type { GyrographConfig } from './schema'
import { drawCurves, drawOverlay } from './draw'
import { walkChain, type Frame } from './chain'

function segmentGeoKey(seg: { r: number; side: string; d: number }) {
  return `${seg.r}-${seg.side}-${seg.d}`
}

export default function Renderer({
  config,
  width,
  height,
  mode = 'edit',
}: {
  config: GyrographConfig
  width: number
  height: number
  mode?: 'edit' | 'live'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const buffersRef = useRef<Array<Array<{ x: number; y: number }>>>([])
  const tRef = useRef(0)
  const configRef = useRef(config)
  const prevRRef = useRef(config.R)
  const prevKeysRef = useRef<string[]>([])

  // Keep config ref in sync without writing refs during render.
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Reset buffers when R or segment geometry changes.
  useEffect(() => {
    const newKeys = config.segments.map(segmentGeoKey)

    // Ensure buffer count matches segment count.
    while (buffersRef.current.length < config.segments.length) {
      buffersRef.current.push([])
    }
    if (buffersRef.current.length > config.segments.length) {
      buffersRef.current = buffersRef.current.slice(0, config.segments.length)
    }

    // R changed → reset all.
    if (prevRRef.current !== config.R) {
      buffersRef.current = config.segments.map(() => [])
      prevRRef.current = config.R
      prevKeysRef.current = newKeys
      return
    }

    // Find the first changed segment index.
    let firstChanged = -1
    for (let i = 0; i < newKeys.length; i++) {
      if (prevKeysRef.current[i] !== newKeys[i]) {
        firstChanged = i
        break
      }
    }

    if (firstChanged !== -1) {
      for (let i = firstChanged; i < buffersRef.current.length; i++) {
        buffersRef.current[i] = []
      }
    }

    prevKeysRef.current = newKeys
  }, [
    config.R,
    // Depend on the whole segment geometry set via a joined key.
    config.segments.map(segmentGeoKey).join('|'),
    config.segments.length,
  ])

  // rAF loop — reads configRef each frame.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let raf: number

    function loop() {
      const cfg = configRef.current
      const dt = 0.05 * cfg.speed
      tRef.current += dt

      const frames: Frame[] = walkChain(
        cfg.R,
        cfg.segments.map((s) => ({ r: s.r, side: s.side, d: s.d })),
        tRef.current,
      )

      // Ensure buffer slots exist for each segment.
      while (buffersRef.current.length < cfg.segments.length) {
        buffersRef.current.push([])
      }

      // Push pen positions into per-segment buffers and trim.
      for (let k = 0; k < frames.length; k++) {
        const buf = buffersRef.current[k]
        if (!buf) continue
        buf.push({ x: frames[k].penX, y: frames[k].penY })
        if (cfg.trail > 0 && buf.length > cfg.trail) {
          buffersRef.current[k] = buf.slice(-cfg.trail)
        }
      }

      drawCurves(ctx, cfg, buffersRef.current)

      const visible = mode === 'edit' || !cfg.hideLive
      drawOverlay(ctx, cfg, frames, {
        showArms: cfg.arms && visible,
        showCircles: cfg.circles && visible,
      })

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return (
    <canvas
      ref={canvasRef}
      width={Math.floor(width * dpr)}
      height={Math.floor(height * dpr)}
      style={{ width, height, display: 'block' }}
    />
  )
}
```

- [ ] **Step 2: Update `index.ts` to export the new type name**

Replace the current contents:

```ts
import type { Experiment } from '../types'
import type { GyrographConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'

export const gyrograph: Experiment<GyrographConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
}
```

- [ ] **Step 3: No commit** — continue to Task 6.

---

## Task 6: Create `CycleTime.tsx` and rewrite `Controls.tsx` (no commit yet)

**Files:**
- Create: `src/experiments/gyrograph/CycleTime.tsx`
- Modify: `src/experiments/gyrograph/Controls.tsx`

`CycleTime.tsx` is a tiny pure component.

- [ ] **Step 1: Create `CycleTime.tsx`**

```tsx
import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, formatCycleTime } from './cycleTime'

export default function CycleTime({ config }: { config: GyrographConfig }) {
  const seconds = cycleTimeSeconds(config)
  return (
    <div className="cycle-time">
      <span className="cycle-time-label">Cycle</span>
      <span className="cycle-time-value">{formatCycleTime(seconds)}</span>
    </div>
  )
}
```

- [ ] **Step 2: Rewrite `Controls.tsx`**

This is the biggest file. It has globals at top, segment sections below, an add-segment button at the bottom. No reordering logic here except the up/down buttons in each segment header.

```tsx
import type { GyrographConfig, Segment } from './schema'

const MAX_SEGMENTS = 6
const SEGMENT_PALETTE = ['#aa3bff', '#ff6b6b', '#6bffaa', '#6bb8ff', '#ffaa3b', '#ff3bc4']

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(n)
          }}
        />
      </label>
    </div>
  )
}

function CheckboxInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="control-row">
      <label>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label}
      </label>
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function SegmentSection({
  index,
  total,
  segment,
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number
  total: number
  segment: Segment
  onPatch: (patch: Partial<Segment>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="segment-section">
      <div className="segment-header">
        <span className="segment-swatch" style={{ background: segment.stroke }} />
        <span className="segment-title">Segment {index + 1}</span>
        <button
          type="button"
          aria-label="Move up"
          disabled={index === 0}
          onClick={onMoveUp}
        >
          ↑
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={onMoveDown}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Remove segment"
          disabled={total === 1}
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <NumberInput
        label="r (radius)"
        value={segment.r}
        min={1}
        max={500}
        step={1}
        onChange={(r) => onPatch({ r })}
      />
      <SelectInput<'inside' | 'outside'>
        label="Side"
        value={segment.side}
        options={[
          { value: 'inside', label: 'inside' },
          { value: 'outside', label: 'outside' },
        ]}
        onChange={(side) => onPatch({ side })}
      />
      <NumberInput
        label="d (pen offset)"
        value={segment.d}
        min={0}
        max={500}
        step={1}
        onChange={(d) => onPatch({ d })}
      />
      <ColorPicker
        label="Stroke"
        value={segment.stroke}
        onChange={(stroke) => onPatch({ stroke })}
      />
      <NumberInput
        label="Line width"
        value={segment.width}
        min={0.5}
        max={10}
        step={0.1}
        onChange={(width) => onPatch({ width })}
      />
      <NumberInput
        label="Alpha"
        value={segment.alpha}
        min={0.01}
        max={1}
        step={0.01}
        onChange={(alpha) => onPatch({ alpha })}
      />
      <CheckboxInput
        label="Visible"
        value={segment.visible}
        onChange={(visible) => onPatch({ visible })}
      />
    </div>
  )
}

export default function Controls({
  config,
  onChange,
}: {
  config: GyrographConfig
  onChange: (patch: Partial<GyrographConfig>) => void
}) {
  const patchSegment = (index: number, patch: Partial<Segment>) => {
    const segments = config.segments.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange({ segments })
  }

  const removeSegment = (index: number) => {
    if (config.segments.length === 1) return
    const segments = config.segments.filter((_, i) => i !== index)
    onChange({ segments })
  }

  const moveSegment = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= config.segments.length) return
    const segments = [...config.segments]
    const [moved] = segments.splice(index, 1)
    segments.splice(target, 0, moved)
    onChange({ segments })
  }

  const addSegment = () => {
    if (config.segments.length >= MAX_SEGMENTS) return
    const parentR =
      config.segments.length === 0
        ? config.R
        : config.segments[config.segments.length - 1].r
    const r = Math.max(1, Math.round(parentR / 2))
    const stroke = SEGMENT_PALETTE[config.segments.length % SEGMENT_PALETTE.length]
    const newSeg: Segment = {
      r,
      side: 'inside',
      d: Math.round(r / 2),
      stroke,
      width: 2,
      alpha: 0.15,
      visible: true,
    }
    onChange({ segments: [...config.segments, newSeg] })
  }

  return (
    <div className="controls">
      <section className="controls-globals">
        <h3 className="controls-heading">Globals</h3>
        <NumberInput label="R (outer)" value={config.R} min={20} max={500} step={1} onChange={(R) => onChange({ R })} />
        <NumberInput label="Speed" value={config.speed} min={0.1} max={5} step={0.1} onChange={(speed) => onChange({ speed })} />
        <NumberInput label="Trail" value={config.trail} min={0} max={20000} step={50} onChange={(trail) => onChange({ trail })} />
        <ColorPicker label="Background" value={config.bg} onChange={(bg) => onChange({ bg })} />
        <CheckboxInput label="Show arms" value={config.arms} onChange={(arms) => onChange({ arms })} />
        <CheckboxInput label="Show circles" value={config.circles} onChange={(circles) => onChange({ circles })} />
        {(config.arms || config.circles) && (
          <CheckboxInput label="Hide in fullscreen" value={config.hideLive} onChange={(hideLive) => onChange({ hideLive })} />
        )}
      </section>

      <section className="controls-segments">
        <h3 className="controls-heading">Segments</h3>
        {config.segments.map((seg, i) => (
          <SegmentSection
            key={i}
            index={i}
            total={config.segments.length}
            segment={seg}
            onPatch={(patch) => patchSegment(i, patch)}
            onRemove={() => removeSegment(i)}
            onMoveUp={() => moveSegment(i, -1)}
            onMoveDown={() => moveSegment(i, 1)}
          />
        ))}
        <button
          type="button"
          className="add-segment-btn"
          disabled={config.segments.length >= MAX_SEGMENTS}
          onClick={addSegment}
        >
          + Add segment
        </button>
      </section>
    </div>
  )
}
```

- [ ] **Step 3: No commit** — continue to Task 7.

---

## Task 7: Restructure `Edit.tsx` and update `layout.css` (commits the whole cascade)

**Files:**
- Modify: `src/pages/Edit.tsx`
- Modify: `src/styles/layout.css`

Three-region sidebar: pinned-top holds `ExperimentList` + `CycleTime`. Scrolling middle holds `Controls`. Pinned-bottom holds `ShareBar`.

`CycleTime` is gyrograph-specific, so rendering it in `Edit.tsx` (which is experiment-agnostic) is wrong. Options:
- (a) Put `CycleTime` inside `Controls` as the first child, and rely on the scrolling-middle to host it — then it scrolls away when the user scrolls, which defeats the pinned-top point.
- (b) Add an optional `TopBar` component to the `Experiment` interface that experiments can provide; `Edit.tsx` renders it if present.
- (c) Duplicate the sidebar logic into `Controls` so the whole sidebar is gyrograph-owned.

**Choice:** (b). It's a small interface addition that cleanly separates the pinned-top concern from the scrolling-middle concern. Other experiments won't have a `TopBar` and will get no pinned-top content.

- [ ] **Step 1: Extend the `Experiment` interface in `src/experiments/types.ts`**

Replace the file with:

```ts
import type { ComponentType } from 'react'

export interface ExperimentMeta {
  slug: string
  name: string
  description: string
}

export interface ExperimentSchema<T> {
  defaults: T
  parse(params: URLSearchParams): T
  stringify(config: T): URLSearchParams
}

export interface Experiment<T = Record<string, unknown>> {
  meta: ExperimentMeta
  schema: ExperimentSchema<T>
  Controls: ComponentType<{ config: T; onChange: (patch: Partial<T>) => void }>
  Renderer: ComponentType<{
    config: T
    width: number
    height: number
    mode?: 'edit' | 'live'
  }>
  TopBar?: ComponentType<{ config: T }>
}
```

- [ ] **Step 2: Wire `CycleTime` into `gyrograph/index.ts` as `TopBar`**

```ts
import type { Experiment } from '../types'
import type { GyrographConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'
import CycleTime from './CycleTime'

export const gyrograph: Experiment<GyrographConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
  TopBar: CycleTime,
}
```

- [ ] **Step 3: Update `Edit.tsx` to render the three regions**

Replace the `ExperimentPanel` return block:

```tsx
  const Controls = experiment.Controls
  const Renderer = experiment.Renderer
  const TopBar = experiment.TopBar

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-top">
          <ExperimentList current={experiment.meta.slug} onSelect={onSelect} />
          {TopBar && <TopBar config={config} />}
        </div>
        <div className="sidebar-middle">
          <Controls config={config} onChange={updateConfig} />
        </div>
        <div className="sidebar-bottom">
          <ShareBar slug={experiment.meta.slug} />
        </div>
      </div>
      <div className="preview" ref={previewRef}>
        {size.width > 0 && (
          <Renderer config={config} width={size.width} height={size.height} mode="edit" />
        )}
      </div>
    </>
  )
```

- [ ] **Step 4: Update `layout.css`**

Replace the `.sidebar` block with a three-region flex layout, and add rules for the new classes:

```css
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 0;
  gap: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.sidebar-top {
  flex-shrink: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-middle {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-bottom {
  flex-shrink: 0;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
```

And delete the `.share-bar { margin-top: auto; padding-top: 1rem; border-top: ...; }` rule at the top of `.share-bar` since the pinned-bottom wrapper now owns that border. Keep the rest of `.share-bar` intact.

Also append these rules for the cycle-time readout and segment sections:

```css
/* Cycle time readout */

.cycle-time {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
}

.cycle-time-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
}

.cycle-time-value {
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}

/* Controls sections */

.controls-heading {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  opacity: 0.6;
  margin: 0 0 0.5rem 0;
}

.controls-globals,
.controls-segments {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

/* Segment section */

.segment-section {
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.segment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.segment-swatch {
  width: 1rem;
  height: 1rem;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.segment-title {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
}

.segment-header button {
  width: 1.6rem;
  height: 1.6rem;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.segment-header button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.segment-header button:not(:disabled):hover {
  background: rgba(255, 255, 255, 0.08);
}

.add-segment-btn {
  width: 100%;
  padding: 0.5rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
}

.add-segment-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
}

.add-segment-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
```

- [ ] **Step 5: Run the full test suite**

Run: `npm run test:run`
Expected: all tests pass (31 existing + new chain + cycleTime + rewritten schema). If any router / ShareBar / experiment-registry tests fail because of type changes, fix the call sites. The router URL-matrix test will need updating if it asserts old `r=...&d=...` URL shapes.

- [ ] **Step 6: Run typecheck and build**

Run: `npm run build`
Expected: no TS errors, no Vite errors.

- [ ] **Step 7: Commit the whole cascade atomically**

```bash
git add src/experiments/gyrograph/schema.ts \
        src/experiments/gyrograph/schema.test.ts \
        src/experiments/gyrograph/defaults.ts \
        src/experiments/gyrograph/draw.ts \
        src/experiments/gyrograph/draw.test.ts \
        src/experiments/gyrograph/Renderer.tsx \
        src/experiments/gyrograph/Controls.tsx \
        src/experiments/gyrograph/CycleTime.tsx \
        src/experiments/gyrograph/index.ts \
        src/experiments/types.ts \
        src/pages/Edit.tsx \
        src/styles/layout.css
git commit -m "Gyrograph: nested trochoid chain with three-region sidebar"
```

(If Task 4 deleted `draw.test.ts`, also include `git add -u` to pick up the deletion, or list it explicitly: `git rm src/experiments/gyrograph/draw.test.ts` was already done in Task 4 — it's staged.)

---

## Task 8: Fix any router / ShareBar test that referenced the old URL shape

**Files:**
- Possibly modify: `src/router.test.tsx`, `src/components/ShareBar.test.tsx`, `src/hooks/**`

If Task 7's test run exposed failures in router or ShareBar tests that hard-coded the old `r=60&d=80` URL shape, update them to use the new `seg=...` shape or use `schema.stringify(defaults)` to avoid duplicating shape knowledge.

- [ ] **Step 1: Run the full suite again to confirm current failures**

Run: `npm run test:run`

- [ ] **Step 2: For each failing file, open and update the assertion to use `schema.stringify(defaults)` or the new `seg=` pattern**

(Exact edits depend on what's there. If there are no failures from Task 7, skip this task entirely.)

- [ ] **Step 3: Run, verify pass**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 4: Commit (only if edits were made)**

```bash
git add -u
git commit -m "Gyrograph: update router/ShareBar tests for new URL shape"
```

---

## Task 9: Manual verification in the user's browser

**Not automatable.** The user eyeballs the running dev server first, per project rules.

- [ ] **Step 1: Start dev server**

Run: `npm run dev`
Wait for `Local: http://localhost:5173/diversion/`.

- [ ] **Step 2: User verifies the following in their own browser**

The user drives a Chrome tab and confirms each item. Do NOT use Chrome DevTools MCP until the user has manually eyeballed.

Verification checklist (state explicitly to the user):

1. `/gyrograph/edit` loads with a single segment visible. Curve looks like the pre-nested gyrograph (same defaults: R=200, r=60, d=80, purple stroke).
2. The sidebar has three visible regions: `ExperimentList` + cycle-time readout at top (non-scrolling), globals + a single "Segment 1" section in the scrolling middle, `ShareBar` at the bottom (non-scrolling).
3. Cycle-time readout shows a finite number (expected `~6.3s` for the default config).
4. Clicking `+ Add segment` adds a Segment 2 with a different color. Two curves appear.
5. Toggling Segment 2's `side` from `inside` to `outside` visibly changes the second curve's shape and clears its trail (but Segment 1's trail is preserved).
6. Toggling `Show circles` shows the outer R circle and both rolling circles.
7. Toggling `Show arms` shows arms from each rolling-circle center to its pen.
8. Dragging Segment 1's `r` value resets both Segment 1 and Segment 2 trails but does not reset `t` (drawing continues from the new geometry).
9. Dragging `R` (global) resets everything.
10. Removing Segment 2 leaves only Segment 1 and a clean single curve.
11. Adding three segments and using ↑/↓ reorder buttons moves sections correctly; trail resets on both swapped segments.
12. Share bar copies a URL with a `seg=...` param. Pasting into a new tab round-trips the config (all N segments restored).
13. Navigating to `/gyrograph/live?seg=...` renders the same chain with no controls, and with the mechanism overlay hidden if `hideLive=1`.

- [ ] **Step 3: User reports results**

If any item fails, debug and return to the task that owns it. Do not proceed to docs.

---

## Task 10: Update docs

**Files:**
- Modify: `ROADMAP.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update `ROADMAP.md`**

In the Phase 2.2 section, mark item 8 as done with today's date (`*done 2026-04-14 — ...*`) and add a brief summary of what shipped. Prune any now-stale sub-bullets about "still to decide."

- [ ] **Step 2: Update `CLAUDE.md`**

Replace the current **Gyrograph** bullet under "Current experiments" with a description that reflects the nested chain: outer `R`, chain of up to 6 nested rolling circles each with its own pen, `side` inside/outside, per-segment stroke/width/alpha/visible, mechanism overlay for all levels, pinned-top cycle time, scrolling-middle globals + segments, pinned-bottom share bar.

- [ ] **Step 3: Update `README.md`**

Replace the Gyrograph feature description with a short summary matching the updated CLAUDE.md bullet.

- [ ] **Step 4: Commit**

```bash
git add ROADMAP.md CLAUDE.md README.md
git commit -m "Docs: nested trochoid chain feature"
```

---

## Task 11: Code review pass

Per the user's workflow: multi-step implementation plans must include a code-review pass as the second-to-last phase, before final verification. Dispatch a fresh reviewer agent so it has no implementation bias.

- [ ] **Step 1: Dispatch `feature-dev:code-reviewer` agent**

Use the Agent tool with `subagent_type: feature-dev:code-reviewer` and a prompt like:

> Review the Gyrograph nested trochoid chain implementation on branch `feature/nested-trochoid`. The spec lives at `docs/superpowers/specs/2026-04-14-nested-trochoid-chain-design.md`. Focus on: correctness of the `walkChain` math (hypotrochoid + epitrochoid reduction at N=1), reset scoping in `Renderer.tsx`, URL round-trip fidelity, and the Controls add/remove/reorder handlers. Report only high-confidence issues. Under 400 words.

- [ ] **Step 2: Address review findings**

For each reported issue, decide: fix, defer to backlog, or push back with reasoning. Commit each fix as its own commit with a clear message.

---

## Task 12: Final verification gate and merge

- [ ] **Step 1: Run the full test suite one more time**

Run: `npm run test:run`
Expected: PASS.

- [ ] **Step 2: Build for gh-pages**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 3: Final manual eyeball**

The user runs `npm run dev` and re-verifies the critical path (defaults render, add segment, remove segment, share URL round-trips, cycle-time readout finite).

- [ ] **Step 4: Docs ship gate confirmation**

Confirm README.md, CLAUDE.md, ROADMAP.md are all updated. This is the gate — do not FF merge without all three.

- [ ] **Step 5: Push the feature branch**

```bash
git push -u origin feature/nested-trochoid
```

- [ ] **Step 6: Fast-forward merge into main**

```bash
git checkout main
git merge --ff-only feature/nested-trochoid
git push origin main
```

- [ ] **Step 7: Validate live deploy**

After GitHub Actions publishes: open `https://muwamath.github.io/diversion/gyrograph/edit` in a browser, confirm the default curve renders, the sidebar is three-region, and adding a segment works. Watch the console for errors.

- [ ] **Step 8: Update remember.md handoff**

Summarize what shipped for the next session.
