import { describe, it, expect } from 'vitest'
import { computePoint } from './draw'
import { defaults } from './defaults'

const EPSILON = 1e-9

describe('computePoint', () => {
  it('at t=0, x is (R - r) + d and y is 0', () => {
    const config = { ...defaults, R: 3, r: 1, d: 1 }
    const p = computePoint(config, 0)
    expect(p.x).toBeCloseTo(3, 9)
    expect(p.y).toBeCloseTo(0, 9)
  })

  it('at d=0, the point lies on a circle of radius (R - r) around origin', () => {
    const config = { ...defaults, R: 5, r: 2, d: 0 }
    const p = computePoint(config, Math.PI / 4)
    const radius = Math.sqrt(p.x * p.x + p.y * p.y)
    expect(radius).toBeCloseTo(3, 9)
  })

  it('at t=π, result reflects the t=0 point through x-axis (symmetric case d=0)', () => {
    const config = { ...defaults, R: 4, r: 1, d: 0 }
    const atZero = computePoint(config, 0)
    const atPi = computePoint(config, Math.PI)
    expect(atPi.x).toBeCloseTo(-atZero.x, 9)
    expect(Math.abs(atPi.y)).toBeLessThan(EPSILON)
  })

  it('is linear in d (doubling d doubles the d-contribution component)', () => {
    const t = 0.7
    const base = { ...defaults, R: 5, r: 2, d: 0 }
    const dOne = computePoint({ ...base, d: 1 }, t)
    const dTwo = computePoint({ ...base, d: 2 }, t)
    const b = computePoint(base, t)
    expect(dTwo.x - b.x).toBeCloseTo(2 * (dOne.x - b.x), 9)
    expect(dTwo.y - b.y).toBeCloseTo(2 * (dOne.y - b.y), 9)
  })
})
