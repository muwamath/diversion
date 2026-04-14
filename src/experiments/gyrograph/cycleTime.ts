interface CycleConfig {
  R: number
  speed: number
  segments: Array<{ r: number; side: 'inside' | 'outside' }>
}

// Angular rate for speed=1. Used by both the renderer (to advance t in
// wall-clock-driven rAF) and by cycleTimeSeconds (to convert t-space
// periods to wall-clock seconds). Sharing this constant keeps the
// cycle-time readout correct regardless of display refresh rate.
export const RADIANS_PER_SECOND = 3

const LCM_CEILING = 1_000_000_000

function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a))
  b = Math.abs(Math.round(b))
  while (b !== 0) {
    ;[a, b] = [b, a % b]
  }
  return a || 1
}

function lcm(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Infinity
  return Math.abs(a * b) / gcd(a, b)
}

export function cycleTimeSeconds(config: CycleConfig): number {
  if (config.segments.length === 0) return 0

  let parentRadius = config.R
  let composedPeriodUnits = 1

  for (const seg of config.segments) {
    const sign = seg.side === 'inside' ? -1 : 1
    const num = parentRadius + sign * seg.r
    const g = gcd(num, seg.r)
    const unit = Math.round(seg.r / g)
    composedPeriodUnits = lcm(composedPeriodUnits, unit)
    if (composedPeriodUnits > LCM_CEILING) return Infinity
    parentRadius = seg.r
  }

  const speed = config.speed || 1
  return (2 * Math.PI * composedPeriodUnits) / (RADIANS_PER_SECOND * speed)
}

export function formatCycleTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '∞'
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds - m * 60)
  return `${m}m ${s}s`
}
