const DEFAULT_FPS = 60
const SAMPLE_COUNT = 30

let measuredFps = DEFAULT_FPS
let measurementStarted = false
let subscribers: Array<(fps: number) => void> = []

export function getMeasuredFps(): number {
  return measuredFps
}

export function subscribeFps(fn: (fps: number) => void): () => void {
  subscribers.push(fn)
  ensureMeasurement()
  return () => {
    subscribers = subscribers.filter((s) => s !== fn)
  }
}

export function ensureMeasurement(): void {
  if (measurementStarted || typeof window === 'undefined') return
  measurementStarted = true

  const intervals: number[] = []
  let last = 0

  const tick = (now: number) => {
    if (last > 0) intervals.push(now - last)
    last = now
    if (intervals.length < SAMPLE_COUNT) {
      requestAnimationFrame(tick)
      return
    }
    // Drop the first sample; it may include layout/mount noise.
    intervals.shift()
    const avgMs = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const raw = 1000 / avgMs
    // Snap to common display rates for stability.
    const candidates = [60, 75, 90, 120, 144, 165, 240]
    let best = candidates[0]
    let bestDelta = Math.abs(raw - best)
    for (const c of candidates) {
      const d = Math.abs(raw - c)
      if (d < bestDelta) {
        best = c
        bestDelta = d
      }
    }
    measuredFps = best
    const snapshot = subscribers.slice()
    for (const fn of snapshot) fn(best)
  }

  requestAnimationFrame(tick)
}
