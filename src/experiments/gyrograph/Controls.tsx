import type { GyrographConfig, Segment } from './schema'
import { computeEffectiveTrail } from './effectiveTrail'

const MAX_SEGMENTS = 6
const SEGMENT_PALETTE = ['#7AB6DE', '#ff6b6b', '#6bffaa', '#6bb8ff', '#ffaa3b', '#ff3bc4']

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  disabled?: boolean
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
          disabled={disabled}
          onChange={(e) => {
            const n = Number(e.target.value)
            if (Number.isFinite(n)) onChange(n)
          }}
        />
      </label>
    </div>
  )
}

function CheckboxInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="control-row">
      <label>
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
        {label}
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
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  )
}

function SelectInput<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
}) {
  return (
    <div className="control-row">
      <label>
        {label}
        <select value={value} onChange={(e) => onChange(e.target.value as T)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}

function SegmentSection({
  index,
  total,
  segment,
  onPatch,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  index: number
  total: number
  segment: Segment
  onPatch: (patch: Partial<Segment>) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <div className="segment-section">
      <div className="segment-header">
        <span className="segment-swatch" style={{ background: segment.stroke }} />
        <span className="segment-title">Segment {index + 1}</span>
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={onMoveUp}>
          ↑
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={onMoveDown}
        >
          ↓
        </button>
        <button
          type="button"
          aria-label="Remove segment"
          disabled={total === 1}
          onClick={onRemove}
        >
          ×
        </button>
      </div>
      <NumberInput
        label="Wheel size"
        value={segment.r}
        min={1}
        max={500}
        step={1}
        onChange={(r) => onPatch({ r })}
      />
      <SelectInput<'inside' | 'outside'>
        label="Side"
        value={segment.side}
        options={[
          { value: 'inside', label: 'inside' },
          { value: 'outside', label: 'outside' },
        ]}
        onChange={(side) => onPatch({ side })}
      />
      <NumberInput
        label="Pen arm"
        value={segment.d}
        min={0}
        max={500}
        step={1}
        onChange={(d) => onPatch({ d })}
      />
      <ColorPicker label="Color" value={segment.stroke} onChange={(stroke) => onPatch({ stroke })} />
      <NumberInput
        label="Line width"
        value={segment.width}
        min={0.5}
        max={100}
        step={0.5}
        onChange={(width) => onPatch({ width })}
      />
      <NumberInput
        label="Opacity"
        value={segment.alpha}
        min={0.01}
        max={1}
        step={0.01}
        onChange={(alpha) => onPatch({ alpha })}
      />
      <CheckboxInput
        label="Visible"
        value={segment.visible}
        onChange={(visible) => onPatch({ visible })}
      />
    </div>
  )
}

export default function Controls({
  config,
  onChange,
}: {
  config: GyrographConfig
  onChange: (patch: Partial<GyrographConfig>) => void
}) {
  const patchSegment = (index: number, patch: Partial<Segment>) => {
    const segments = config.segments.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange({ segments })
  }

  const removeSegment = (index: number) => {
    if (config.segments.length === 1) return
    const segments = config.segments.filter((_, i) => i !== index)
    onChange({ segments })
  }

  const moveSegment = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= config.segments.length) return
    const segments = [...config.segments]
    const [moved] = segments.splice(index, 1)
    segments.splice(target, 0, moved)
    onChange({ segments })
  }

  const addSegment = () => {
    if (config.segments.length >= MAX_SEGMENTS) return
    const parentR =
      config.segments.length === 0
        ? config.R
        : config.segments[config.segments.length - 1].r
    const r = Math.max(1, Math.round(parentR / 2))
    const stroke = SEGMENT_PALETTE[config.segments.length % SEGMENT_PALETTE.length]
    const newSeg: Segment = {
      r,
      side: 'inside',
      d: Math.round(r / 2),
      stroke,
      width: 20,
      alpha: 0.15,
      visible: true,
    }
    onChange({ segments: [...config.segments, newSeg] })
  }

  return (
    <div className="controls">
      <section className="controls-globals">
        <h3 className="controls-heading">Globals</h3>
        <NumberInput label="Outer ring" value={config.R} min={20} max={500} step={1} onChange={(R) => onChange({ R })} />
        <NumberInput label="Speed" value={config.speed} min={0.001} max={5} step={0.001} onChange={(speed) => onChange({ speed })} />
        <NumberInput
          label="Max history (sec)"
          value={config.maxHistorySeconds}
          min={1}
          max={1800}
          step={1}
          onChange={(maxHistorySeconds) => onChange({ maxHistorySeconds })}
        />
        <CheckboxInput
          label="Auto-size trail to cycle"
          value={config.autoTrail}
          onChange={(next) => {
            if (next) {
              onChange({ autoTrail: true })
            } else {
              const effective = computeEffectiveTrail(config)
              onChange({ autoTrail: false, trail: effective })
            }
          }}
        />
        <CheckboxInput
          label="Pre-draw one cycle"
          value={config.preDrawCycle}
          onChange={(preDrawCycle) => onChange({ preDrawCycle })}
        />
        <NumberInput
          label="Trail"
          value={config.autoTrail ? computeEffectiveTrail(config) : config.trail}
          min={0}
          max={20000}
          step={50}
          onChange={(trail) => onChange({ trail })}
          disabled={config.autoTrail}
        />
        <ColorPicker label="Background" value={config.bg} onChange={(bg) => onChange({ bg })} />
        <CheckboxInput label="Show arms" value={config.arms} onChange={(arms) => onChange({ arms })} />
        <CheckboxInput label="Show circles" value={config.circles} onChange={(circles) => onChange({ circles })} />
        {(config.arms || config.circles) && (
          <CheckboxInput
            label="Hide mechanism in fullscreen"
            value={config.hideLive}
            onChange={(hideLive) => onChange({ hideLive })}
          />
        )}
      </section>

      <section className="controls-segments">
        <h3 className="controls-heading">Segments</h3>
        {config.segments.map((seg, i) => (
          <SegmentSection
            key={i}
            index={i}
            total={config.segments.length}
            segment={seg}
            onPatch={(patch) => patchSegment(i, patch)}
            onRemove={() => removeSegment(i)}
            onMoveUp={() => moveSegment(i, -1)}
            onMoveDown={() => moveSegment(i, 1)}
          />
        ))}
        <button
          type="button"
          className="add-segment-btn"
          disabled={config.segments.length >= MAX_SEGMENTS}
          onClick={addSegment}
        >
          + Add segment
        </button>
      </section>
    </div>
  )
}
