import type { Locale } from '@/lib/i18n/config'

/**
 * Version-over-version comparison.
 *
 * Deliberately pure: it takes two arrays of per-case results and returns a
 * verdict, with no database and no model involved. That makes the single most
 * argued-over screen in the app fully testable, which matters because the whole
 * project rests on this number being believable.
 */

export type CaseResult = {
  externalId: string
  passed: boolean
  meanScore: number
  costDkk: number
  latencyMs: number
  unstable: boolean
  failedChecks: string[]
}

export type RunSummary = {
  promptVersion: string
  results: CaseResult[]
  judgeTrustworthy: boolean
}

export type CaseDelta = {
  externalId: string
  a: CaseResult | undefined
  b: CaseResult | undefined
  scoreDelta: number
  /** 'gained' = started passing, 'lost' = started failing, 'same' = no change. */
  passChange: 'gained' | 'lost' | 'same'
  bucket: 'forbedret' | 'forvaerret' | 'uaendret'
}

/**
 * A fifth of a point on a 1–5 scale.
 *
 * Below this, a "change" is judge noise rather than signal — the judge's own
 * spread across three passes is frequently this large. Calling that an
 * improvement would be exactly the kind of vibes-based claim this harness exists
 * to replace.
 */
export const SCORE_NOISE_FLOOR = 0.2

export type Comparison = {
  a: { version: string; passRate: number; meanScore: number; totalCostDkk: number; p50LatencyMs: number }
  b: { version: string; passRate: number; meanScore: number; totalCostDkk: number; p50LatencyMs: number }
  passRateDeltaPp: number
  meanScoreDelta: number
  costDeltaPct: number | null
  latencyDeltaPct: number | null
  improved: CaseDelta[]
  regressed: CaseDelta[]
  unchanged: CaseDelta[]
  judgeTrustworthy: boolean
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / values.length
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((x, y) => x - y)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
    : (sorted[middle] ?? 0)
}

function pctChange(from: number, to: number): number | null {
  // A zero baseline has no meaningful percentage change; say so rather than
  // rendering Infinity.
  if (from === 0) return null
  return ((to - from) / from) * 100
}

function summarise(run: RunSummary) {
  return {
    version: run.promptVersion,
    passRate: run.results.length === 0 ? 0 : run.results.filter((r) => r.passed).length / run.results.length,
    meanScore: mean(run.results.map((r) => r.meanScore)),
    totalCostDkk: run.results.reduce((sum, r) => sum + r.costDkk, 0),
    p50LatencyMs: median(run.results.map((r) => r.latencyMs)),
  }
}

export function compareRuns(runA: RunSummary, runB: RunSummary): Comparison {
  const byIdA = new Map(runA.results.map((r) => [r.externalId, r]))
  const byIdB = new Map(runB.results.map((r) => [r.externalId, r]))
  const ids = [...new Set([...byIdA.keys(), ...byIdB.keys()])].sort()

  const deltas: CaseDelta[] = ids.map((externalId) => {
    const a = byIdA.get(externalId)
    const b = byIdB.get(externalId)
    const scoreDelta = (b?.meanScore ?? 0) - (a?.meanScore ?? 0)

    const passChange: CaseDelta['passChange'] =
      a?.passed === b?.passed ? 'same' : b?.passed ? 'gained' : 'lost'

    // A pass/fail flip always dominates: it is the outcome that actually
    // matters, regardless of how the underlying score moved.
    const bucket: CaseDelta['bucket'] =
      passChange === 'gained'
        ? 'forbedret'
        : passChange === 'lost'
          ? 'forvaerret'
          : scoreDelta > SCORE_NOISE_FLOOR
            ? 'forbedret'
            : scoreDelta < -SCORE_NOISE_FLOOR
              ? 'forvaerret'
              : 'uaendret'

    return { externalId, a, b, scoreDelta, passChange, bucket }
  })

  const summaryA = summarise(runA)
  const summaryB = summarise(runB)

  // Sorted by magnitude of change: the most interesting rows first, which is the
  // opposite of alphabetical and the reason this screen is readable at all.
  const bySeverity = (x: CaseDelta, y: CaseDelta) => Math.abs(y.scoreDelta) - Math.abs(x.scoreDelta)

  return {
    a: summaryA,
    b: summaryB,
    passRateDeltaPp: (summaryB.passRate - summaryA.passRate) * 100,
    meanScoreDelta: summaryB.meanScore - summaryA.meanScore,
    costDeltaPct: pctChange(summaryA.totalCostDkk, summaryB.totalCostDkk),
    latencyDeltaPct: pctChange(summaryA.p50LatencyMs, summaryB.p50LatencyMs),
    improved: deltas.filter((d) => d.bucket === 'forbedret').sort(bySeverity),
    regressed: deltas.filter((d) => d.bucket === 'forvaerret').sort(bySeverity),
    unchanged: deltas.filter((d) => d.bucket === 'uaendret').sort(bySeverity),
    judgeTrustworthy: runA.judgeTrustworthy && runB.judgeTrustworthy,
  }
}

/**
 * The one-line verdict at the top of the comparison.
 *
 * States the trade-off in one sentence, including the bad half. A verdict that
 * only reports the improvement is marketing, not measurement.
 */
export function verdictLine(comparison: Comparison, locale: Locale): string {
  const pct = (value: number) => `${Math.round(value * 100)}%`
  const pp = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}pp`

  const { a, b, passRateDeltaPp, costDeltaPct } = comparison

  if (!comparison.judgeTrustworthy) {
    return locale === 'da'
      ? 'Dommeren bestod ikke kalibreringen i mindst én af kørslerne. Tallene nedenfor er ikke til at stole på.'
      : 'The judge failed calibration in at least one of these runs. The numbers below are not trustworthy.'
  }

  const direction =
    passRateDeltaPp > 0
      ? locale === 'da'
        ? 'hæver'
        : 'raises'
      : passRateDeltaPp < 0
        ? locale === 'da'
          ? 'sænker'
          : 'lowers'
        : locale === 'da'
          ? 'ændrer ikke'
          : 'does not change'

  const head =
    locale === 'da'
      ? `${b.version} ${direction} bestået-raten fra ${pct(a.passRate)} til ${pct(b.passRate)} (${pp(passRateDeltaPp)})`
      : `${b.version} ${direction} the pass rate from ${pct(a.passRate)} to ${pct(b.passRate)} (${pp(passRateDeltaPp)})`

  if (costDeltaPct === null || Math.abs(costDeltaPct) < 1) {
    return `${head}${locale === 'da' ? ', til stort set samme pris.' : ', at roughly the same cost.'}`
  }

  const costWord =
    costDeltaPct > 0
      ? locale === 'da'
        ? `men koster ${Math.abs(costDeltaPct).toFixed(0)} % mere pr. kørsel.`
        : `but costs ${Math.abs(costDeltaPct).toFixed(0)}% more per run.`
      : locale === 'da'
        ? `og koster ${Math.abs(costDeltaPct).toFixed(0)} % mindre pr. kørsel.`
        : `and costs ${Math.abs(costDeltaPct).toFixed(0)}% less per run.`

  return `${head}, ${costWord}`
}
