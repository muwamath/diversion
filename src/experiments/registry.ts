import type { Experiment } from './types'
import { hypotrochoid } from './hypotrochoid'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const experiments: Experiment<any>[] = [hypotrochoid]

export function findExperiment(slug: string) {
  return experiments.find((e) => e.meta.slug === slug)
}
