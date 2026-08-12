import 'server-only'

import { google } from '@ai-sdk/google'
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google'
import { MODELS, tierFor, type ModelSpec, type ModelTier } from './models'

export const REQUEST_TIMEOUT_MS = 60_000

/**
 * Two retries with exponential backoff, delegated to the AI SDK rather than
 * hand-rolled. The SDK already retries only on retryable statuses (429, 5xx) and
 * respects `retry-after`; reimplementing that would be worse code and worse
 * behaviour.
 */
export const MAX_RETRIES = 2

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true'
}

export type ResolvedModel = {
  spec: ModelSpec
  model: ReturnType<typeof google>
  providerOptions: { google: GoogleGenerativeAIProviderOptions }
}

/**
 * Resolve a tier to a concrete model plus its provider options.
 *
 * The two Gemini families express reasoning depth differently — 3.x takes a
 * `thinkingLevel`, 2.5 takes a numeric `thinkingBudget` — so `ModelSpec.thinking`
 * is a tagged union and the branch lives here, once, instead of at every call
 * site.
 */
export function resolveModel(tier: ModelTier): ResolvedModel {
  const spec = MODELS[tierFor(tier, isDemoMode())]

  const thinkingConfig =
    spec.thinking.kind === 'level'
      ? { thinkingLevel: spec.thinking.level }
      : spec.thinking.kind === 'budget'
        ? { thinkingBudget: spec.thinking.budget }
        : undefined

  return {
    spec,
    model: google(spec.id),
    providerOptions: {
      google: {
        ...(thinkingConfig ? { thinkingConfig } : {}),
        /**
         * The domain is Danish municipal casework: self-harm, substance abuse,
         * child protection and medication handling are the *subject matter*.
         * Default safety thresholds refuse legitimate professional input here.
         * BLOCK_ONLY_HIGH keeps a genuine floor while letting the tool do its
         * job. This is a considered trade-off, not a blanket disable — note it
         * is not set to OFF or BLOCK_NONE.
         */
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        ],
      },
    },
  }
}

/** True when a key is present. Used to fail fast before wasting a request. */
export function hasApiKey(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}
