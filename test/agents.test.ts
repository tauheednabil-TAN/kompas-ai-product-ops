import { describe, expect, it } from 'vitest'
import { AGENTS, getAgent } from '@/lib/agents/registry'
import { findVersion, languageInstruction } from '@/lib/agents/types'
import { feedbackTriageOutput } from '@/lib/agents/feedback-triage/schema'

describe('agent registry', () => {
  it('has unique slugs', () => {
    expect(new Set(AGENTS.map((a) => a.slug)).size).toBe(AGENTS.length)
  })

  it('resolves an agent by slug', () => {
    expect(getAgent('feedback-triage')?.slug).toBe('feedback-triage')
    expect(getAgent('findes-ikke')).toBeUndefined()
  })

  for (const agent of AGENTS) {
    describe(agent.slug, () => {
      it('has a default version that actually exists', () => {
        expect(findVersion(agent.versions, agent.defaultVersion, agent.defaultVersion)).toBeDefined()
      })

      it('has unique version identifiers', () => {
        const ids = agent.versions.map((v) => v.version)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('has a sample input that passes its own input schema', () => {
        expect(agent.inputSchema.safeParse(agent.sampleInput).success).toBe(true)
      })

      for (const version of agent.versions) {
        describe(version.version, () => {
          /**
           * The single highest-value prompt test in the project. Danish output
           * silently drifting to English is the failure mode §9 warns about, and
           * the mitigation is the instruction appearing at *both* ends of the
           * system prompt. Without this test that mitigation can be deleted by
           * accident and nothing would notice until an eval run.
           */
          it('states the language instruction at both the start and the end', () => {
            for (const locale of ['da', 'en'] as const) {
              const system = version.system(locale)
              const instruction = languageInstruction(locale)
              const first = system.indexOf(instruction)
              const last = system.lastIndexOf(instruction)

              expect(first, `${locale}: instruction missing entirely`).toBeGreaterThanOrEqual(0)
              expect(last, `${locale}: instruction appears only once`).toBeGreaterThan(first)
              // "At the start" and "at the end", not merely present twice.
              expect(first).toBeLessThan(80)
              expect(system.length - last).toBeLessThan(instruction.length + 80)
            }
          })

          it('keeps enum values Danish even when answering in English', () => {
            // Enums are canonical database keys. A prompt that let the model
            // translate them would corrupt every historical row.
            expect(version.system('en')).toMatch(/enum-værdier er faste danske nøgler/)
          })

          it('embeds the input verbatim in the user message', () => {
            const input = 'Metodefeltet gemmes ikke efter opdateringen.'
            expect(version.build(input, 'da')).toContain(input)
          })

          it('uses a low temperature, so runs are comparable across evals', () => {
            expect(version.temperature).toBeLessThanOrEqual(0.3)
          })
        })
      }
    })
  }
})

describe('feedback-triage schema', () => {
  const valid = {
    resumé: 'Metodefeltet gemmes ikke ved afslutning af opfølgning.',
    produkt: 'Sensum One',
    tema: 'Dokumentationskvalitet',
    alvorlighed: 'Høj',
    begrundelse_alvorlighed: 'Kravet i kvalitetsstandarden kan ikke opfyldes.',
    fagligt_domæne: ['VUM 2.0'],
    påvirkede_brugere: 'Ét team',
    foreslået_user_story: {
      som: 'sagsbehandler',
      ønsker_jeg: 'at metodefeltet gemmes',
      så_jeg: 'kan dokumentere den anvendte metode',
    },
    åbne_spørgsmål: ['Gælder det alle indsatstyper?'],
    citat: 'metodefeltet gemmes ikke',
  }

  it('accepts a well-formed result', () => {
    expect(feedbackTriageOutput.safeParse(valid).success).toBe(true)
  })

  it('rejects an enum value that is not in the canonical Danish set', () => {
    expect(feedbackTriageOutput.safeParse({ ...valid, alvorlighed: 'High' }).success).toBe(false)
  })

  it('enforces the summary length cap', () => {
    expect(feedbackTriageOutput.safeParse({ ...valid, resumé: 'a'.repeat(281) }).success).toBe(false)
  })

  it('caps open questions at three', () => {
    expect(
      feedbackTriageOutput.safeParse({ ...valid, åbne_spørgsmål: ['a', 'b', 'c', 'd'] }).success,
    ).toBe(false)
  })
})
