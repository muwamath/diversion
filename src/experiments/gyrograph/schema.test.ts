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
