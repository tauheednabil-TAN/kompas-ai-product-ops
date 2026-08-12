/**
 * Single source of truth for model IDs and pricing.
 *
 * Nothing else in the codebase may hardcode a Gemini model ID or a token price.
 * Research and rationale: docs/models.md (fetched 2026-08-13).
 */

export type ModelTier = 'judge' | 'workhorse' | 'classifier'

/** How thinking/reasoning depth is expressed for a given model family. */
export type ThinkingControl =
  | { kind: 'level'; level: 'minimal' | 'low' | 'medium' | 'high' }
  | { kind: 'budget'; budget: number }
  | { kind: 'none' }

export type ModelSpec = {
  /** Provider model id, passed verbatim to @ai-sdk/google. */
  id: string
  /** USD per 1M input tokens, paid tier, prompts <= 200k tokens. */
  inputPerM: number
  /** USD per 1M output tokens, paid tier, prompts <= 200k tokens. */
  outputPerM: number
  currency: 'USD'
  /**
   * Default reasoning depth. Gemini 3.x exposes `thinkingLevel`; Gemini 2.5
   * exposes a numeric `thinkingBudget`. Encoded here so callers never branch
   * on model family themselves.
   */
  thinking: ThinkingControl
  /** Human-readable justification, surfaced in the UI and the Håndbog. */
  note: string
}

export const MODELS = {
  /**
   * Eval judge. Deterministic grading needs the strongest available reasoning.
   * Deliberately a GA model, not gemini-3.1-pro-preview: a preview id can be
   * withdrawn, and this build has to work on a fixed demo date.
   */
  judge: {
    id: 'gemini-2.5-pro',
    inputPerM: 1.25,
    outputPerM: 10.0,
    currency: 'USD',
    thinking: { kind: 'budget', budget: 4096 },
    note: 'Dommermodel. GA-model med dyb ræsonnering; bevidst ikke en preview-model.',
  },

  /**
   * Every production agent call. Current GA balanced model — best Danish
   * output quality of the stable tiers, and still ~0.03 DKK per run.
   */
  workhorse: {
    id: 'gemini-3.6-flash',
    inputPerM: 1.5,
    outputPerM: 7.5,
    currency: 'USD',
    thinking: { kind: 'level', level: 'low' },
    note: 'Arbejdshest. Alle agentkald i normal drift.',
  },

  /**
   * Cheap tier: DEMO_MODE and any high-volume classification. Roughly 15x
   * cheaper on input than the workhorse.
   */
  classifier: {
    id: 'gemini-2.5-flash-lite',
    inputPerM: 0.1,
    outputPerM: 0.4,
    currency: 'USD',
    thinking: { kind: 'budget', budget: 0 },
    note: 'Billig tier. Bruges i DEMO_MODE, så et delt link ikke kan dræne nøglen.',
  },
} as const satisfies Record<ModelTier, ModelSpec>

/**
 * USD -> DKK. Fixed, documented and dated rather than fetched live: a demo must
 * not depend on an FX API, and a drifting rate would make historical cost rows
 * incomparable across runs.
 *
 * Source: exchange-rates.org, 11 August 2026 (1 USD = 6.4773 DKK).
 */
export const USD_TO_DKK = 6.48
export const USD_TO_DKK_ASOF = '2026-08-11'

/** Resolve the model id actually used for a call, honouring DEMO_MODE. */
export function tierFor(requested: ModelTier, demoMode: boolean): ModelTier {
  if (!demoMode) return requested
  // In demo mode every tier collapses to the cheap model except the judge,
  // which is never invoked from the public UI anyway.
  return requested === 'judge' ? 'judge' : 'classifier'
}

/** Look up a spec by its provider id — used when replaying historical rows. */
export function specById(id: string): ModelSpec | undefined {
  return Object.values(MODELS).find((m) => m.id === id)
}
