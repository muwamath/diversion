import { describe, it, expect } from 'vitest'
import { computeResetRange } from './resetRange'

describe('computeResetRange', () => {
  it('returns "all" when R changed regardless of keys', () => {
    expect(computeResetRange(['a', 'b'], ['a', 'b'], true)).toBe('all')
    expect(computeResetRange(['a'], ['x', 'y'], true)).toBe('all')
  })

  it('returns "none" when nothing changed', () => {
    expect(computeResetRange(['a', 'b', 'c'], ['a', 'b', 'c'], false)).toBe('none')
  })

  it('returns the first differing index when a middle segment changes', () => {
    expect(computeResetRange(['a', 'b', 'c'], ['a', 'X', 'c'], false)).toEqual({ from: 1 })
  })

  it('returns 0 when the first segment changes', () => {
    expect(computeResetRange(['a', 'b'], ['X', 'b'], false)).toEqual({ from: 0 })
  })

  it('returns the appended index when a segment is added to the end', () => {
    expect(computeResetRange(['a', 'b'], ['a', 'b', 'c'], false)).toEqual({ from: 2 })
  })

  it('returns the shorter length when a segment is removed from the end', () => {
    expect(computeResetRange(['a', 'b', 'c'], ['a', 'b'], false)).toEqual({ from: 2 })
  })

  it('returns the index of the first mismatch when a middle segment is removed', () => {
    // Removing index 1 shifts index 2 into position 1.
    expect(computeResetRange(['a', 'b', 'c'], ['a', 'c'], false)).toEqual({ from: 1 })
  })

  it('returns { from: 0 } when segments are reordered', () => {
    expect(computeResetRange(['a', 'b'], ['b', 'a'], false)).toEqual({ from: 0 })
  })
})
