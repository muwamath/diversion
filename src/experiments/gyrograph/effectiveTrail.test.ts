import { describe, it, expect } from 'vitest'
import {
  computeEffectiveTrail,
  computeCycleTWindow,
  REFERENCE_FPS,
} from './effectiveTrail'
import { defaults } from './defaults'
import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

const base = (): GyrographConfig => ({ ...defaults, segments: defaults.segments.map((s) => ({ ...s })) })

describe('computeEffectiveTrail', () => {
  it('manual mode: returns cfg.trail verbatim', () => {
    const cfg = { ...base(), autoTrail: false, trail: 1234 }
    expect(computeEffectiveTrail(cfg)).toBe(1234)
  })

  it('manual mode: preserves 0 as unbounded', () => {
    const cfg = { ...base(), autoTrail: false, trail: 0 }
    expect(computeEffectiveTrail(cfg)).toBe(0)
  })

  it('manual mode: rounds fractional trail to nearest integer', () => {
    const cfg = { ...base(), autoTrail: false, trail: 100.7 }
    expect(computeEffectiveTrail(cfg)).toBe(101)
  })

  it('manual mode: never returns negative values', () => {
    const cfg = { ...base(), autoTrail: false, trail: -50 }
    expect(computeEffectiveTrail(cfg)).toBe(0)
  })

  it('auto mode: short finite cycle returns round(cycleTimeSeconds * 60)', () => {
    const cfg = { ...base(), autoTrail: true, maxHistorySeconds: 180, speed: 1 }
    const seconds = cycleTimeSeconds(cfg)
    const expected = Math.round(seconds * REFERENCE_FPS)
    expect(computeEffectiveTrail(cfg)).toBe(expected)
    expect(Number.isFinite(seconds) && seconds < 180).toBe(true)
  })

  it('auto mode: cycle above ceiling is capped at ceiling', () => {
    const cfg = {
      ...base(),
      autoTrail: true,
      maxHistorySeconds: 180,
      speed: 0.001,
    }
    const seconds = cycleTimeSeconds(cfg)
    expect(seconds).toBeGreaterThan(180)
    expect(computeEffectiveTrail(cfg)).toBe(180 * REFERENCE_FPS)
  })

  it('auto mode: infinite cycle falls back to ceiling', () => {
    // Three large pairwise-coprime primes force composedPeriodUnits past
    // the LCM_CEILING in cycleTime.ts, which returns Infinity.
    const cfg: GyrographConfig = {
      ...base(),
      autoTrail: true,
      maxHistorySeconds: 120,
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    const seconds = cycleTimeSeconds(cfg)
    expect(Number.isFinite(seconds)).toBe(false)
    expect(computeEffectiveTrail(cfg)).toBe(120 * REFERENCE_FPS)
  })

  it('auto mode: empty segments returns ceiling', () => {
    const cfg: GyrographConfig = {
      ...base(),
      autoTrail: true,
      maxHistorySeconds: 180,
      segments: [],
    }
    expect(computeEffectiveTrail(cfg)).toBe(180 * REFERENCE_FPS)
  })

  it('returns non-negative integer values', () => {
    const cases: GyrographConfig[] = [
      { ...base(), autoTrail: false, trail: 0 },
      { ...base(), autoTrail: true, maxHistorySeconds: 1 },
      { ...base(), autoTrail: true, maxHistorySeconds: 1800 },
    ]
    for (const cfg of cases) {
      const result = computeEffectiveTrail(cfg)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(result)).toBe(true)
    }
  })
})

describe('computeCycleTWindow', () => {
  it('returns the exact cycle t-span for a finite short cycle', () => {
    const cfg = { ...base(), maxHistorySeconds: 180, speed: 1 }
    const seconds = cycleTimeSeconds(cfg)
    const expected = seconds * RADIANS_PER_SECOND * cfg.speed
    expect(computeCycleTWindow(cfg)).toBeCloseTo(expected, 6)
  })

  it('is speed-invariant for the same geometry (cycleT = 2\u03c0 * composedPeriodUnits)', () => {
    const a = { ...base(), speed: 1 }
    const b = { ...base(), speed: 4 }
    expect(computeCycleTWindow(a)).toBeCloseTo(computeCycleTWindow(b), 6)
  })

  it('caps at maxHistorySeconds * RADIANS_PER_SECOND * speed when cycle exceeds the ceiling', () => {
    const cfg = { ...base(), maxHistorySeconds: 180, speed: 0.001 }
    const seconds = cycleTimeSeconds(cfg)
    expect(seconds).toBeGreaterThan(180)
    const expected = 180 * RADIANS_PER_SECOND * cfg.speed
    expect(computeCycleTWindow(cfg)).toBeCloseTo(expected, 6)
  })

  it('falls back to ceiling t-window for infinite cycles', () => {
    const cfg: GyrographConfig = {
      ...base(),
      maxHistorySeconds: 60,
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    expect(Number.isFinite(cycleTimeSeconds(cfg))).toBe(false)
    const expected = 60 * RADIANS_PER_SECOND * cfg.speed
    expect(computeCycleTWindow(cfg)).toBeCloseTo(expected, 6)
  })
})
