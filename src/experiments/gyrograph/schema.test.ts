import { describe, it, expect } from 'vitest'
import { schema } from './schema'
import { defaults } from './defaults'

describe('gyrograph schema', () => {
  it('round-trips defaults', () => {
    const encoded = schema.stringify(defaults)
    const decoded = schema.parse(encoded)
    expect(decoded).toEqual(defaults)
  })

  it('returns defaults when params are missing', () => {
    const decoded = schema.parse(new URLSearchParams())
    expect(decoded).toEqual(defaults)
  })

  it('clamps r to a minimum of 1', () => {
    const decoded = schema.parse(new URLSearchParams({ r: '0' }))
    expect(decoded.r).toBe(1)
  })

  it('clamps negative r to 1', () => {
    const decoded = schema.parse(new URLSearchParams({ r: '-5' }))
    expect(decoded.r).toBe(1)
  })

  it('falls through to default when a numeric field is non-numeric', () => {
    const decoded = schema.parse(new URLSearchParams({ R: 'abc' }))
    expect(decoded.R).toBe(defaults.R)
  })

  it('preserves hex color strings through a round-trip', () => {
    const custom = { ...defaults, stroke: '#ff6b6b', bg: '#1a1a2e' }
    const roundTripped = schema.parse(schema.stringify(custom))
    expect(roundTripped.stroke).toBe('#ff6b6b')
    expect(roundTripped.bg).toBe('#1a1a2e')
  })

  it('round-trips a custom numeric config', () => {
    const custom = {
      ...defaults,
      R: 180,
      r: 55,
      d: 70,
      speed: 2.5,
      trail: 1500,
      width: 2,
      alpha: 0.42,
    }
    const roundTripped = schema.parse(schema.stringify(custom))
    expect(roundTripped).toEqual(custom)
  })

  it('returns the default alpha when missing', () => {
    const decoded = schema.parse(new URLSearchParams())
    expect(decoded.alpha).toBe(defaults.alpha)
  })

  it('clamps alpha above 1 down to 1', () => {
    const decoded = schema.parse(new URLSearchParams({ alpha: '5' }))
    expect(decoded.alpha).toBe(1)
  })

  it('clamps alpha below 0.01 up to 0.01', () => {
    const decoded = schema.parse(new URLSearchParams({ alpha: '0' }))
    expect(decoded.alpha).toBe(0.01)
  })

  it('clamps negative alpha up to 0.01', () => {
    const decoded = schema.parse(new URLSearchParams({ alpha: '-0.5' }))
    expect(decoded.alpha).toBe(0.01)
  })

  it('falls through to default alpha for non-numeric input', () => {
    const decoded = schema.parse(new URLSearchParams({ alpha: 'abc' }))
    expect(decoded.alpha).toBe(defaults.alpha)
  })
})
