import type { GyrographConfig } from './schema'
import { SAMPLES_PER_CYCLE } from './cycleBuffer'

export const defaults: GyrographConfig = {
  R: 199,
  bg: '#0a0a0a',
  speed: 1,
  trail: SAMPLES_PER_CYCLE,
  zenDraw: false,
  arms: false,
  circles: false,
  hideLive: true,
  segments: [
    {
      r: 60,
      side: 'inside',
      d: 80,
      stroke: '#7AB6DE',
      width: 20,
      alpha: 0.15,
      visible: true,
    },
  ],
}
