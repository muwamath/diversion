import { useRef, useEffect } from 'react'
import type { GyrographConfig } from './schema'
import { drawCurves, drawOverlay, isMechanismVisible } from './draw'
import { walkChain, type Frame } from './chain'

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
  const buffersRef = useRef<Array<Array<{ x: number; y: number }>>>([])
  const tRef = useRef(0)
  const configRef = useRef(config)
  const prevRRef = useRef(config.R)
  const prevKeysRef = useRef<string[]>([])

  useEffect(() => {
    configRef.current = config
  }, [config])

  const segmentKeysJoined = config.segments.map(segmentGeoKey).join('|')

  useEffect(() => {
    const newKeys = config.segments.map(segmentGeoKey)

    while (buffersRef.current.length < config.segments.length) {
      buffersRef.current.push([])
    }
    if (buffersRef.current.length > config.segments.length) {
      buffersRef.current = buffersRef.current.slice(0, config.segments.length)
    }

    if (prevRRef.current !== config.R) {
      buffersRef.current = config.segments.map(() => [])
      prevRRef.current = config.R
      prevKeysRef.current = newKeys
      return
    }

    let firstChanged = -1
    for (let i = 0; i < newKeys.length; i++) {
      if (prevKeysRef.current[i] !== newKeys[i]) {
        firstChanged = i
        break
      }
    }

    if (firstChanged !== -1) {
      for (let i = firstChanged; i < buffersRef.current.length; i++) {
        buffersRef.current[i] = []
      }
    }

    prevKeysRef.current = newKeys
  }, [config.R, segmentKeysJoined, config.segments.length])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let raf: number

    function loop() {
      const cfg = configRef.current
      const dt = 0.05 * cfg.speed
      tRef.current += dt

      const frames: Frame[] = walkChain(
        cfg.R,
        cfg.segments.map((s) => ({ r: s.r, side: s.side, d: s.d })),
        tRef.current,
      )

      while (buffersRef.current.length < cfg.segments.length) {
        buffersRef.current.push([])
      }

      for (let k = 0; k < frames.length; k++) {
        const buf = buffersRef.current[k]
        if (!buf) continue
        buf.push({ x: frames[k].penX, y: frames[k].penY })
        if (cfg.trail > 0 && buf.length > cfg.trail) {
          buffersRef.current[k] = buf.slice(-cfg.trail)
        }
      }

      drawCurves(ctx, cfg, buffersRef.current)

      const visible = isMechanismVisible(mode, cfg.hideLive)
      drawOverlay(ctx, cfg, frames, {
        showArms: cfg.arms && visible,
        showCircles: cfg.circles && visible,
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
      style={{ width, height, display: 'block' }}
    />
  )
}
