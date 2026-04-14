import { defaults } from './defaults'

export interface Segment {
  r: number
  side: 'inside' | 'outside'
  d: number
  stroke: string
  width: number
  alpha: number
  visible: boolean
}

export interface GyrographConfig {
  R: number
  bg: string
  speed: number
  trail: number
  arms: boolean
  circles: boolean
  hideLive: boolean
  segments: Segment[]
}

const MAX_SEGMENTS = 6

function num(params: URLSearchParams, key: string, fallback: number): number {
  const v = params.get(key)
  if (v === null) return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function bool(params: URLSearchParams, key: string, fallback: boolean): boolean {
  const v = params.get(key)
  if (v === null) return fallback
  if (v === '1' || v === 'true') return true
  if (v === '0' || v === 'false') return false
  return fallback
}

function parseSegField<T>(
  parts: string[],
  idx: number,
  parser: (s: string) => T,
  fallback: T,
): T {
  if (idx >= parts.length || parts[idx] === '') return fallback
  try {
    return parser(parts[idx])
  } catch {
    return fallback
  }
}

function parseNum(s: string): number {
  const n = Number(s)
  if (!Number.isFinite(n)) throw new Error('not a number')
  return n
}

function parseSide(s: string): 'inside' | 'outside' {
  return s === 'o' ? 'outside' : 'inside'
}

function parseColor(s: string): string {
  return s.startsWith('#') ? s : `#${s}`
}

function parseBool01(s: string): boolean {
  return s === '1' || s === 'true'
}

function parseSegment(raw: string): Segment {
  const parts = raw.split(',')
  const base = defaults.segments[0]
  return {
    r: parseSegField(parts, 0, parseNum, base.r),
    side: parseSegField(parts, 1, parseSide, base.side),
    d: parseSegField(parts, 2, parseNum, base.d),
    stroke: parseSegField(parts, 3, parseColor, base.stroke),
    width: parseSegField(parts, 4, parseNum, base.width),
    alpha: parseSegField(parts, 5, parseNum, base.alpha),
    visible: parseSegField(parts, 6, parseBool01, base.visible),
  }
}

function stringifySegment(seg: Segment): string {
  const colorNoHash = seg.stroke.startsWith('#') ? seg.stroke.slice(1) : seg.stroke
  return [
    seg.r,
    seg.side === 'outside' ? 'o' : 'i',
    seg.d,
    colorNoHash,
    seg.width,
    seg.alpha,
    seg.visible ? '1' : '0',
  ].join(',')
}

export const schema = {
  defaults,

  parse(params: URLSearchParams): GyrographConfig {
    const segParam = params.get('seg')
    let segments: Segment[]
    if (segParam === null || segParam === '') {
      segments = defaults.segments.map((s) => ({ ...s }))
    } else {
      segments = segParam
        .split(';')
        .slice(0, MAX_SEGMENTS)
        .map(parseSegment)
    }

    const bgRaw = params.get('bg')
    const bg =
      bgRaw === null ? defaults.bg : bgRaw.startsWith('#') ? bgRaw : `#${bgRaw}`

    return {
      R: num(params, 'R', defaults.R),
      bg,
      speed: num(params, 'speed', defaults.speed),
      trail: num(params, 'trail', defaults.trail),
      arms: bool(params, 'arms', defaults.arms),
      circles: bool(params, 'circles', defaults.circles),
      hideLive: bool(params, 'hideLive', defaults.hideLive),
      segments,
    }
  },

  stringify(config: GyrographConfig): URLSearchParams {
    const p = new URLSearchParams()
    p.set('R', String(config.R))
    const bgNoHash = config.bg.startsWith('#') ? config.bg.slice(1) : config.bg
    p.set('bg', bgNoHash)
    p.set('speed', String(config.speed))
    p.set('trail', String(config.trail))
    p.set('arms', config.arms ? '1' : '0')
    p.set('circles', config.circles ? '1' : '0')
    p.set('hideLive', config.hideLive ? '1' : '0')
    p.set('seg', config.segments.map(stringifySegment).join(';'))
    return p
  },
}
