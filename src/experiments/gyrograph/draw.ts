import type { HypotrochoidConfig } from './schema'

export interface DrawState {
  t: number
  showArms: boolean
  showCircles: boolean
}

export function drawHypotrochoid(
  ctx: CanvasRenderingContext2D,
  config: HypotrochoidConfig,
  points: Array<{ x: number; y: number }>,
  state: DrawState,
) {
  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1

  // Clear
  ctx.fillStyle = config.bg
  ctx.fillRect(0, 0, cw, ch)

  if (points.length < 2) return

  // Center the curve
  const cx = cw / (2 * dpr)
  const cy = ch / (2 * dpr)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.globalAlpha = config.alpha
  ctx.strokeStyle = config.stroke
  ctx.lineWidth = config.width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'

  const CHUNK_SIZE = 20
  for (let start = 0; start < points.length - 1; start += CHUNK_SIZE) {
    ctx.beginPath()
    ctx.moveTo(cx + points[start].x, cy + points[start].y)
    const end = Math.min(start + CHUNK_SIZE, points.length - 1)
    for (let i = start + 1; i <= end; i++) {
      ctx.lineTo(cx + points[i].x, cy + points[i].y)
    }
    ctx.stroke()
  }
  ctx.restore()

  // Mechanism overlay (outer circle, rolling inner circle, pen arm)
  if (!state.showArms && !state.showCircles) return

  const diff = config.R - config.r
  const rollX = diff * Math.cos(state.t)
  const rollY = diff * Math.sin(state.t)
  const penX = points[points.length - 1].x
  const penY = points[points.length - 1].y

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#888888'
  ctx.fillStyle = '#cccccc'
  ctx.lineWidth = 1

  if (state.showCircles) {
    ctx.beginPath()
    ctx.arc(cx, cy, config.R, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + rollX, cy + rollY, config.r, 0, Math.PI * 2)
    ctx.stroke()
  }

  if (state.showArms) {
    ctx.beginPath()
    ctx.moveTo(cx + rollX, cy + rollY)
    ctx.lineTo(cx + penX, cy + penY)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx + rollX, cy + rollY, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx + penX, cy + penY, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export function computePoint(config: HypotrochoidConfig, t: number) {
  const { R, r, d } = config
  const diff = R - r
  const ratio = diff / r
  return {
    x: diff * Math.cos(t) + d * Math.cos(ratio * t),
    y: diff * Math.sin(t) - d * Math.sin(ratio * t),
  }
}
