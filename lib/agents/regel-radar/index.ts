import { z } from 'zod'
import { languageInstruction, type AgentDefinition, type PromptVersion } from '../types'

export const PRODUKTER = [
  'Sensum One',
  'Uno Ung',
  'Uno STU',
  'SafetyNet',
  'Selvbetjening',
  'SagsKom',
  'Vigilo',
] as const

export const RISIKONIVEAUER = ['Ingen', 'Lav', 'Middel', 'Høj', 'Kritisk'] as const

export const regelRadarOutput = z.object({
  /** Stated once at the top of every output. This is not legal advice. */
  forbehold: z.string(),

  kilde_type: z.enum(['Lov', 'Bekendtgørelse', 'Vejledning', 'Strategi', 'Udkast i høring', 'Ukendt']),
  ikrafttrædelse: z.string().describe('Dato, eller "ikke angivet" hvis den ikke fremgår'),

  konsekvenser: z
    .array(
      z.object({
        produkt: z.enum(PRODUKTER),
        risikoniveau: z.enum(RISIKONIVEAUER),
        hvad_ændrer_sig: z.string().describe('I almindeligt dansk, uden paragrafhenvisninger'),
        berørte_flows: z.array(z.string()),
        udkast_til_user_stories: z
          .array(z.object({ som: z.string(), ønsker_jeg: z.string(), så_jeg: z.string() }))
          .max(3),
        frist: z.string(),
        kilde_citat: z.string().describe('Ordret uddrag fra kildeteksten'),
      }),
    )
    .min(1),

  /**
   * Uncertainty is surfaced, not smoothed over. A confident wrong reading of a
   * regulation is far more expensive than an acknowledged gap.
   */
  åbne_spørgsmål: z.array(z.string()),
})

const v1: PromptVersion = {
  version: 'v1',
  notes_da:
    'Første version. Skelner mellem "skal" og "bør", og kræver ordret kildecitat pr. konsekvens.',
  notes_en:
    'First version. Distinguishes obligations from intentions, and requires a verbatim source quote per consequence.',
  tier: 'workhorse',
  temperature: 0.1,

  system: (locale) => `${languageInstruction(locale)}

Du analyserer regulering for produktteamet i EG Digital Welfare, som leverer
fagsystemer til danske og norske kommuner.

Formålet er at komme fra "der er kommet noget nyt" til "her er de ting, vi skal
beslutte" — uden at nogen skal læse hele teksten.

## Det vigtigste forbehold

**Dette er ikke juridisk rådgivning.** Skriv det i feltet "forbehold", hver gang,
med egne ord. Analysen er et udgangspunkt for en samtale med en jurist, ikke en
konklusion.

Konkludér aldrig, at noget er lovligt eller ulovligt. Beskriv i stedet, hvad
reglen kræver, og hvad det betyder for et system.

## Sådan arbejder du

1. Find ikrafttrædelsesdatoen først. Alt andet prioriteres i forhold til den.
   Står der ingen dato, så skriv "ikke angivet". Opfind aldrig en frist.
2. Læs efter **forpligtelser, ikke hensigter**. "Skal" udløser en ændring.
   "Bør", "kan" og "det anbefales" gør ikke — nævn dem højst som åbne spørgsmål.
3. Afgør for hver forpligtelse, hvilke produkter den rammer. Rammer den intet,
   så sig det: "ingen konsekvens" er et gyldigt og nyttigt resultat.
4. Skriv kilde_citat **ordret** af. Kopiér tegn for tegn. Et citat, der skal
   bruges som belæg, må aldrig omskrives.
5. Marker enhver konklusion, du ikke er sikker på, som et åbent spørgsmål frem
   for at udglatte den.

## Risikoniveau

- **Kritisk** — en lovpligtig forpligtelse kan ikke opfyldes med systemet som det er, og fristen er nær.
- **Høj** — kræver udvikling før fristen.
- **Middel** — kræver ændring, men der er tid, eller der findes en holdbar manuel proces.
- **Lav** — mindre justering eller afklaring.
- **Ingen** — produktet er ikke berørt.

Er kilden et udkast i høring, så vælg kilde_type "Udkast i høring" og nedjustér
risikoniveauet ét trin: udkast ændrer sig.

Bemærk: enum-værdier er faste danske nøgler og skal altid vælges på dansk, uanset
hvilket sprog du i øvrigt skriver på.

${languageInstruction(locale)}`,

  build: (input) => `Analysér følgende regulering:

---
${input}
---`,
}

export const regelRadar: AgentDefinition = {
  slug: 'regel-radar',
  name_da: 'Regel-radar',
  name_en: 'Regulation radar',
  description_da:
    'Omsætter lovtekst, bekendtgørelse eller strategi til konkrete konsekvenser pr. produkt med udkast til user stories og ordret kildecitat.',
  description_en:
    'Turns legislation, a statutory order or a strategy into concrete per-product consequences with draft user stories and a verbatim source quote.',

  inputSchema: z.string().min(40).max(8000),
  outputSchema: regelRadarOutput,

  quoteFields: ['konsekvenser[].kilde_citat'],

  versions: [v1],
  defaultVersion: 'v1',

  sampleInput: `Uddrag, forordning om kunstig intelligens (EU) 2024/1689, bilag III

Følgende AI-systemer betragtes som højrisiko, jf. artikel 6, stk. 2:

5. Adgang til og benyttelse af væsentlige private og offentlige tjenester og
ydelser:

a) AI-systemer, der er tilsigtet anvendt af offentlige myndigheder eller på
vegne af offentlige myndigheder til at evaluere fysiske personers berettigelse
til væsentlige offentlige bistandsydelser og -tjenester, herunder
sundhedsydelser, samt til at tildele, indskrænke, tilbagekalde eller kræve
tilbagebetaling af sådanne ydelser og tjenester.

Udbydere af højrisiko-AI-systemer skal sikre, at systemet er udformet og udviklet
på en sådan måde, at fysiske personer kan føre effektivt tilsyn med systemet,
mens det er i brug.`,
}
