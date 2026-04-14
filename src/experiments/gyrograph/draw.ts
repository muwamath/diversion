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

function computeMarginFrac(minDim: number): number {
  const raw = 0.01 + ((minDim - 500) / 1500) * 0.03
  return Math.max(0.01, Math.min(0.04, raw))
}

function computeScale(
  cwCss: number,
  chCss: number,
  extent: number,
): number {
  const minDim = Math.min(cwCss, chCss)
  const marginFrac = computeMarginFrac(minDim)
  const usable = (minDim / 2) * (1 - marginFrac)
  return usable / Math.max(extent, 1)
}

export function drawCurves(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  polylines: Array<Array<{ x: number; y: number }>>,
  cycleT: number,
  startT: number,
  endT: number,
  extent: number,
) {
  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  ctx.fillStyle = config.bg
  ctx.fillRect(0, 0, cw, ch)

  if (!(cycleT > 0) || endT <= startT) return
  const span = endT - startT

  const cwCss = cw / dpr
  const chCss = ch / dpr
  const scale = computeScale(cwCss, chCss, extent)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.translate(cwCss / 2, chCss / 2)
  ctx.scale(scale, scale)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'butt'

  for (let k = 0; k < config.segments.length; k++) {
    const seg = config.segments[k]
    if (!seg.visible) continue
    const poly = polylines[k]
    if (!poly || poly.length < 2) continue
    const N = poly.length

    ctx.globalAlpha = seg.alpha
    ctx.strokeStyle = seg.stroke
    ctx.lineWidth = seg.width / scale

    const startFrac = ((startT % cycleT) + cycleT) % cycleT
    const startIdx = Math.floor((startFrac / cycleT) * N) % N
    const totalSlices = Math.max(1, Math.round((span / cycleT) * N))

    ctx.beginPath()
    ctx.moveTo(poly[startIdx].x, poly[startIdx].y)
    for (let i = 1; i <= totalSlices; i++) {
      const idx = (startIdx + i) % N
      ctx.lineTo(poly[idx].x, poly[idx].y)
      if (i % CHUNK_SIZE === 0) {
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(poly[idx].x, poly[idx].y)
      }
    }
    ctx.stroke()
  }

  ctx.restore()
}

export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  config: GyrographConfig,
  frames: Frame[],
  state: OverlayState,
  extent: number,
) {
  if (!state.showArms && !state.showCircles) return

  const { width: cw, height: ch } = ctx.canvas
  const dpr = window.devicePixelRatio || 1
  const cwCss = cw / dpr
  const chCss = ch / dpr
  const scale = computeScale(cwCss, chCss, extent)

  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.translate(cwCss / 2, chCss / 2)
  ctx.scale(scale, scale)
  ctx.globalAlpha = 1
  ctx.strokeStyle = '#888888'
  ctx.fillStyle = '#cccccc'
  ctx.lineWidth = 1 / scale

  if (state.showCircles) {
    ctx.beginPath()
    ctx.arc(0, 0, config.R, 0, Math.PI * 2)
    ctx.stroke()
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.arc(f.cx, f.cy, config.segments[k].r, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  if (state.showArms) {
    const dotRadius = 3 / scale
    for (let k = 0; k < frames.length; k++) {
      const f = frames[k]
      ctx.beginPath()
      ctx.moveTo(f.cx, f.cy)
      ctx.lineTo(f.penX, f.penY)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(f.cx, f.cy, dotRadius, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(f.penX, f.penY, dotRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.restore()
}
