import { defaults } from './defaults'

export interface HypotrochoidConfig {
  R: number
  r: number
  d: number
  speed: number
  trail: number
  stroke: string
  width: number
  bg: string
}

function num(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key)
  if (v === null) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function str(params: URLSearchParams, key: string, fallback: string): string {
  return params.get(key) ?? fallback
}

export const schema = {
  defaults,

  parse(params: URLSearchParams): HypotrochoidConfig {
    return {
      R: num(params, 'R', defaults.R),
      r: Math.max(1, num(params, 'r', defaults.r)),
      d: num(params, 'd', defaults.d),
      speed: num(params, 'speed', defaults.speed),
      trail: num(params, 'trail', defaults.trail),
      stroke: str(params, 'stroke', defaults.stroke),
      width: num(params, 'width', defaults.width),
      bg: str(params, 'bg', defaults.bg),
    }
  },

  stringify(config: HypotrochoidConfig): URLSearchParams {
    const p = new URLSearchParams()
    p.set('R', String(config.R))
    p.set('r', String(config.r))
    p.set('d', String(config.d))
    p.set('speed', String(config.speed))
    p.set('trail', String(config.trail))
    p.set('stroke', config.stroke)
    p.set('width', String(config.width))
    p.set('bg', config.bg)
    return p
  },
}
