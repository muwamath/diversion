import { defaults } from './defaults'

export interface HypotrochoidConfig {
  R: number
  r: number
  d: number
  speed: number
  trail: number
  stroke: string
  width: number
  alpha: number
  bg: string
  arms: boolean
  circles: boolean
  hideLive: boolean
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

function bool(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const v = params.get(key)
  if (v === null) return fallback
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return fallback
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
      alpha: Math.min(1, Math.max(0.01, num(params, 'alpha', defaults.alpha))),
      bg: str(params, 'bg', defaults.bg),
      arms: bool(params, 'arms', defaults.arms),
      circles: bool(params, 'circles', defaults.circles),
      hideLive: bool(params, 'hideLive', defaults.hideLive),
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
    p.set('alpha', String(config.alpha))
    p.set('bg', config.bg)
    p.set('arms', config.arms ? '1' : '0')
    p.set('circles', config.circles ? '1' : '0')
    p.set('hideLive', config.hideLive ? '1' : '0')
    return p
  },
}
