import { useRef, useEffect } from 'react'
import type { GyrographConfig } from './schema'
import { drawCurves, drawOverlay, isMechanismVisible } from './draw'
import { walkChain, type Frame } from './chain'
import { RADIANS_PER_SECOND } from './cycleTime'
import { maxPenExtent } from './extent'
import { buildCycleBuffer, cycleTSpan } from './cycleBuffer'

function segmentGeoKey(seg: { r: number; side: string; d: number }) {
  return `${seg.r}-${seg.side}-${seg.d}`
}

export default function Renderer({
  config,
  width,
  height,
  mode = 'edit',
}: {
  config: GyrographConfig
  width: number
  height: number
  mode?: 'edit' | 'live'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const polylinesRef = useRef(buildCycleBuffer(config))
  const tSpanRef = useRef(cycleTSpan(config))
  const tRef = useRef(0)
  const configRef = useRef(config)
  const extentRef = useRef(maxPenExtent(config))

  useEffect(() => {
    configRef.current = config
    extentRef.current = maxPenExtent(config)
  }, [config])

  const segmentKeysJoined = config.segments.map(segmentGeoKey).join('|')

  useEffect(() => {
    polylinesRef.current = buildCycleBuffer(config)
    tSpanRef.current = cycleTSpan(config)
    if (config.zenDraw) {
      tRef.current = 0
    }
  }, [config.R, segmentKeysJoined, config.segments.length, config.zenDraw])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let raf: number
    let lastTime = performance.now()

    function loop() {
      const cfg = configRef.current
      const now = performance.now()
      const dtSeconds = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      tRef.current += dtSeconds * RADIANS_PER_SECOND * cfg.speed

      const polylines = polylinesRef.current
      const tSpan = tSpanRef.current
      const N = polylines[0]?.length ?? 0
      const tVal = tRef.current
      const currentIdx = N > 0
        ? ((Math.floor((tVal / tSpan) * N) % N) + N) % N
        : 0

      let startIdx: number
      let span: number
      if (cfg.zenDraw && tVal < tSpan) {
        // Zen growing phase: curve draws on from index 0 up to currentIdx.
        startIdx = 0
        span = Math.max(0, currentIdx + 1)
      } else {
        // Default: full cycle or rotating arc. Overdraw (span > N) is
        // allowed and produces multi-pass alpha stacking inside draw.ts.
        span = cfg.trail <= 0 ? N : Math.max(0, Math.round(cfg.trail))
        startIdx = N > 0 ? (((currentIdx - span + 1) % N) + N) % N : 0
      }

      const extent = extentRef.current
      drawCurves(ctx, cfg, polylines, startIdx, span, extent)

      const frames: Frame[] = walkChain(
        cfg.R,
        cfg.segments.map((s) => ({ r: s.r, side: s.side, d: s.d })),
        tRef.current,
      )
      const visible = isMechanismVisible(mode, cfg.hideLive)
      drawOverlay(
        ctx,
        cfg,
        frames,
        {
          showArms: cfg.arms && visible,
          showCircles: cfg.circles && visible,
        },
        extent,
      )

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

  return (
    <canvas
      ref={canvasRef}
      width={Math.floor(width * dpr)}
      height={Math.floor(height * dpr)}
      style={{ width, height, display: 'block' }}
    />
  )
}
