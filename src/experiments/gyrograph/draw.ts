import type { GyrographConfig } from './schema'
import type { Frame } from './chain'

export interface OverlayState {
  showArms: boolean
  showCircles: boolean
}

export function isMechanismVisible(
  mode: 'edit' | 'live',
  hideLive: boolean,
): boolean {
  return mode === 'edit' || !hideLive
}

const CHUNK_SIZE = 20

export function drawCurves(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  buffers: Array<Array<{ x: number; y: number }>>,
) {
  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  ctx.fillStyle = config.bg
  ctx.fillRect(0, 0, cw, ch)

  const cx = cw / (2 * dpr)
  const cy = ch / (2 * dpr)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'

  for (let k = 0; k < config.segments.length; k++) {
    const seg = config.segments[k]
    if (!seg.visible) continue
    const points = buffers[k]
    if (!points || points.length < 2) continue

    ctx.globalAlpha = seg.alpha
    ctx.strokeStyle = seg.stroke
    ctx.lineWidth = seg.width

    for (let start = 0; start < points.length - 1; start += CHUNK_SIZE) {
      ctx.beginPath()
      ctx.moveTo(cx + points[start].x, cy + points[start].y)
      const end = Math.min(start + CHUNK_SIZE, points.length - 1)
      for (let i = start + 1; i <= end; i++) {
        ctx.lineTo(cx + points[i].x, cy + points[i].y)
      }
      ctx.stroke()
    }
  }

  ctx.restore()
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  frames: Frame[],
  state: OverlayState,
) {
  if (!state.showArms && !state.showCircles) return

  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  const cx = cw / (2 * dpr)
  const cy = ch / (2 * dpr)

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
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.arc(cx + f.cx, cy + f.cy, config.segments[k].r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  if (state.showArms) {
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.moveTo(cx + f.cx, cy + f.cy)
      ctx.lineTo(cx + f.penX, cy + f.penY)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(cx + f.cx, cy + f.cy, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + f.penX, cy + f.penY, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
