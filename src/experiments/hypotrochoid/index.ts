import type { Experiment } from '../types'
import type { HypotrochoidConfig } from './schema'
import { meta } from './meta'
import { schema } from './schema'
import Controls from './Controls'
import Renderer from './Renderer'

export const hypotrochoid: Experiment<HypotrochoidConfig> = {
  meta,
  schema,
  Controls,
  Renderer,
}
