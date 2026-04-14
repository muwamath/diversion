import { experiments } from '../experiments/registry'
import type { Experiment } from '../experiments/types'

export default function ExperimentList({
  current,
  onSelect,
}: {
  current: string
  onSelect: (experiment: Experiment) => void
}) {
  return (
    <ul className="experiment-list">
      {experiments.map((exp) => (
        <li key={exp.meta.slug}>
          <button
            aria-current={exp.meta.slug === current || undefined}
            onClick={() => onSelect(exp)}
          >
            {exp.meta.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
