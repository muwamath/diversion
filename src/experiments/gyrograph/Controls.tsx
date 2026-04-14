import type { HypotrochoidConfig } from './schema'

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(n)
          }}
        />
      </label>
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}

export default function Controls({
  config,
  onChange,
}: {
  config: HypotrochoidConfig
  onChange: (patch: Partial<HypotrochoidConfig>) => void
}) {
  return (
    <div className="controls">
      <NumberInput label="R (outer)" value={config.R} min={20} max={300} step={1} onChange={(R) => onChange({ R })} />
      <NumberInput label="r (inner)" value={config.r} min={5} max={150} step={1} onChange={(r) => onChange({ r })} />
      <NumberInput label="d (pen offset)" value={config.d} min={0} max={200} step={1} onChange={(d) => onChange({ d })} />
      <NumberInput label="Speed" value={config.speed} min={0.1} max={5} step={0.1} onChange={(speed) => onChange({ speed })} />
      <NumberInput label="Trail" value={config.trail} min={0} max={5000} step={50} onChange={(trail) => onChange({ trail })} />
      <NumberInput label="Line width" value={config.width} min={0.5} max={5} step={0.1} onChange={(width) => onChange({ width })} />
      <NumberInput label="Alpha" value={config.alpha} min={0.01} max={1} step={0.01} onChange={(alpha) => onChange({ alpha })} />
      <ColorPicker label="Stroke" value={config.stroke} onChange={(stroke) => onChange({ stroke })} />
      <ColorPicker label="Background" value={config.bg} onChange={(bg) => onChange({ bg })} />
    </div>
  )
}
