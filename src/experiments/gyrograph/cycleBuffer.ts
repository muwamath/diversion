import type { GyrographConfig } from './schema'
import { walkChain } from './chain'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

export const SAMPLES_PER_CYCLE = 4000

// Used when the composed LCM exceeds its ceiling so cycleTimeSeconds
// returns Infinity — i.e. the curve never closes exactly. Matches the
// same fallback window extent.ts uses.
const FALLBACK_T_RANGE = 2 * Math.PI * 1024

// Returns the t-space span covered by one period of the given config's
// pen motion. For truly periodic configs: `2π * composedPeriodUnits`
// (speed-invariant by construction). For non-periodic configs: a fixed
// fallback window large enough to show meaningful curve history.
export function cycleTSpan(config: GyrographConfig): number {
  const seconds = cycleTimeSeconds({ ...config, speed: 1 })
  if (!Number.isFinite(seconds) || seconds <= 0) return FALLBACK_T_RANGE
  return seconds * RADIANS_PER_SECOND
}

// Pre-computes per-segment pen polylines by sampling walkChain at
// SAMPLES_PER_CYCLE uniform t-values across one cycle span. The result
// is purely a function of geometry (R + per-segment r/side/d), so
// speed / alpha / color / trail changes do not invalidate it.
export function buildCycleBuffer(
  config: GyrographConfig,
): Array<Array<{ x: number; y: number }>> {
  const tSpan = cycleTSpan(config)
  const N = SAMPLES_PER_CYCLE
  const geometry = config.segments.map((s) => ({
    r: s.r,
    side: s.side,
    d: s.d,
  }))
  const polylines: Array<Array<{ x: number; y: number }>> =
    config.segments.map(() => new Array(N))

  for (let i = 0; i < N; i++) {
    const t = (tSpan * i) / N
    const frames = walkChain(config.R, geometry, t)
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      polylines[k][i] = {
        x: Number.isFinite(f.penX) ? f.penX : 0,
        y: Number.isFinite(f.penY) ? f.penY : 0,
      }
    }
  }

  return polylines
}
