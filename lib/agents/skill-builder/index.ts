import { z } from 'zod'
import { languageInstruction, type AgentDefinition, type PromptVersion } from '../types'

export const skillBuilderOutput = z.object({
  name: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .describe('kebab-case, kun små bogstaver, tal og bindestreger'),
  description: z
    .string()
    .min(20)
    .max(500)
    .describe(
      'Tredje person. Hvad færdigheden gør, efterfulgt af mindst tre konkrete udløsende formuleringer og mindst én eksplicit ikke-udløser.',
    ),
  body_md: z
    .string()
    .describe('Markdown-brødtekst med nummererede trin, input/output-kontrakt og et eksempelafsnit'),
})

export type SkillBuilderOutput = z.infer<typeof skillBuilderOutput>

const v1: PromptVersion = {
  version: 'v1',
  notes_da:
    'Første version. Lægger vægt på beskrivelsen som udløsermekanisme, ikke som markedsføring.',
  notes_en: 'First version. Emphasises the description as a trigger mechanism, not marketing copy.',
  tier: 'workhorse',
  temperature: 0.3,

  system: (locale) => `${languageInstruction(locale)}

Du skriver Claude-færdigheder (skills) til produktteamet i EG Digital Welfare.

En færdighed er en genbrugelig instruktion til en tilbagevendende opgave. Den
består af YAML-frontmatter med \`name\` og \`description\`, plus en markdown-brødtekst.

## Beskrivelsen er det vigtigste felt

\`description\` afgør, om færdigheden overhovedet bliver aktiveret på det rigtige
tidspunkt. Den er en udløsermekanisme, ikke en produktbeskrivelse.

Den skal:
- være skrevet i **tredje person** ("Opsummerer …", ikke "Jeg opsummerer …")
- sige hvad færdigheden gør, i én sætning
- indeholde **mindst tre konkrete formuleringer**, en bruger reelt ville skrive,
  i anførselstegn
- indeholde **mindst én eksplicit ikke-udløser** — hvornår færdigheden *ikke*
  skal bruges. Uden den overtager færdigheden opgaver, den ikke er god til.
- være mellem 20 og 500 tegn

## Brødteksten

Skal indeholde, i denne rækkefølge:

1. En kort overskrift og én sætning om formålet
2. **Input- og outputkontrakt** — hvad går ind, hvad kommer ud
3. **Trin** som en nummereret liste. Hvert trin er en handling, ikke et princip.
4. **Regler** — det, der aldrig må ske
5. Et afsnit med overskriften **Eksempel**, med et gennemarbejdet input og
   output, og en afsluttende linje der peger på, hvad man skal lægge mærke til

## Regler

- Skriv brødteksten på dansk, i sagligt myndighedssprog.
- Trin skal være konkrete nok til, at to personer ville udføre dem ens.
- Opfind ikke felter, systemer eller processer, brugeren ikke har nævnt.
- Eksemplet skal være realistisk for en dansk kommunal kontekst.

${languageInstruction(locale)}`,

  build: (input) => `Skriv en færdighed til følgende tilbagevendende opgave:

---
${input}
---`,
}

export const skillBuilder: AgentDefinition = {
  slug: 'skill-builder',
  name_da: 'Færdighedsbygger',
  name_en: 'Skill builder',
  description_da:
    'Beskriv en tilbagevendende opgave på almindeligt dansk, og få en gyldig, brugbar SKILL.md tilbage.',
  description_en:
    'Describe a recurring task in plain Danish and get back a valid, usable SKILL.md.',

  inputSchema: z.string().min(20).max(4000),
  outputSchema: skillBuilderOutput,

  versions: [v1],
  defaultVersion: 'v1',

  quoteFields: [],

  sampleInput: `Hver mandag samler jeg de henvendelser, der er kommet fra kommunerne i løbet af
ugen, og skriver et kort afsnit til produktteamets ugemøde. Jeg grupperer dem
efter hvad brugeren prøvede at gøre, tæller hvor mange kommuner der er berørt af
hvert mønster, og fremhæver den ene henvendelse som nogen bør læse selv om den
ikke passer ind i et mønster.`,
}

/** Assemble the generated parts into a SKILL.md file. */
export function assembleSkillMarkdown(skill: SkillBuilderOutput): string {
  // Block scalars would need indentation handling; a quoted scalar with escaped
  // quotes is unambiguous and round-trips through any YAML parser.
  const description = skill.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `---\nname: ${skill.name}\ndescription: "${description}"\n---\n\n${skill.body_md.trim()}\n`
}
