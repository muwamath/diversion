import type { GyrographConfig } from './schema'
import { walkChain } from './chain'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

export const SAMPLES_PER_CYCLE = 2000

export interface CycleBuffer {
  polylines: Array<Array<{ x: number; y: number }>>
  cycleT: number
  isTruePeriodic: boolean
}

// Pre-computes one period of pen positions per segment. For truly periodic
// configs (finite composed LCM), the polyline samples [0, 2\u03c0 * composedPeriodUnits)
// in math-space — independent of display refresh rate AND independent of
// speed (longer cycles at slow speed still have the same t-space period).
// Only truly non-periodic configs (LCM ceiling exceeded in cycleTimeSeconds)
// fall back to a virtual cycle spanning maxHistorySeconds of wall-clock.
export function buildCycleBuffer(config: GyrographConfig): CycleBuffer {
  const seconds = cycleTimeSeconds(config)
  const isTruePeriodic = Number.isFinite(seconds) && seconds > 0

  const cycleT = isTruePeriodic
    ? seconds * RADIANS_PER_SECOND * config.speed
    : config.maxHistorySeconds * RADIANS_PER_SECOND * config.speed

  const N = SAMPLES_PER_CYCLE
  const geometry = config.segments.map((s) => ({
    r: s.r,
    side: s.side,
    d: s.d,
  }))
  const polylines: Array<Array<{ x: number; y: number }>> =
    config.segments.map(() => new Array(N))

  for (let i = 0; i < N; i++) {
    const t = (i / N) * cycleT
    const frames = walkChain(config.R, geometry, t)
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      polylines[k][i] = {
        x: Number.isFinite(f.penX) ? f.penX : 0,
        y: Number.isFinite(f.penY) ? f.penY : 0,
      }
    }
  }

  return { polylines, cycleT, isTruePeriodic }
}
