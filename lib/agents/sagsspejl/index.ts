import type { AgentDefinition } from '../types'
import { v1 } from './prompt.v1'
import { sagsspejlInput, sagsspejlOutput } from './schema'

export const sagsspejl: AgentDefinition = {
  slug: 'sagsspejl',
  name_da: 'Sagsspejl',
  name_en: 'Case Mirror',
  description_da:
    'Tjekker et sagsnotat mod VUM 2.0, ICS og sundhedsfaglig dokumentationspraksis — form og fuldstændighed, ikke den socialfaglige vurdering.',
  description_en:
    'Checks a case note against VUM 2.0, ICS and clinical documentation practice — form and completeness, not the social-work judgement.',

  inputSchema: sagsspejlInput,
  outputSchema: sagsspejlOutput,

  versions: [v1],
  defaultVersion: 'v1',

  quoteFields: ['fund[].citat'],

  requiresConsent: true,

  sampleInput: `Opfølgning § 85, Borger B

Borger B er fortsat umotiveret og møder ikke op til aftalerne. Han virker
ligeglad med sin egen situation. Undertegnede har forsøgt at kontakte ham tre
gange i denne måned.

Der er en igangværende sag hos jobcenteret, og hans mor har tidligere haft
kontakt til psykiatrien.

Det vurderes, at indsatsen fortsætter uændret.`,
}
