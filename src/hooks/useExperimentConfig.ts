import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'
import type { Experiment } from '../experiments/types'

export function useExperimentConfig<T>(experiment: Experiment<T>) {
  const [searchParams, setSearchParams] = useSearchParams()

  const config = useMemo(
    () => experiment.schema.parse(searchParams),
    [experiment, searchParams],
  )

  const updateConfig = useCallback(
    (patch: Partial<T>) => {
      const next = { ...config, ...patch }
      const params = experiment.schema.stringify(next)
      setSearchParams(params, { replace: true })
    },
    [config, experiment, setSearchParams],
  )

  return [config, updateConfig] as const
}
