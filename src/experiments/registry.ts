import type { Experiment } from './types'
import { gyrograph } from './gyrograph'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const experiments: Experiment<any>[] = [gyrograph]

export function findExperiment(slug: string) {
  return experiments.find((e) => e.meta.slug === slug)
}
