import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { findExperiment } from '../experiments/registry'
import '../styles/layout.css'

export default function Show() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const experiment = findExperiment(slug ?? '')
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [cursorVisible, setCursorVisible] = useState(true)
  const timerRef = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Hide cursor after idle
  useEffect(() => {
    const show = () => {
      setCursorVisible(true)
      clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setCursorVisible(false), 2000)
    }
    show()
    window.addEventListener('mousemove', show)
    return () => {
      window.removeEventListener('mousemove', show)
      clearTimeout(timerRef.current)
    }
  }, [])

  // Escape to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const params = new URLSearchParams(searchParams)
        params.set('experiment', slug ?? '')
        navigate(`/?${params.toString()}`)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, searchParams, slug])

  if (!experiment) {
    return <div>Unknown experiment: {slug}</div>
  }

  const config = experiment.schema.parse(searchParams)
  const Renderer = experiment.Renderer

  return (
    <div
      ref={containerRef}
      className={`show-fullscreen ${cursorVisible ? 'cursor-visible' : ''}`}
    >
      {size.width > 0 && (
        <Renderer config={config} width={size.width} height={size.height} />
      )}
    </div>
  )
}
