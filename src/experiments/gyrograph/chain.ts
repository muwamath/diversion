export interface SegmentGeometry {
  r: number
  side: 'inside' | 'outside'
  d: number
}

export interface Frame {
  cx: number
  cy: number
  orientation: number
  penX: number
  penY: number
}

export function walkChain(
  R: number,
  segments: SegmentGeometry[],
  t: number,
): Frame[] {
  const frames: Frame[] = []

  let parentCx = 0
  let parentCy = 0
  let parentRadius = R
  let parentOrientation = t

  for (const seg of segments) {
    const sign = seg.side === 'inside' ? -1 : 1
    const orbitRadius = parentRadius + sign * seg.r
    const cx = parentCx + orbitRadius * Math.cos(parentOrientation)
    const cy = parentCy + orbitRadius * Math.sin(parentOrientation)

    let orientation: number
    if (seg.side === 'inside') {
      orientation = -((parentRadius - seg.r) / seg.r) * parentOrientation
    } else {
      orientation = ((parentRadius + seg.r) / seg.r) * parentOrientation + Math.PI
    }

    const penX = cx + seg.d * Math.cos(orientation)
    const penY = cy + seg.d * Math.sin(orientation)

    frames.push({ cx, cy, orientation, penX, penY })

    parentCx = cx
    parentCy = cy
    parentRadius = seg.r
    parentOrientation = orientation
  }

  return frames
}
