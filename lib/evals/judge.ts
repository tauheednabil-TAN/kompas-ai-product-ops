import 'server-only'

import { generateObject } from 'ai'
import { MAX_RETRIES, REQUEST_TIMEOUT_MS, resolveModel } from '@/lib/ai/client'
import { computeCost } from '@/lib/ai/cost'
import { toAgentError } from '@/lib/ai/errors'
import {
  DIMENSIONS,
  JUDGE_SYSTEM,
  judgeOutput,
  meanScore,
  median,
  rationalesFrom,
  scoresFrom,
  spread,
  UNSTABLE_SPREAD,
  type Dimension,
  type JudgeOutput,
  type Scores,
} from './rubrics'

/** How many times each case is graded. Odd, so the median is a real sample. */
export const JUDGE_PASSES = 3

export type JudgeResult = {
  /** Median across the passes, per dimension. */
  scores: Scores
  /** Max minus min across the passes, per dimension. */
  spreads: Record<Dimension, number>
  /**
   * True when any dimension disagreed by more than one point.
   *
   * An unstable case is a **finding, not noise**: it means the rubric is
   * ambiguous for that input, and an ambiguous rubric produces numbers nobody
   * should act on. It gets surfaced rather than averaged away.
   */
  unstable: boolean
  /** All three judgements, so a reviewer can watch the judge disagree with itself. */
  passes: JudgeOutput[]
  rationales: Record<Dimension, string>[]
  meanScore: number
  tokensIn: number
  tokensOut: number
  costDkk: number
  latencyMs: number
}

function buildPrompt(input: string, output: unknown, rubricNotes: string): string {
  return `## Input

${input}

## Output der skal bedømmes

${JSON.stringify(output, null, 2)}

${rubricNotes.trim() ? `## Rubriknoter for netop denne sag\n\n${rubricNotes.trim()}\n` : ''}
Bedøm outputtet ovenfor.`
}

/**
 * Grade one case three times and take the median.
 *
 * Three passes rather than one because a judge at temperature 0 is still not
 * deterministic, and a single sample gives a number with no error bar. The
 * spread is reported alongside the median precisely so the error bar is visible.
 */
export async function judgeCase({
  input,
  output,
  rubricNotes,
}: {
  input: string
  output: unknown
  rubricNotes: string
}): Promise<JudgeResult> {
  const { spec, model, providerOptions } = resolveModel('judge')
  const startedAt = Date.now()

  let tokensIn = 0
  let tokensOut = 0
  let costDkk = 0
  const judgements: JudgeOutput[] = []

  for (let pass = 0; pass < JUDGE_PASSES; pass += 1) {
    try {
      const result = await generateObject({
        model,
        schema: judgeOutput,
        schemaName: 'bedoemmelse',
        system: JUDGE_SYSTEM,
        prompt: buildPrompt(input, output, rubricNotes),
        // Zero, and still not deterministic — hence the three passes.
        temperature: 0,
        providerOptions,
        maxRetries: MAX_RETRIES,
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      judgements.push(result.object)
      const cost = computeCost(spec, result.usage)
      tokensIn += cost.tokensIn
      tokensOut += cost.tokensOut
      costDkk += cost.dkk
    } catch (error) {
      throw toAgentError(error)
    }
  }

  const perDimension = judgements.map(scoresFrom)

  const scores = {} as Scores
  const spreads = {} as Record<Dimension, number>
  for (const dimension of DIMENSIONS) {
    const samples = perDimension.map((s) => s[dimension])
    scores[dimension] = median(samples)
    spreads[dimension] = spread(samples)
  }

  return {
    scores,
    spreads,
    unstable: DIMENSIONS.some((dimension) => spreads[dimension] > UNSTABLE_SPREAD),
    passes: judgements,
    rationales: judgements.map(rationalesFrom),
    meanScore: meanScore(scores),
    tokensIn,
    tokensOut,
    costDkk,
    latencyMs: Date.now() - startedAt,
  }
}
