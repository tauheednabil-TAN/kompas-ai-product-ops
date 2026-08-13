/**
 * Pure statistics, kept out of `runner.ts` because that module is `server-only`
 * and these are worth testing directly.
 */

/**
 * Nearest-rank percentile.
 *
 * With ~20 cases per suite, interpolating between ranks would be false
 * precision — it would report a p95 latency that no run actually had.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const rank = Math.ceil((p / 100) * sorted.length)
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1] ?? 0
}
