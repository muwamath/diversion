import { describe, it, expect } from 'vitest'
import { buildCycleBuffer, SAMPLES_PER_CYCLE } from './cycleBuffer'
import { defaults } from './defaults'
import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

const base = (): GyrographConfig => ({
  ...defaults,
  segments: defaults.segments.map((s) => ({ ...s })),
})

describe('buildCycleBuffer', () => {
  it('returns one polyline per segment', () => {
    const cfg = base()
    const cb = buildCycleBuffer(cfg)
    expect(cb.polylines).toHaveLength(cfg.segments.length)
    for (const poly of cb.polylines) {
      expect(poly.length).toBe(SAMPLES_PER_CYCLE)
    }
  })

  it('sets cycleT to one composed period for a truly periodic config', () => {
    const cfg = base()
    const cb = buildCycleBuffer(cfg)
    const seconds = cycleTimeSeconds(cfg)
    const expected = seconds * RADIANS_PER_SECOND * cfg.speed
    expect(cb.isTruePeriodic).toBe(true)
    expect(cb.cycleT).toBeCloseTo(expected, 6)
  })

  it('is speed-invariant: cycleT equals 2\u03c0 * composedPeriodUnits regardless of speed', () => {
    const a = buildCycleBuffer({ ...base(), speed: 1 })
    const b = buildCycleBuffer({ ...base(), speed: 4 })
    expect(a.cycleT).toBeCloseTo(b.cycleT, 6)
  })

  it('long wall-clock cycles still use the true math cycle', () => {
    const cfg = { ...base(), speed: 0.001 }
    const cb = buildCycleBuffer(cfg)
    const atSpeed1 = buildCycleBuffer({ ...cfg, speed: 1 })
    expect(cb.isTruePeriodic).toBe(true)
    // cycleT is speed-invariant; slow speed doesn't truncate the polyline.
    expect(cb.cycleT).toBeCloseTo(atSpeed1.cycleT, 6)
  })

  it('falls back for infinite cycles (pairwise-coprime prime segments)', () => {
    const cfg: GyrographConfig = {
      ...base(),
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    const cb = buildCycleBuffer(cfg)
    expect(cb.isTruePeriodic).toBe(false)
    expect(Number.isFinite(cb.cycleT)).toBe(true)
    for (const poly of cb.polylines) {
      expect(poly.length).toBe(SAMPLES_PER_CYCLE)
    }
  })

  it('produces only finite coordinates even for degenerate configs', () => {
    const cb = buildCycleBuffer(base())
    for (const poly of cb.polylines) {
      for (const p of poly) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    }
  })
})
