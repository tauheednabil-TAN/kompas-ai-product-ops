import type { Locale } from './config'

/**
 * Enum values are stored in Danish as canonical keys and translated **here, at
 * render time**. Never translate a stored enum — it breaks eval comparison
 * across locales and corrupts historical rows (CLAUDE.md, language Layer 2).
 *
 * A key with no English entry falls through to the Danish value, which is the
 * correct behaviour for terms that are genuinely Danish-only ("VUM 2.0",
 * "Barnets Lov", product names).
 */
const EN: Record<string, string> = {
  // Produkt
  Ukendt: 'Unknown',

  // Tema
  Brugervenlighed: 'Usability',
  Dokumentationskvalitet: 'Documentation quality',
  Integration: 'Integration',
  Ydeevne: 'Performance',
  'Lovgivning/compliance': 'Legislation / compliance',
  Rapportering: 'Reporting',
  'Uddannelse/onboarding': 'Training / onboarding',
  Andet: 'Other',

  // Alvorlighed
  Lav: 'Low',
  Middel: 'Medium',
  Høj: 'High',
  Kritisk: 'Critical',

  // Fagligt domæne
  Arbejdsmiljø: 'Working environment',
  Medicinhåndtering: 'Medication handling',
  Ingen: 'None',

  // Påvirkede brugere
  'Enkelt bruger': 'A single user',
  'Ét team': 'One team',
  'Hele kommunen': 'The whole municipality',
  'Flere kommuner': 'Several municipalities',

  // Sagsspejl — samlet vurdering
  Tilstrækkelig: 'Adequate',
  'Kræver justering': 'Needs adjustment',
  Utilstrækkelig: 'Inadequate',

  // Sagsspejl — metode
  'Sundhedsfaglig dokumentation': 'Clinical documentation',

  // Sagsspejl — fundkategorier
  'Manglende borgerperspektiv': "Citizen's own perspective missing",
  'Subjektiv eller værdiladet formulering': 'Subjective or value-laden wording',
  'Stigmatiserende sprogbrug': 'Stigmatising language',
  'Manglende faglig begrundelse': 'No professional justification',
  'Manglende opfølgning eller frist': 'No follow-up or deadline',
  'Uklar ansvarsfordeling': 'Unclear division of responsibility',
  'Oplysninger uden relevans (GDPR)': 'Irrelevant information (GDPR)',
  'Manglende metodefelt': 'Method field missing',

  // Sagsspejl — fundalvorlighed
  Info: 'Info',
  'Bør rettes': 'Should be fixed',
  'Skal rettes': 'Must be fixed',
}

/** Translate a stored (Danish) enum value for display. */
export function enumLabel(value: string, locale: Locale): string {
  if (locale === 'da') return value
  return EN[value] ?? value
}

/**
 * Severity maps onto the semantic colour scale. Kept next to the labels so a new
 * severity value cannot be added without deciding what colour it carries.
 */
export const SEVERITY_TONE = {
  Lav: 'neutral',
  Middel: 'info',
  Høj: 'warn',
  Kritisk: 'danger',
} as const

export const FINDING_TONE = {
  Info: 'info',
  'Bør rettes': 'warn',
  'Skal rettes': 'danger',
} as const

export const VERDICT_TONE = {
  Tilstrækkelig: 'ok',
  'Kræver justering': 'warn',
  Utilstrækkelig: 'danger',
} as const
