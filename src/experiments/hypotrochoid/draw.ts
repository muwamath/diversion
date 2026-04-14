import type { HypotrochoidConfig } from './schema'

export function drawHypotrochoid(
  ctx: CanvasRenderingContext2D,
  config: HypotrochoidConfig,
  points: Array<{ x: number; y: number }>,
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
  ctx.strokeStyle = config.stroke
  ctx.lineWidth = config.width
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(cx + points[0].x, cy + points[0].y)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(cx + points[i].x, cy + points[i].y)
  }
  ctx.stroke()
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
