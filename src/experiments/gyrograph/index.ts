import type { Experiment } from '../types'
import type { GyrographConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'
import CycleTimeReadout from './CycleTimeReadout'

export const gyrograph: Experiment<GyrographConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
  TopBar: CycleTimeReadout,
}
