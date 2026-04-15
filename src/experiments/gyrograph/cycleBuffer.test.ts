import { describe, it, expect } from 'vitest'
import { buildCycleBuffer, cycleTSpan, SAMPLES_PER_CYCLE } from './cycleBuffer'
import { defaults } from './defaults'
import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

const base = (): GyrographConfig => ({
  ...defaults,
  segments: defaults.segments.map((s) => ({ ...s })),
})

describe('buildCycleBuffer', () => {
  it('returns one polyline per segment, each of length SAMPLES_PER_CYCLE', () => {
    const cfg = base()
    const polylines = buildCycleBuffer(cfg)
    expect(polylines).toHaveLength(cfg.segments.length)
    for (const poly of polylines) {
      expect(poly.length).toBe(SAMPLES_PER_CYCLE)
    }
  })

  it('produces only finite coordinates', () => {
    const polylines = buildCycleBuffer(base())
    for (const poly of polylines) {
      for (const p of poly) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    }
  })

  it('a periodic hypotrochoid closes: first and last samples are near-equal', () => {
    const polylines = buildCycleBuffer(base())
    for (const poly of polylines) {
      const first = poly[0]
      const last = poly[poly.length - 1]
      // Last sample is one tDelta before the wrap-back to first, so they
      // should be adjacent pen positions on a closed curve — within a
      // small arc-length epsilon of each other.
      const dx = last.x - first.x
      const dy = last.y - first.y
      const dist = Math.hypot(dx, dy)
      expect(dist).toBeLessThan(5)
    }
  })

  it('is speed-invariant (polyline depends only on geometry)', () => {
    const a = buildCycleBuffer({ ...base(), speed: 1 })
    const b = buildCycleBuffer({ ...base(), speed: 4 })
    expect(a.length).toBe(b.length)
    for (let k = 0; k < a.length; k++) {
      for (let i = 0; i < a[k].length; i++) {
        expect(a[k][i].x).toBeCloseTo(b[k][i].x, 6)
        expect(a[k][i].y).toBeCloseTo(b[k][i].y, 6)
      }
    }
  })

  it('handles an infinite-cycle config with the FALLBACK_T_RANGE window', () => {
    const cfg: GyrographConfig = {
      ...base(),
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    const polylines = buildCycleBuffer(cfg)
    expect(polylines).toHaveLength(cfg.segments.length)
    for (const poly of polylines) {
      expect(poly.length).toBe(SAMPLES_PER_CYCLE)
      for (const p of poly) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    }
  })
})

describe('cycleTSpan', () => {
  it('returns 2\u03c0 * composedPeriodUnits (speed-invariant) for periodic configs', () => {
    const cfg = base()
    const expected = cycleTimeSeconds({ ...cfg, speed: 1 }) * RADIANS_PER_SECOND
    expect(cycleTSpan(cfg)).toBeCloseTo(expected, 6)
  })

  it('is identical at speed=1 and speed=0.001 for the same geometry', () => {
    const a = cycleTSpan({ ...base(), speed: 1 })
    const b = cycleTSpan({ ...base(), speed: 0.001 })
    expect(a).toBeCloseTo(b, 6)
  })

  it('falls back to 2\u03c0 * 1024 for infinite-cycle configs', () => {
    const cfg: GyrographConfig = {
      ...base(),
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    expect(cycleTSpan(cfg)).toBeCloseTo(2 * Math.PI * 1024, 6)
  })
})
