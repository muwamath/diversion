import type { GyrographConfig } from './schema'

export const defaults: GyrographConfig = {
  R: 200,
  bg: '#0a0a0a',
  speed: 0.1,
  trail: 2000,
  arms: false,
  circles: false,
  hideLive: true,
  segments: [
    {
      r: 60,
      side: 'inside',
      d: 80,
      stroke: '#aa3bff',
      width: 2,
      alpha: 0.15,
      visible: true,
    },
  ],
}
