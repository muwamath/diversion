import type { ComponentType } from 'react'

export interface ExperimentMeta {
  slug: string
  name: string
  description: string
}

export interface ExperimentSchema<T> {
  defaults: T
  parse(params: URLSearchParams): T
  stringify(config: T): URLSearchParams
}

export interface Experiment<T = Record<string, unknown>> {
  meta: ExperimentMeta
  schema: ExperimentSchema<T>
  Controls: ComponentType<{ config: T; onChange: (patch: Partial<T>) => void }>
  Renderer: ComponentType<{
    config: T
    width: number
    height: number
    mode?: 'edit' | 'live'
  }>
  TopBar?: ComponentType<{ config: T }>
}
