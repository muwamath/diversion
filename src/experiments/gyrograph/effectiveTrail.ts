import type { GyrographConfig } from './schema'

// Returns the visible trail window as a t-space value (radians). Callers
// pass the current cycleT (from cycleBuffer.buildCycleBuffer) so this
// function is pure and speed/display-rate independent.
//
// Auto mode: the window is exactly one cycle.
// Manual mode: the window is `cfg.trail` cycles. Fractional values show a
// partial arc; values above 1 cause visible overdraw at crossings.
export function computeTWindow(
  config: GyrographConfig,
  cycleT: number,
): number {
  if (config.autoTrail) return cycleT
  const cycles = Number.isFinite(config.trail) ? Math.max(0, config.trail) : 1
  return cycles * cycleT
}
