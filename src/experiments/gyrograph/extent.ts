import type { GyrographConfig } from './schema'
import { walkChain } from './chain'
import { cycleTimeSeconds, RADIANS_PER_SECOND } from './cycleTime'

const SAMPLE_COUNT = 512
const MIN_EXTENT = 1
const FALLBACK_T_RANGE = 2 * Math.PI * 1024

export function maxPenExtent(config: GyrographConfig): number {
  if (config.segments.length === 0) return Math.max(config.R, MIN_EXTENT)

  const seconds = cycleTimeSeconds({
    R: config.R,
    speed: 1,
    segments: config.segments,
  })
  const tPeriod = Number.isFinite(seconds) && seconds > 0
    ? seconds * RADIANS_PER_SECOND
    : FALLBACK_T_RANGE

  const geometry = config.segments.map((s) => ({ r: s.r, side: s.side, d: s.d }))

  let maxDistSq = 0
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = (tPeriod * i) / SAMPLE_COUNT
    const frames = walkChain(config.R, geometry, t)
    for (const f of frames) {
      if (!Number.isFinite(f.penX) || !Number.isFinite(f.penY)) continue
      const distSq = f.penX * f.penX + f.penY * f.penY
      if (distSq > maxDistSq) maxDistSq = distSq
    }
  }

  return Math.max(Math.sqrt(maxDistSq), config.R, MIN_EXTENT)
}
