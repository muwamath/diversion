export type ResetRange = 'all' | { from: number } | 'none'

export function computeResetRange(
  prevKeys: string[],
  newKeys: string[],
  rChanged: boolean,
): ResetRange {
  if (rChanged) return 'all'
  for (let i = 0; i < newKeys.length; i++) {
    if (prevKeys[i] !== newKeys[i]) return { from: i }
  }
  if (prevKeys.length > newKeys.length) return { from: newKeys.length }
  return 'none'
}
