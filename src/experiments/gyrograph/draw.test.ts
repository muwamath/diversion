import { describe, it, expect } from 'vitest'
import { isMechanismVisible } from './draw'

describe('isMechanismVisible', () => {
  it('edit mode always shows the mechanism regardless of hideLive', () => {
    expect(isMechanismVisible('edit', true)).toBe(true)
    expect(isMechanismVisible('edit', false)).toBe(true)
  })

  it('live mode hides the mechanism when hideLive is true', () => {
    expect(isMechanismVisible('live', true)).toBe(false)
  })

  it('live mode shows the mechanism when hideLive is false', () => {
    expect(isMechanismVisible('live', false)).toBe(true)
  })
})
