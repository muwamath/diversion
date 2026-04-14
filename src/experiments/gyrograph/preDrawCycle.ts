import type { GyrographConfig } from './schema'
import { walkChain } from './chain'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'
import { computeEffectiveTrail, REFERENCE_FPS } from './effectiveTrail'

export interface PreDrawResult {
  buffers: Array<Array<{ x: number; y: number }>>
  tEnd: number
}

export function preDrawBuffers(config: GyrographConfig): PreDrawResult | null {
  if (!config.preDrawCycle) return null

  const cap = computeEffectiveTrail(config)
  if (cap === 0) return null

  const seconds = cycleTimeSeconds(config)
  const cycleFrames = Number.isFinite(seconds) && seconds > 0
    ? Math.round(seconds * REFERENCE_FPS)
    : Infinity

  const nFrames = Math.min(cap, cycleFrames)
  if (nFrames <= 0 || !Number.isFinite(nFrames)) return null

  const tDeltaPerFrame = (1 / REFERENCE_FPS) * RADIANS_PER_SECOND * config.speed
  const geometry = config.segments.map((s) => ({
    r: s.r,
    side: s.side,
    d: s.d,
  }))

  const buffers: Array<Array<{ x: number; y: number }>> = config.segments.map(() => [])

  for (let i = 1; i <= nFrames; i++) {
    const t = i * tDeltaPerFrame
    const frames = walkChain(config.R, geometry, t)
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      if (!Number.isFinite(f.penX) || !Number.isFinite(f.penY)) continue
      buffers[k].push({ x: f.penX, y: f.penY })
    }
  }

  return { buffers, tEnd: nFrames * tDeltaPerFrame }
}
