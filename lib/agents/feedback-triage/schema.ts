import { z } from 'zod'

/**
 * Enum values are **Danish in both locales**. They are canonical database keys,
 * not display text, and are translated at render time by `lib/i18n/enums.ts`.
 *
 * Translating a stored enum would break eval comparison across locales and
 * corrupt every historical row — see CLAUDE.md, language Layer 2.
 */
export const PRODUKTER = [
  'Sensum One',
  'Uno Ung',
  'Uno STU',
  'SafetyNet',
  'Selvbetjening',
  'SagsKom',
  'Vigilo',
  'Ukendt',
] as const

export const TEMAER = [
  'Brugervenlighed',
  'Dokumentationskvalitet',
  'Integration',
  'Ydeevne',
  'Lovgivning/compliance',
  'Rapportering',
  'Uddannelse/onboarding',
  'Andet',
] as const

export const ALVORLIGHEDER = ['Lav', 'Middel', 'Høj', 'Kritisk'] as const

export const DOMAENER = [
  'VUM 2.0',
  'ICS',
  'Barnets Lov',
  'GDPR',
  'Arbejdsmiljø',
  'Medicinhåndtering',
  'Ingen',
] as const

export const PAAVIRKEDE = [
  'Enkelt bruger',
  'Ét team',
  'Hele kommunen',
  'Flere kommuner',
  'Ukendt',
] as const

export const feedbackTriageOutput = z.object({
  resumé: z.string().max(280).describe('Kort, neutralt referat af hvad henvendelsen handler om'),
  produkt: z.enum(PRODUKTER),
  tema: z.enum(TEMAER),
  alvorlighed: z.enum(ALVORLIGHEDER),
  begrundelse_alvorlighed: z
    .string()
    .describe('Hvorfor netop denne alvorlighed, med henvisning til konkrete forhold i teksten'),
  fagligt_domæne: z.array(z.enum(DOMAENER)),
  påvirkede_brugere: z.enum(PAAVIRKEDE),
  foreslået_user_story: z.object({
    som: z.string(),
    ønsker_jeg: z.string(),
    så_jeg: z.string(),
  }),
  åbne_spørgsmål: z.array(z.string()).max(3),
  /**
   * Deliberate. It forces grounding, and it gives the eval harness a free
   * deterministic check: the quote must be a literal substring of the input.
   * That single line catches most hallucination.
   */
  citat: z.string().describe('Ordret citat fra input der bedst underbygger vurderingen'),
})

export type FeedbackTriageOutput = z.infer<typeof feedbackTriageOutput>

export const feedbackTriageInput = z.string().min(20).max(8000)
export type FeedbackTriageInput = z.infer<typeof feedbackTriageInput>
