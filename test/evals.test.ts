import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseJsonl } from '@/lib/evals/cases'
import { runDeterministicChecks } from '@/lib/evals/checks'
import { compareRuns, verdictLine, SCORE_NOISE_FLOOR, type RunSummary } from '@/lib/evals/compare'
import { detectLanguage, collectStrings } from '@/lib/evals/language'
import {
  CALIBRATION_CEILING,
  meanScore,
  median,
  passes,
  spread,
  type Scores,
} from '@/lib/evals/rubrics'
import { percentile } from '@/lib/evals/stats'
import { feedbackTriageOutput } from '@/lib/agents/feedback-triage/schema'
import { AGENTS } from '@/lib/agents/registry'

const GOOD = {
  resumé: 'Metodefeltet gemmes ikke ved afslutning af opfølgning på en § 85-indsats.',
  produkt: 'Ukendt',
  tema: 'Dokumentationskvalitet',
  alvorlighed: 'Høj',
  begrundelse_alvorlighed:
    'Et krav i kommunens kvalitetsstandard kan ikke opfyldes, og der arbejdes med en omgåelsesløsning.',
  fagligt_domæne: ['VUM 2.0'],
  påvirkede_brugere: 'Ét team',
  foreslået_user_story: {
    som: 'sagsbehandler',
    ønsker_jeg: 'at metodefeltet gemmes ved afslutning',
    så_jeg: 'kan dokumentere den anvendte metode',
  },
  åbne_spørgsmål: ['Gælder det alle indsatstyper eller kun § 85?'],
  citat: 'metodefeltet ikke gemmes',
}

const INPUT =
  'Vi har efter opdateringen oplevet, at metodefeltet ikke gemmes, når en sagsbehandler afslutter en opfølgning på en § 85-indsats. Det er et krav i vores kvalitetsstandard, og vi er ni sagsbehandlere der bruger det dagligt.'

const SPEC: {
  externalId: string
  inputText: string
  mustInclude: string[]
  mustNotInclude: string[]
  expected: Record<string, unknown> | null
} = {
  externalId: 'ft-001',
  inputText: INPUT,
  mustInclude: [],
  mustNotInclude: [],
  expected: null,
}

function check(output: unknown, overrides: Partial<typeof SPEC> = {}, latencyMs = 1200) {
  return runDeterministicChecks({
    output,
    schema: feedbackTriageOutput,
    spec: { ...SPEC, ...overrides },
    quoteFields: ['citat'],
    locale: 'da',
    latencyMs,
  })
}

describe('deterministic checks', () => {
  it('passes a well-formed grounded Danish output', () => {
    const result = check(GOOD)
    expect(result.failures).toEqual([])
    expect(result.pass).toBe(true)
  })

  it('fails and short-circuits on an invalid schema', () => {
    const result = check({ ...GOOD, alvorlighed: 'Catastrophic' })
    expect(result.pass).toBe(false)
    // Nothing else is meaningful once the shape is wrong, so exactly one failure.
    expect(result.failures).toHaveLength(1)
    expect(result.failures[0]?.check).toBe('skema')
  })

  it('catches a quote that is not verbatim in the input', () => {
    const result = check({ ...GOOD, citat: 'metodefeltet bliver ikke gemt' })
    expect(result.failures.map((f) => f.check)).toContain('citat_findes_ordret')
  })

  it('catches a missing must_include string', () => {
    const result = check(GOOD, { mustInclude: ['Sensum One'] })
    expect(result.failures.map((f) => f.check)).toContain('must_include')
  })

  it('catches a forbidden must_not_include string', () => {
    const result = check(GOOD, { mustNotInclude: ['Dokumentationskvalitet'] })
    expect(result.failures.map((f) => f.check)).toContain('must_not_include')
  })

  it('catches an expected field that does not match', () => {
    const result = check(GOOD, { expected: { alvorlighed: 'Kritisk' } })
    const failure = result.failures.find((f) => f.check === 'expected')
    expect(failure?.detail).toContain('forventet "Kritisk"')
    expect(failure?.detail).toContain('fik "Høj"')
  })

  it('reads nested and array expected paths', () => {
    expect(check(GOOD, { expected: { 'foreslået_user_story.som': 'sagsbehandler' } }).pass).toBe(true)
    expect(check(GOOD, { expected: { 'foreslået_user_story.som': 'leder' } }).pass).toBe(false)
  })

  it('catches an English answer when Danish was requested', () => {
    const english = {
      ...GOOD,
      resumé:
        'The method field is not saved when a caseworker completes a follow-up, which means the requirement in the quality standard cannot be met.',
      begrundelse_alvorlighed:
        'This is a documented requirement that can not be fulfilled and there is only a workaround for it at the moment.',
      citat: 'metodefeltet ikke gemmes',
    }
    expect(check(english).failures.map((f) => f.check)).toContain('sprog')
  })

  it('does not mistake Danish enum values for a Danish answer', () => {
    // Enum values are canonical Danish keys and appear even in English output.
    // Counting them would make every English answer look Danish.
    const strings = collectStrings({ tema: 'Dokumentationskvalitet', resumé: 'The field is not saved' }, new Set(['tema']))
    expect(strings).toEqual(['The field is not saved'])
  })

  it('catches a CPR number hallucinated into the output', () => {
    const result = check({ ...GOOD, åbne_spørgsmål: ['Gælder det borger 010190-1234?'] })
    expect(result.failures.map((f) => f.check)).toContain('cpr_i_output')
  })

  it('catches latency over the ceiling', () => {
    expect(check(GOOD, {}, 31_000).failures.map((f) => f.check)).toContain('svartid')
  })
})

describe('language detection', () => {
  it('identifies Danish prose', () => {
    expect(detectLanguage('Der er ikke fulgt op på sagen, og det skal rettes inden fristen.').language).toBe('da')
  })

  it('identifies English prose', () => {
    expect(detectLanguage('The method field is not saved when the user completes the follow up.').language).toBe('en')
  })

  it('refuses to guess on very short strings', () => {
    // A wrong guess here would fail an otherwise good eval case.
    expect(detectLanguage('Ukendt').language).toBe('ukendt')
  })
})

describe('scoring rules', () => {
  const base: Scores = {
    korrekthed: 5,
    fuldstaendighed: 4,
    sprogkvalitet: 4,
    format: 5,
    sikkerhed: 5,
  }

  it('takes the median of three judge passes', () => {
    expect(median([3, 5, 4])).toBe(4)
    expect(spread([3, 5, 4])).toBe(2)
  })

  it('passes when deterministic checks pass, mean >= 4 and sikkerhed >= 4', () => {
    expect(meanScore(base)).toBeCloseTo(4.6)
    expect(passes(true, base)).toBe(true)
  })

  it('treats safety as a veto, not an average', () => {
    // Mean is still well above the bar; safety alone must sink it.
    const unsafe: Scores = { ...base, korrekthed: 5, sikkerhed: 3 }
    expect(meanScore(unsafe)).toBeGreaterThanOrEqual(4)
    expect(passes(true, unsafe)).toBe(false)
  })

  it('lets a deterministic failure override any score', () => {
    expect(passes(false, base)).toBe(false)
  })
})

describe('percentiles', () => {
  it('uses nearest rank', () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
    expect(percentile(values, 50)).toBe(500)
    expect(percentile(values, 95)).toBe(1000)
  })

  it('handles an empty sample', () => {
    expect(percentile([], 50)).toBe(0)
  })
})

describe('version comparison', () => {
  const runA: RunSummary = {
    promptVersion: 'v1',
    judgeTrustworthy: true,
    results: [
      { externalId: 'c1', passed: false, meanScore: 3.0, costDkk: 0.01, latencyMs: 1000, unstable: false, failedChecks: [] },
      { externalId: 'c2', passed: true, meanScore: 4.4, costDkk: 0.01, latencyMs: 1000, unstable: false, failedChecks: [] },
      { externalId: 'c3', passed: true, meanScore: 4.6, costDkk: 0.01, latencyMs: 1000, unstable: false, failedChecks: [] },
      { externalId: 'c4', passed: true, meanScore: 4.2, costDkk: 0.01, latencyMs: 1000, unstable: false, failedChecks: [] },
    ],
  }

  const runB: RunSummary = {
    promptVersion: 'v2',
    judgeTrustworthy: true,
    results: [
      { externalId: 'c1', passed: true, meanScore: 4.4, costDkk: 0.015, latencyMs: 1400, unstable: false, failedChecks: [] },
      { externalId: 'c2', passed: true, meanScore: 4.5, costDkk: 0.015, latencyMs: 1400, unstable: false, failedChecks: [] },
      { externalId: 'c3', passed: false, meanScore: 3.4, costDkk: 0.015, latencyMs: 1400, unstable: false, failedChecks: ['citat_findes_ordret'] },
      { externalId: 'c4', passed: true, meanScore: 4.3, costDkk: 0.015, latencyMs: 1400, unstable: false, failedChecks: [] },
    ],
  }

  const comparison = compareRuns(runA, runB)

  it('buckets a pass gained as improved and a pass lost as regressed', () => {
    expect(comparison.improved.map((d) => d.externalId)).toContain('c1')
    expect(comparison.regressed.map((d) => d.externalId)).toContain('c3')
  })

  it('treats sub-noise-floor score movement as unchanged', () => {
    // c4 moved by 0.1, below the floor. Calling that an improvement would be
    // exactly the vibes-based claim this harness exists to replace.
    expect(0.1).toBeLessThan(SCORE_NOISE_FLOOR)
    expect(comparison.unchanged.map((d) => d.externalId)).toContain('c4')
  })

  it('lets a pass/fail flip beat the noise floor', () => {
    // c2 moved only 0.1 but did not flip, so it is unchanged; c1 flipped.
    const c1 = comparison.improved.find((d) => d.externalId === 'c1')
    expect(c1?.passChange).toBe('gained')
  })

  it('computes the headline deltas', () => {
    expect(comparison.a.passRate).toBeCloseTo(0.75)
    expect(comparison.b.passRate).toBeCloseTo(0.75)
    expect(comparison.passRateDeltaPp).toBeCloseTo(0)
    expect(comparison.costDeltaPct).toBeCloseTo(50)
  })

  it('states the trade-off honestly, including the bad half', () => {
    const line = verdictLine(comparison, 'da')
    expect(line).toContain('v2')
    expect(line).toMatch(/50 % mere/)
  })

  it('refuses to report numbers when the judge failed calibration', () => {
    const untrusted = compareRuns({ ...runA, judgeTrustworthy: false }, runB)
    expect(untrusted.judgeTrustworthy).toBe(false)
    expect(verdictLine(untrusted, 'da')).toMatch(/ikke til at stole på/)
    expect(verdictLine(untrusted, 'en')).toMatch(/not trustworthy/)
  })

  it('reports no percentage change against a zero baseline instead of Infinity', () => {
    const zero: RunSummary = {
      promptVersion: 'v0',
      judgeTrustworthy: true,
      results: [{ externalId: 'c1', passed: true, meanScore: 4, costDkk: 0, latencyMs: 0, unstable: false, failedChecks: [] }],
    }
    expect(compareRuns(zero, runB).costDeltaPct).toBeNull()
  })
})

describe('eval suite files', () => {
  for (const agent of AGENTS) {
    describe(agent.slug, () => {
      const contents = readFileSync(
        path.join(process.cwd(), 'evals', agent.slug, 'cases.jsonl'),
        'utf8',
      )
      const cases = parseJsonl(contents)

      it('parses, with unique ids', () => {
        expect(cases.length).toBeGreaterThan(0)
        expect(new Set(cases.map((c) => c.id)).size).toBe(cases.length)
      })

      it('has at least 15 cases', () => {
        expect(cases.length).toBeGreaterThanOrEqual(15)
      })

      it('has exactly two calibration cases carrying a known-bad output', () => {
        const calibration = cases.filter((c) => c.source === 'calibration')
        expect(calibration).toHaveLength(2)
        for (const item of calibration) {
          expect(item.calibration_output).toBeDefined()
        }
      })

      it('has calibration outputs that are schema-valid', () => {
        // They must be *plausible* but bad. A schema-invalid calibration output
        // would be caught by layer 1 and would never reach the judge, which is
        // the thing being calibrated.
        for (const item of cases.filter((c) => c.source === 'calibration')) {
          const parsed = agent.outputSchema.safeParse(item.calibration_output)
          expect(parsed.success, `${item.id} must be schema-valid`).toBe(true)
        }
      })

      it('has a small English suite of at least two cases', () => {
        expect(cases.filter((c) => c.locale === 'en').length).toBeGreaterThanOrEqual(2)
      })

      it('gives every non-calibration case rubric notes', () => {
        for (const item of cases.filter((c) => c.source !== 'calibration')) {
          expect(item.rubric_notes.length, `${item.id} needs rubric notes`).toBeGreaterThan(20)
        }
      })
    })
  }
})

describe('jsonl parsing', () => {
  it('rejects a duplicate case id', () => {
    const line = '{"id":"a","input":"x"}'
    expect(() => parseJsonl(`${line}\n${line}`)).toThrow(/duplicate/)
  })

  it('rejects a calibration case with no known-bad output', () => {
    expect(() => parseJsonl('{"id":"a","input":"x","source":"calibration"}')).toThrow(
      /calibration_output/,
    )
  })

  it('reports the offending line number', () => {
    expect(() => parseJsonl('{"id":"a","input":"x"}\nnot json')).toThrow(/Line 2/)
  })

  it('ignores blank lines and comments', () => {
    expect(parseJsonl('\n// a comment\n{"id":"a","input":"x"}\n\n')).toHaveLength(1)
  })
})

describe('calibration threshold', () => {
  it('is below the pass bar, so a bad output scoring "acceptable" trips it', () => {
    expect(CALIBRATION_CEILING).toBeLessThan(4.0)
  })
})
