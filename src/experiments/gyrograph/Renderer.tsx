import { useRef, useEffect } from 'react'
import type { HypotrochoidConfig } from './schema'
import { drawHypotrochoid, computePoint } from './draw'

export default function Renderer({
  config,
  width,
  height,
  mode = 'edit',
}: {
  config: HypotrochoidConfig
  width: number
  height: number
  mode?: 'edit' | 'live'
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Array<{ x: number; y: number }>>([])
  const tRef = useRef(0)
  const configRef = useRef(config)

  // Sync config ref in an effect to avoid writing refs during render
  useEffect(() => {
    configRef.current = config
  }, [config])

  // Reset points when geometry changes
  const geoKey = `${config.R}-${config.r}-${config.d}`
  useEffect(() => {
    pointsRef.current = []
    tRef.current = 0
  }, [geoKey])

  // rAF loop — reads configRef each frame so it never restarts on config
  // changes, preserving accumulated trail points.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!

    let raf: number

    function loop() {
      const cfg = configRef.current
      const dt = 0.05 * cfg.speed
      tRef.current += dt

      const pt = computePoint(cfg, tRef.current)
      pointsRef.current.push(pt)

      // Trim trail
      if (cfg.trail > 0 && pointsRef.current.length > cfg.trail) {
        pointsRef.current = pointsRef.current.slice(-cfg.trail)
      }

      const visible = mode === 'edit' || !cfg.hideLive
      const showArms = cfg.arms && visible
      const showCircles = cfg.circles && visible
      drawHypotrochoid(ctx, cfg, pointsRef.current, {
        t: tRef.current,
        showArms,
        showCircles,
      })
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
      style={{
        width,
        height,
        display: 'block',
      }}
    />
  )
}
