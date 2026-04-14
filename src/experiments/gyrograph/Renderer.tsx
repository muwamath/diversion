import { useRef, useEffect } from 'react'
import type { GyrographConfig } from './schema'
import { drawCurves, drawOverlay, isMechanismVisible } from './draw'
import { walkChain, type Frame } from './chain'
import { RADIANS_PER_SECOND } from './cycleTime'
import { maxPenExtent } from './extent'
import { buildCycleBuffer, type CycleBuffer } from './cycleBuffer'
import { computeTWindow } from './effectiveTrail'

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
  const cycleBufferRef = useRef<CycleBuffer>(buildCycleBuffer(config))
  const tRef = useRef(0)
  const configRef = useRef(config)
  const extentRef = useRef(maxPenExtent(config))

  useEffect(() => {
    configRef.current = config
    extentRef.current = maxPenExtent(config)
  }, [config])

  useEffect(() => {
    const cb = buildCycleBuffer(config)
    cycleBufferRef.current = cb
    tRef.current = config.preDrawCycle ? computeTWindow(config, cb.cycleT) : 0

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = config.bg
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [
    config.R,
    config.segments.map((s) => `${s.r}-${s.side}-${s.d}`).join('|'),
    config.segments.length,
    config.speed,
    config.maxHistorySeconds,
    config.autoTrail,
    config.trail,
    config.preDrawCycle,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let raf: number
    let lastTime = performance.now()

    function loop() {
      const cfg = configRef.current
      const cb = cycleBufferRef.current
      const now = performance.now()
      const dtSeconds = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now
      tRef.current += dtSeconds * RADIANS_PER_SECOND * cfg.speed

      const currentT = tRef.current
      const tWindow = computeTWindow(cfg, cb.cycleT)
      const startT = Math.max(0, currentT - tWindow)
      const endT = currentT

      const extent = extentRef.current
      drawCurves(ctx, cfg, cb.polylines, cb.cycleT, startT, endT, extent)

      const frames: Frame[] = walkChain(
        cfg.R,
        cfg.segments.map((s) => ({ r: s.r, side: s.side, d: s.d })),
        currentT,
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
