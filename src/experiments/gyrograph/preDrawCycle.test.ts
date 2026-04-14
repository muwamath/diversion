import { describe, it, expect } from 'vitest'
import { preDrawBuffers } from './preDrawCycle'
import { computeEffectiveTrail, REFERENCE_FPS } from './effectiveTrail'
import { defaults } from './defaults'
import type { GyrographConfig } from './schema'
import { cycleTimeSeconds } from './cycleTime'

const base = (): GyrographConfig => ({
  ...defaults,
  segments: defaults.segments.map((s) => ({ ...s })),
})

describe('preDrawBuffers', () => {
  it('returns null when preDrawCycle is false', () => {
    const cfg = { ...base(), preDrawCycle: false, autoTrail: true }
    expect(preDrawBuffers(cfg)).toBeNull()
  })

  it('returns null when effective trail is 0 (unbounded manual mode)', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: false, trail: 0 }
    expect(preDrawBuffers(cfg)).toBeNull()
  })

  it('returns populated buffers when preDrawCycle is true with auto-trail and a short cycle', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: true, maxHistorySeconds: 180 }
    const result = preDrawBuffers(cfg)
    expect(result).not.toBeNull()
    expect(result!.buffers).toHaveLength(cfg.segments.length)
    for (const buf of result!.buffers) {
      expect(buf.length).toBeGreaterThan(0)
    }
  })

  it('fills to cycleFrames when cycle fits under the ceiling in auto mode', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: true, maxHistorySeconds: 180 }
    const seconds = cycleTimeSeconds(cfg)
    const expectedFrames = Math.round(seconds * REFERENCE_FPS)
    const result = preDrawBuffers(cfg)!
    expect(result.buffers[0].length).toBe(expectedFrames)
  })

  it('caps at ceiling when cycle exceeds maxHistorySeconds in auto mode', () => {
    const cfg = {
      ...base(),
      preDrawCycle: true,
      autoTrail: true,
      maxHistorySeconds: 180,
      speed: 0.001,
    }
    const result = preDrawBuffers(cfg)!
    expect(result.buffers[0].length).toBe(180 * REFERENCE_FPS)
  })

  it('handles infinite cycle by falling back to ceiling', () => {
    // Three large pairwise-coprime primes force composedPeriodUnits past
    // the LCM_CEILING in cycleTime.ts, which returns Infinity.
    const cfg: GyrographConfig = {
      ...base(),
      preDrawCycle: true,
      autoTrail: true,
      maxHistorySeconds: 60,
      R: 10007,
      segments: [
        { r: 5003, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5009, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
        { r: 5011, side: 'inside', d: 100, stroke: '#fff', width: 1, alpha: 0.5, visible: true },
      ],
    }
    const result = preDrawBuffers(cfg)!
    expect(result).not.toBeNull()
    expect(result.buffers[0].length).toBe(60 * REFERENCE_FPS)
  })

  it('manual mode with finite trail fills to min(trail, cycleFrames)', () => {
    const cfg = {
      ...base(),
      preDrawCycle: true,
      autoTrail: false,
      trail: 200,
      speed: 1,
    }
    const seconds = cycleTimeSeconds(cfg)
    const cycleFrames = Math.round(seconds * REFERENCE_FPS)
    const expected = Math.min(200, cycleFrames)
    const result = preDrawBuffers(cfg)!
    expect(result.buffers[0].length).toBe(expected)
  })

  it('tEnd equals nFrames * tDeltaPerFrame', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: true, maxHistorySeconds: 180 }
    const seconds = cycleTimeSeconds(cfg)
    const cycleFrames = Math.round(seconds * REFERENCE_FPS)
    const nFrames = Math.min(computeEffectiveTrail(cfg), cycleFrames)
    const tDelta = (1 / REFERENCE_FPS) * 3 * cfg.speed
    const result = preDrawBuffers(cfg)!
    expect(result.tEnd).toBeCloseTo(nFrames * tDelta, 6)
  })

  it('returns only finite pen positions', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: true }
    const result = preDrawBuffers(cfg)!
    for (const buf of result.buffers) {
      for (const p of buf) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    }
  })

  it('populates monotonically-increasing .t stamps on each point', () => {
    const cfg = { ...base(), preDrawCycle: true, autoTrail: true }
    const result = preDrawBuffers(cfg)!
    for (const buf of result.buffers) {
      for (let i = 0; i < buf.length; i++) {
        expect(Number.isFinite(buf[i].t)).toBe(true)
        if (i > 0) {
          expect(buf[i].t).toBeGreaterThan(buf[i - 1].t)
        }
      }
    }
  })
})
