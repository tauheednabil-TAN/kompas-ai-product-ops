import type { z } from 'zod'
import { containsCpr } from '@/lib/ai/guards'
import type { Locale } from '@/lib/i18n/config'
import { collectStrings, detectLanguage } from './language'

/**
 * Layer 1 — deterministic checks. Free, fast, and non-negotiable.
 *
 * **Any failure here fails the case regardless of the judge's score.** That
 * ordering is the whole point of the two-layer design: an LLM judge is a
 * measuring instrument with its own error bars, so anything that can be decided
 * by a machine with certainty must never be delegated to it.
 */

export const MAX_LATENCY_MS = 30_000

/** Enum fields hold canonical Danish keys and must be excluded from language detection. */
const ENUM_KEYS = new Set([
  'produkt',
  'tema',
  'alvorlighed',
  'påvirkede_brugere',
  'fagligt_domæne',
  'samlet_vurdering',
  'metode',
  'kategori',
])

export type CheckFailure = {
  /** Stable identifier, used in the UI and in the CI comment. */
  check: string
  detail: string
}

export type EvalCaseSpec = {
  externalId: string
  inputText: string
  mustInclude: readonly string[]
  mustNotInclude: readonly string[]
  expected: Record<string, unknown> | null
}

export type DeterministicResult = {
  pass: boolean
  failures: CheckFailure[]
}

/** Read `a.b` and `a[].b` paths out of a structured output. */
function readPath(value: unknown, path: string): unknown[] {
  const segments = path.split('.')
  let current: unknown[] = [value]

  for (const rawSegment of segments) {
    const isArray = rawSegment.endsWith('[]')
    const key = isArray ? rawSegment.slice(0, -2) : rawSegment
    const next: unknown[] = []

    for (const node of current) {
      if (typeof node !== 'object' || node === null) continue
      const child = (node as Record<string, unknown>)[key]
      if (child === undefined) continue
      if (isArray && Array.isArray(child)) next.push(...child)
      else next.push(child)
    }

    current = next
  }

  return current
}

/**
 * Used both to compare and to report. Quoting strings matters for both: it makes
 * `forventet "Ét team"` unambiguous in a failure message, and it stops the
 * comparison treating the string `"5"` and the number `5` as equal.
 */
function stringify(value: unknown): string {
  return JSON.stringify(value) ?? 'undefined'
}

export function runDeterministicChecks({
  output,
  schema,
  spec,
  quoteFields,
  locale,
  latencyMs,
}: {
  output: unknown
  schema: z.ZodType<unknown>
  spec: EvalCaseSpec
  quoteFields: readonly string[]
  locale: Locale
  latencyMs: number
}): DeterministicResult {
  const failures: CheckFailure[] = []

  // 1. Schema validity. If this fails nothing else is meaningful, so return early.
  const parsed = schema.safeParse(output)
  if (!parsed.success) {
    return {
      pass: false,
      failures: [
        {
          check: 'skema',
          detail: parsed.error.issues
            .slice(0, 5)
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('; '),
        },
      ],
    }
  }

  const serialised = JSON.stringify(output)

  // 2. Required and forbidden strings.
  for (const needle of spec.mustInclude) {
    if (!serialised.includes(needle)) {
      failures.push({ check: 'must_include', detail: `mangler "${needle}"` })
    }
  }
  for (const needle of spec.mustNotInclude) {
    if (serialised.includes(needle)) {
      failures.push({ check: 'must_not_include', detail: `indeholder "${needle}"` })
    }
  }

  // 3. Exact field expectations.
  if (spec.expected) {
    for (const [path, want] of Object.entries(spec.expected)) {
      const found = readPath(output, path)
      const got = found[0]
      if (found.length === 0) {
        failures.push({ check: 'expected', detail: `${path} mangler (forventet ${stringify(want)})` })
      } else if (stringify(got) !== stringify(want)) {
        failures.push({
          check: 'expected',
          detail: `${path}: forventet ${stringify(want)}, fik ${stringify(got)}`,
        })
      }
    }
  }

  // 4. Quote grounding. The single cheapest hallucination check there is: if the
  //    model claims a verbatim quote, the quote has to actually be there.
  for (const field of quoteFields) {
    for (const quote of readPath(output, field)) {
      if (typeof quote !== 'string' || quote.length === 0) continue
      if (!spec.inputText.includes(quote)) {
        failures.push({
          check: 'citat_findes_ordret',
          detail: `${field}: "${quote.slice(0, 60)}…" findes ikke ordret i input`,
        })
      }
    }
  }

  // 5. Output language matches the locale the agent was asked to answer in.
  const prose = collectStrings(output, ENUM_KEYS).join(' ')
  const verdict = detectLanguage(prose)
  if (verdict.language !== 'ukendt' && verdict.language !== locale) {
    failures.push({
      check: 'sprog',
      detail: `forventet ${locale}, målt ${verdict.language} (da-ord: ${verdict.danishHits}, en-ord: ${verdict.englishHits})`,
    })
  }

  // 6. No CPR pattern in the output, even hallucinated.
  if (containsCpr(serialised)) {
    failures.push({ check: 'cpr_i_output', detail: 'output indeholder noget CPR-lignende' })
  }

  // 7. Latency ceiling.
  if (latencyMs > MAX_LATENCY_MS) {
    failures.push({ check: 'svartid', detail: `${latencyMs} ms > ${MAX_LATENCY_MS} ms` })
  }

  return { pass: failures.length === 0, failures }
}
