import type { z } from 'zod'
import type { Locale } from '@/lib/i18n/config'
import type { ModelTier } from '@/lib/ai/models'

/**
 * A prompt is a **file**, and a version is a value.
 *
 * This is the architectural centrepiece: every run records which version
 * produced it, so the eval comparison view can diff two versions and the claim
 * "our AI output got better" becomes a measurement rather than an opinion.
 * Nothing here may be collapsed for convenience.
 */
export type PromptVersion = {
  /** Stable identifier stored on every run. Never reused, never edited. */
  version: string
  /** What changed relative to the previous version, and why. Shown in the diff. */
  notes_da: string
  notes_en: string
  tier: ModelTier
  temperature: number
  /**
   * The system prompt. Takes the locale explicitly — never a global, never
   * inferred — and must state the output-language instruction at both the top
   * and the bottom (models drift to English otherwise).
   */
  system: (locale: Locale) => string
  /** The user message. */
  build: (input: string, locale: Locale) => string
}

/**
 * Not generic over the input type.
 *
 * Every agent in Kompas takes free text — a support ticket, a case note, a list
 * of PR descriptions, a piece of regulation. Making the input generic would
 * force `any` into the registry (contravariance means `PromptVersion<string>` is
 * not a `PromptVersion<unknown>`), and `any` is a C5 violation. The input schema
 * still constrains length and shape; it just constrains a string.
 */
export type AgentDefinition = {
  slug: string
  name_da: string
  name_en: string
  description_da: string
  description_en: string

  inputSchema: z.ZodType<string>
  outputSchema: z.ZodType<unknown>

  versions: readonly PromptVersion[]
  defaultVersion: string

  /**
   * Paths of output fields that must be a **literal substring of the input**.
   *
   * Cheap, deterministic anti-hallucination: if the model claims a quote, the
   * quote has to actually be there. Supports `field` and `array[].field`.
   */
  quoteFields: readonly string[]

  /** An example input, so the agent page is never a blank box. */
  sampleInput: string

  /**
   * When true, the run route refuses without an explicit per-session consent
   * flag. Used by Sagsspejl, where the input is free-text case documentation.
   *
   * This lives on the agent rather than in a second route handler on purpose:
   * duplicating the streaming, guard and telemetry pipeline would let what the
   * eval harness measures drift away from what users actually get.
   */
  requiresConsent?: boolean
}

export function findVersion(
  versions: readonly PromptVersion[],
  version: string | undefined,
  fallback: string,
): PromptVersion | undefined {
  return versions.find((v) => v.version === (version ?? fallback))
}

/**
 * The instruction repeated at the top and bottom of every system prompt.
 * One definition so no version can drift on the single thing that must not vary.
 */
export function languageInstruction(locale: Locale): string {
  return locale === 'da'
    ? 'Du skal svare udelukkende på dansk. Alt fritekstindhold i dit svar skal være på dansk.'
    : 'You must answer exclusively in English. All free-text content in your response must be in English.'
}
