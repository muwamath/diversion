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

  it('returns a positive finite for a reasonable pair of coprime periods', () => {
    const config = {
      R: 1000,
      speed: 1,
      segments: [
        { r: 7, side: 'inside' as const },
        { r: 11, side: 'inside' as const },
      ],
    }
    const t = cycleTimeSeconds(config)
    expect(t).toBeGreaterThan(0)
    expect(Number.isFinite(t)).toBe(true)
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
