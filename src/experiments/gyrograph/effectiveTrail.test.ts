import { describe, it, expect } from 'vitest'
import { computeTWindow } from './effectiveTrail'
import { defaults } from './defaults'
import type { GyrographConfig } from './schema'

const base = (): GyrographConfig => ({
  ...defaults,
  segments: defaults.segments.map((s) => ({ ...s })),
})

describe('computeTWindow', () => {
  it('auto mode: returns cycleT unchanged', () => {
    const cfg = { ...base(), autoTrail: true }
    expect(computeTWindow(cfg, 62.83)).toBe(62.83)
  })

  it('manual mode: returns cfg.trail * cycleT', () => {
    const cfg = { ...base(), autoTrail: false, trail: 0.5 }
    expect(computeTWindow(cfg, 62.83)).toBeCloseTo(31.415, 6)
  })

  it('manual mode: trail > 1 yields overdraw window', () => {
    const cfg = { ...base(), autoTrail: false, trail: 3 }
    expect(computeTWindow(cfg, 20)).toBe(60)
  })

  it('manual mode: trail of 0 yields empty window', () => {
    const cfg = { ...base(), autoTrail: false, trail: 0 }
    expect(computeTWindow(cfg, 62.83)).toBe(0)
  })

  it('manual mode: negative or NaN trail is clamped/defaulted sensibly', () => {
    expect(computeTWindow({ ...base(), autoTrail: false, trail: -5 }, 62.83)).toBe(0)
    expect(computeTWindow({ ...base(), autoTrail: false, trail: NaN }, 62.83)).toBeCloseTo(62.83, 6)
  })
})
