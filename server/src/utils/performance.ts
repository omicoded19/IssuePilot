function round(value: number): number {
  return Math.round(value * 100) / 100
}

export function calculateReductionPercent(before: number, after: number): number {
  if (before <= 0) return 0
  return round(((before - after) / before) * 100)
}
