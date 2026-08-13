import { z } from 'zod'

/** Canonical Danish keys. Translated at render time, never in the database. */
export const SAMLEDE_VURDERINGER = ['Tilstrækkelig', 'Kræver justering', 'Utilstrækkelig'] as const

export const METODER = ['VUM 2.0', 'ICS', 'Sundhedsfaglig dokumentation'] as const

export const FUND_KATEGORIER = [
  'Manglende borgerperspektiv',
  'Subjektiv eller værdiladet formulering',
  'Stigmatiserende sprogbrug',
  'Manglende faglig begrundelse',
  'Manglende opfølgning eller frist',
  'Uklar ansvarsfordeling',
  'Oplysninger uden relevans (GDPR)',
  'Manglende metodefelt',
] as const

export const FUND_ALVORLIGHEDER = ['Info', 'Bør rettes', 'Skal rettes'] as const

export const sagsspejlOutput = z.object({
  samlet_vurdering: z.enum(SAMLEDE_VURDERINGER),
  metode: z.enum(METODER),
  fund: z.array(
    z.object({
      kategori: z.enum(FUND_KATEGORIER),
      alvorlighed: z.enum(FUND_ALVORLIGHEDER),
      citat: z.string().describe('Ordret uddrag fra notatet'),
      begrundelse: z.string(),
      forslag: z.string().describe('Konkret omskrivningsforslag'),
    }),
  ),
  manglende_felter: z.array(z.string()),
  /**
   * `.min(1)` is an adoption decision expressed as a schema constraint.
   *
   * A tool that only criticises is a tool people stop opening. Forcing at least
   * one genuine strength costs the model almost nothing and changes whether a
   * caseworker uses this twice.
   */
  styrker: z.array(z.string()).min(1).describe('Hvad er godt ved notatet'),
})

export type SagsspejlOutput = z.infer<typeof sagsspejlOutput>

export const sagsspejlInput = z.string().min(40).max(8000)
