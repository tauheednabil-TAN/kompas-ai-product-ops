import type { AgentDefinition } from '../types'
import { v1 } from './prompt.v1'
import { v2 } from './prompt.v2'
import { feedbackTriageInput, feedbackTriageOutput } from './schema'

export const feedbackTriage: AgentDefinition = {
  slug: 'feedback-triage',
  name_da: 'Feedback-triage',
  name_en: 'Feedback triage',
  description_da:
    'Omsætter en rå henvendelse fra en kommune til et struktureret triage-skema med produkt, tema, alvorlighed og et udkast til en user story.',
  description_en:
    'Turns a raw enquiry from a municipality into a structured triage record with product, theme, severity and a draft user story.',

  inputSchema: feedbackTriageInput,
  outputSchema: feedbackTriageOutput,

  versions: [v1, v2],
  defaultVersion: 'v2',

  quoteFields: ['citat'],

  sampleInput: `Hej support

Vi har efter sidste opdatering oplevet, at når en sagsbehandler afslutter en
opfølgning på en § 85-indsats, så gemmes metodefeltet ikke. Det betyder at vi
efterfølgende ikke kan dokumentere, hvilken metode der er anvendt, og det er et krav
i vores kvalitetsstandard.

Vi er ni sagsbehandlere der bruger det dagligt, og vi har indtil videre løst det ved
at skrive metoden ind i den fri tekst i stedet. Det er ikke holdbart, når vi skal
trække ledelsesinformation på tværs.

Kan I sige noget om, hvornår det kan være rettet?

Venlig hilsen
Marianne
Faglig koordinator, Voksen og Handicap`,
}
