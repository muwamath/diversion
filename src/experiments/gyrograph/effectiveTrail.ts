import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

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

// Returns the t-space window (in radians) that the render loop should use
// when truncating the trail buffer in auto mode. Truncating by t-value
// rather than point count makes the head-to-tail distance exactly one
// cycle, which eliminates frame-rate-dependent drift and the associated
// flicker at path crossings.
export function computeCycleTWindow(config: GyrographConfig): number {
  const ceilingT =
    config.maxHistorySeconds * RADIANS_PER_SECOND * config.speed
  const seconds = cycleTimeSeconds(config)
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return ceilingT
  }
  const cycleT = seconds * RADIANS_PER_SECOND * config.speed
  return Math.min(cycleT, ceilingT)
}
