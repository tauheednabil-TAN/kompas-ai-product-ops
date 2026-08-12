import { MODELS, USD_TO_DKK, specById, type ModelSpec } from './models'

export type TokenUsage = {
  inputTokens: number | undefined
  outputTokens: number | undefined
}

export type CostBreakdown = {
  tokensIn: number
  tokensOut: number
  usd: number
  dkk: number
}

/**
 * Tokens -> DKK.
 *
 * The AI SDK types both token counts as `number | undefined` (a provider may
 * omit them). We coerce to 0 rather than throwing: a missing count must not
 * lose the audit row, and a 0-cost row is visibly wrong in the audit log, which
 * is the behaviour we want.
 */
export function computeCost(spec: ModelSpec, usage: TokenUsage): CostBreakdown {
  const tokensIn = usage.inputTokens ?? 0
  const tokensOut = usage.outputTokens ?? 0
  const usd = (tokensIn / 1_000_000) * spec.inputPerM + (tokensOut / 1_000_000) * spec.outputPerM
  return {
    tokensIn,
    tokensOut,
    usd,
    dkk: usd * USD_TO_DKK,
  }
}

/** Same, but resolving the spec from a stored model id (audit-log replay). */
export function computeCostById(modelId: string, usage: TokenUsage): CostBreakdown {
  const spec = specById(modelId) ?? MODELS.workhorse
  return computeCost(spec, usage)
}

/**
 * DKK formatting for the UI. Agent runs cost fractions of an øre, so a plain
 * 2-decimal currency format would render every row as "0,00 kr." — useless.
 * Below 1 krone we show 4 decimals; above, 2.
 */
export function formatDkk(dkk: number, locale: 'da' | 'en'): string {
  const tag = locale === 'da' ? 'da-DK' : 'en-DK'
  const digits = Math.abs(dkk) < 1 ? 4 : 2
  return new Intl.NumberFormat(tag, {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(dkk)
}
