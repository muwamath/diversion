import { describe, it, expect } from 'vitest'
import { walkChain } from './chain'

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
})
