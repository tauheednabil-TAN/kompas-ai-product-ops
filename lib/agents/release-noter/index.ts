import { z } from 'zod'
import { languageInstruction, type AgentDefinition, type PromptVersion } from '../types'

const section = z.object({
  overskrift: z.string(),
  punkter: z.array(z.string()).min(1),
})

export const releaseNoterOutput = z.object({
  version_titel: z.string().max(120),

  /** Customer-facing, grouped by what the user can now do — never by commit type. */
  kundevendte_noter: z.array(section).min(1),

  /** Internal changelog: technical, terse, grouped by area. */
  intern_changelog: z.array(section),

  /** Three bullets on the questions support will actually get next week. */
  det_skal_support_vide: z.array(z.string()).min(1).max(3),

  /** Changes deliberately left out because a user cannot feel them. */
  udeladt: z.array(z.string()),

  /**
   * Per-section anglicism flag. A boolean the model has to commit to is a much
   * stronger prompt than "please avoid anglicisms" buried in prose, and it gives
   * the eval harness something deterministic to look at.
   */
  sprogtjek: z.object({
    kundevendte_noter_rent_dansk: z.boolean(),
    det_skal_support_vide_rent_dansk: z.boolean(),
    fundne_anglicismer: z.array(z.string()),
  }),
})

const v1: PromptVersion = {
  version: 'v1',
  notes_da: 'Første version. Grupperer efter arbejdsområde frem for commit-type.',
  notes_en: 'First version. Groups by work area rather than commit type.',
  tier: 'workhorse',
  temperature: 0.2,

  system: (locale) => `${languageInstruction(locale)}

Du skriver release notes for EG Digital Welfare til danske og norske kommuner.

Læseren er en sagsbehandler eller en teamleder. Vedkommende skal kunne læse noten
og forstå, hvad der er anderledes i dag, uden at kende et eneste teknisk begreb.

## Sådan arbejder du

1. Kassér alt, brugeren ikke kan mærke: refaktorering, opgraderinger af
   afhængigheder, testændringer, oprydning, CI. Skriv dem i feltet "udeladt", så
   det er synligt, at de er fravalgt og ikke overset.
2. Oversæt hver tilbageværende ændring til den **handling, den muliggør**.
   "Fix null check in follow-up form" bliver til "Opfølgninger kan nu gemmes,
   selvom metodefeltet er tomt".
3. Grupper efter arbejdsområde — Myndighed, Udfører, Ledelsesinformation,
   Administration — ikke efter feat/fix/chore.
4. Sæt ændringer med konsekvens for arbejdsgange øverst i hver gruppe.
5. Skriv "Det skal support vide" som de tre spørgsmål, supporten sandsynligvis
   får i næste uge. Ikke en opsummering — de faktiske spørgsmål.

## Sprog

- Aktiv form, nutid: "Systemet gemmer nu metodefeltet".
- Ingen anglicismer hvor der findes et dansk fagord: *bruger* ikke *user*,
  *sag* ikke *case*, *indsats* ikke *service*, *fejl* ikke *bug*.
- Ingen undskyldninger og ingen selvros. "Vi har rettet en fejl" er nok.
- Er en ændring et brud, så sig det først i punktet, ikke til sidst.

Udfyld til sidst sprogtjek-feltet ærligt: gennemgå din egen tekst og list de
anglicismer, du selv har brugt. Er der ingen, er listen tom.

## Regler

- Opfind aldrig en ændring, der ikke står i inputtet.
- Er en titel for kryptisk til at oversætte, så læg den i "udeladt" med en note
  om, at den er uklar, frem for at gætte.

Bemærk: enum-værdier er faste danske nøgler og skal altid vælges på dansk, uanset
hvilket sprog du i øvrigt skriver på.

${languageInstruction(locale)}`,

  build: (input) => `Skriv release notes ud fra følgende ændringer:

---
${input}
---`,
}

export const releaseNoter: AgentDefinition = {
  slug: 'release-noter',
  name_da: 'Release-noter',
  name_en: 'Release notes',
  description_da:
    'Omsætter tekniske PR-titler til kundevendte danske release notes, en intern changelog og de tre spørgsmål, supporten får i næste uge.',
  description_en:
    'Turns technical PR titles into customer-facing Danish release notes, an internal changelog, and the three questions support will get next week.',

  inputSchema: z.string().min(20).max(8000),
  outputSchema: releaseNoterOutput,

  versions: [v1],
  defaultVersion: 'v1',

  quoteFields: [],

  sampleInput: `fix: null check in follow-up method field (#412)
feat: export case list to xlsx (#418)
fix: SSO redirect loop when session cookie is stale (#421)
chore: bump drizzle-orm to 0.45 (#423)
refactor: extract audit writer into its own module (#425)
feat!: remove legacy /api/v1 case endpoint (#428)
fix: follow-up deadline list now includes upcoming deadlines, not only overdue (#430)
test: add coverage for CPR detector (#431)`,
}
