import { z } from 'zod'

/**
 * One JSON object per line. JSONL rather than a JSON array on purpose: cases get
 * appended over time (notably by "Tilføj som eval-case" on a rejected run), and
 * an append to JSONL is a one-line diff instead of a rewrite of the whole file.
 */
export const evalCaseSchema = z.object({
  id: z.string().min(1),
  input: z.string().min(1),
  must_include: z.array(z.string()).default([]),
  must_not_include: z.array(z.string()).default([]),
  expected: z.record(z.string(), z.unknown()).nullable().default(null),
  rubric_notes: z.string().default(''),
  source: z.enum(['curated', 'from_rejection', 'calibration']).default('curated'),
  /** Locale the agent should answer in. The small English suites set this to 'en'. */
  locale: z.enum(['da', 'en']).default('da'),
  /**
   * Present only on calibration cases: a deliberately bad output that is fed
   * straight to the judge instead of calling the agent. If the judge rates one
   * of these well, the judge is broken and the run is untrustworthy.
   */
  calibration_output: z.unknown().optional(),
})

export type EvalCase = z.infer<typeof evalCaseSchema>

export function parseJsonl(contents: string): EvalCase[] {
  const cases: EvalCase[] = []
  const seen = new Set<string>()

  contents.split('\n').forEach((line, index) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    let raw: unknown
    try {
      raw = JSON.parse(trimmed)
    } catch {
      throw new Error(`Line ${index + 1}: not valid JSON`)
    }

    const parsed = evalCaseSchema.safeParse(raw)
    if (!parsed.success) {
      throw new Error(`Line ${index + 1}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`)
    }

    // A duplicate id silently overwrites results and quietly shrinks the suite.
    if (seen.has(parsed.data.id)) {
      throw new Error(`Line ${index + 1}: duplicate case id "${parsed.data.id}"`)
    }
    seen.add(parsed.data.id)

    if (parsed.data.source === 'calibration' && parsed.data.calibration_output === undefined) {
      throw new Error(`Line ${index + 1}: calibration case "${parsed.data.id}" has no calibration_output`)
    }

    cases.push(parsed.data)
  })

  return cases
}

export function toJsonl(cases: readonly EvalCase[]): string {
  return cases.map((item) => JSON.stringify(item)).join('\n') + '\n'
}
