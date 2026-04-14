import type { GyrographConfig } from './schema'
import { cycleTimeSeconds } from './cycleTime'

export const REFERENCE_FPS = 60

export function computeEffectiveTrail(config: GyrographConfig): number {
  if (!config.autoTrail) {
    return Math.max(0, Math.round(config.trail))
  }

  const ceilingFrames = Math.max(
    1,
    Math.round(config.maxHistorySeconds * REFERENCE_FPS),
  )

  const seconds = cycleTimeSeconds(config)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return ceilingFrames
  }

  const cycleFrames = Math.max(1, Math.round(seconds * REFERENCE_FPS))
  return Math.min(cycleFrames, ceilingFrames)
}
