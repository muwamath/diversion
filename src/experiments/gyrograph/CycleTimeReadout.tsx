import type { GyrographConfig } from './schema'
import { cycleTimeSeconds, formatCycleTime } from './cycleTime'

export default function CycleTime({ config }: { config: GyrographConfig }) {
  const seconds = cycleTimeSeconds(config)
  return (
    <div className="cycle-time">
      <span className="cycle-time-label">Cycle</span>
      <span className="cycle-time-value">{formatCycleTime(seconds)}</span>
    </div>
  )
}
