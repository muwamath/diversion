import { useParams, useNavigate } from 'react-router-dom'
import { useMemo, useRef, useEffect, useState } from 'react'
import { findExperiment } from '../experiments/registry'
import { useExperimentConfig } from '../hooks/useExperimentConfig'
import ExperimentList from '../components/ExperimentList'
import ShareBar from '../components/ShareBar'
import type { Experiment } from '../experiments/types'
import '../styles/layout.css'

function ExperimentPanel({
  experiment,
  onSelect,
}: {
  experiment: Experiment
  onSelect: (exp: Experiment) => void
}) {
  const [config, updateConfig] = useExperimentConfig(experiment)
  const previewRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = previewRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width: Math.floor(width), height: Math.floor(height) })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const Controls = experiment.Controls
  const Renderer = experiment.Renderer

  return (
    <>
      <div className="sidebar">
        <ExperimentList current={experiment.meta.slug} onSelect={onSelect} />
        <Controls config={config} onChange={updateConfig} />
        <ShareBar slug={experiment.meta.slug} />
      </div>
      <div className="preview" ref={previewRef}>
        {size.width > 0 && (
          <Renderer config={config} width={size.width} height={size.height} mode="edit" />
        )}
      </div>
    </>
  )
}

export default function Edit() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const experiment = useMemo(() => findExperiment(slug ?? ''), [slug])

  if (!experiment) {
    return <div className="home">Unknown experiment: {slug}</div>
  }

  const handleSelect = (exp: Experiment) => {
    const params = exp.schema.stringify(exp.schema.defaults)
    navigate(`/${exp.meta.slug}/edit?${params.toString()}`)
  }

  return (
    <div className="home">
      <ExperimentPanel
        key={experiment.meta.slug}
        experiment={experiment}
        onSelect={handleSelect}
      />
    </div>
  )
}
