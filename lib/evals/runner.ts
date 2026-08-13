import 'server-only'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { eq } from 'drizzle-orm'
import { resolveModel } from '@/lib/ai/client'
import { getAgent } from '@/lib/agents/registry'
import { resolveVersion, runAgentOnce } from '@/lib/agents/runner'
import type { AgentDefinition } from '@/lib/agents/types'
import { requireDb } from '@/lib/db'
import { evalCases, evalResults, evalRuns, evalSuites } from '@/lib/db/schema'
import { parseJsonl, type EvalCase } from './cases'
import { runDeterministicChecks, type CheckFailure } from './checks'
import { judgeCase, type JudgeResult } from './judge'
import { CALIBRATION_CEILING, DIMENSIONS, passes, type Scores } from './rubrics'
import { percentile } from './stats'

export type CaseOutcome = {
  case: EvalCase
  output: unknown
  deterministicPass: boolean
  failures: CheckFailure[]
  judge: JudgeResult | null
  passed: boolean
  error: string | null
  tokensIn: number
  tokensOut: number
  costDkk: number
  latencyMs: number
}

export type SuiteOutcome = {
  agentSlug: string
  suiteName: string
  promptVersion: string
  modelId: string
  outcomes: CaseOutcome[]
  passCount: number
  failCount: number
  meanScore: number
  totalCostDkk: number
  p50LatencyMs: number
  p95LatencyMs: number
  judgeTrustworthy: boolean
  judgeTrustNote: string | null
}

export async function loadSuite(agentSlug: string): Promise<EvalCase[]> {
  const file = path.join(process.cwd(), 'evals', agentSlug, 'cases.jsonl')
  return parseJsonl(await readFile(file, 'utf8'))
}

async function evaluateOne(
  agent: AgentDefinition,
  promptVersion: string,
  testCase: EvalCase,
): Promise<CaseOutcome> {
  const empty = { tokensIn: 0, tokensOut: 0, costDkk: 0, latencyMs: 0 }

  let output: unknown
  let agentTokensIn = 0
  let agentTokensOut = 0
  let agentCost = 0
  let latencyMs = 0

  if (testCase.source === 'calibration') {
    /**
     * Calibration cases never call the agent. The point is to feed the judge a
     * known-bad output and see whether it notices — calling the model would
     * produce a *good* output and measure nothing.
     */
    output = testCase.calibration_output
  } else {
    try {
      const result = await runAgentOnce(agent, promptVersion, testCase.input, testCase.locale)
      output = result.output
      agentTokensIn = result.telemetry.tokensIn
      agentTokensOut = result.telemetry.tokensOut
      agentCost = result.telemetry.costDkk
      latencyMs = result.telemetry.latencyMs
    } catch (error) {
      return {
        case: testCase,
        output: null,
        deterministicPass: false,
        failures: [{ check: 'kørsel', detail: error instanceof Error ? error.message : String(error) }],
        judge: null,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        ...empty,
      }
    }
  }

  const deterministic = runDeterministicChecks({
    output,
    schema: agent.outputSchema,
    spec: {
      externalId: testCase.id,
      inputText: testCase.input,
      mustInclude: testCase.must_include,
      mustNotInclude: testCase.must_not_include,
      expected: testCase.expected,
    },
    quoteFields: agent.quoteFields,
    locale: testCase.locale,
    latencyMs,
  })

  /**
   * The judge runs even when deterministic checks failed.
   *
   * Skipping it would be cheaper, but then a regression report could only say
   * "this failed" and never "this failed *and* the quality dropped", which is
   * exactly the information the comparison view exists to show.
   */
  const judge = await judgeCase({
    input: testCase.input,
    output,
    rubricNotes: testCase.rubric_notes,
  })

  return {
    case: testCase,
    output,
    deterministicPass: deterministic.pass,
    failures: deterministic.failures,
    judge,
    passed: passes(deterministic.pass, judge.scores),
    error: null,
    tokensIn: agentTokensIn + judge.tokensIn,
    tokensOut: agentTokensOut + judge.tokensOut,
    costDkk: agentCost + judge.costDkk,
    latencyMs,
  }
}

export async function runSuite({
  agentSlug,
  promptVersion,
  onProgress,
}: {
  agentSlug: string
  promptVersion: string
  onProgress?: (done: number, total: number, caseId: string) => void
}): Promise<SuiteOutcome> {
  const agent = getAgent(agentSlug)
  if (!agent) throw new Error(`unknown agent: ${agentSlug}`)

  // Resolve now rather than after the loop: if the version does not exist we
  // should fail before spending money, not after.
  const version = resolveVersion(agent, promptVersion)
  const { spec } = resolveModel(version.tier)

  const cases = await loadSuite(agentSlug)
  const outcomes: CaseOutcome[] = []

  // Sequential on purpose. Parallel calls trip the provider's rate limit, and a
  // 429 storm produces a run whose latency numbers mean nothing.
  for (const testCase of cases) {
    outcomes.push(await evaluateOne(agent, promptVersion, testCase))
    onProgress?.(outcomes.length, cases.length, testCase.id)
  }

  const graded = outcomes.filter((o) => o.judge !== null)
  const scored = outcomes.filter((o) => o.case.source !== 'calibration')

  /**
   * Evaluate the evaluator. If a deliberately bad output scored well, the judge
   * itself is broken and every other number in this run is untrustworthy.
   */
  const calibration = outcomes.filter((o) => o.case.source === 'calibration')
  const misjudged = calibration.filter((o) => (o.judge?.meanScore ?? 0) >= CALIBRATION_CEILING)
  const judgeTrustworthy = misjudged.length === 0

  const latencies = scored.map((o) => o.latencyMs).filter((ms) => ms > 0)
  const meanScore =
    graded.length > 0
      ? graded.reduce((sum, o) => sum + (o.judge?.meanScore ?? 0), 0) / graded.length
      : 0

  return {
    agentSlug,
    suiteName: agentSlug,
    promptVersion: version.version,
    modelId: spec.id,
    outcomes,
    passCount: scored.filter((o) => o.passed).length,
    failCount: scored.filter((o) => !o.passed).length,
    meanScore,
    totalCostDkk: outcomes.reduce((sum, o) => sum + o.costDkk, 0),
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    judgeTrustworthy,
    judgeTrustNote: judgeTrustworthy
      ? null
      : `Kalibreringssag(er) ${misjudged.map((o) => o.case.id).join(', ')} fik ${misjudged
          .map((o) => (o.judge?.meanScore ?? 0).toFixed(2))
          .join(', ')} — over loftet på ${CALIBRATION_CEILING}. Dommeren er ikke til at stole på i denne kørsel.`,
  }
}

/** Persist a completed suite run. */
export async function persistSuiteRun(outcome: SuiteOutcome): Promise<string> {
  const db = requireDb()

  const [suite] = await db
    .insert(evalSuites)
    .values({ agentSlug: outcome.agentSlug, name: outcome.suiteName, description: '' })
    .onConflictDoUpdate({ target: evalSuites.name, set: { agentSlug: outcome.agentSlug } })
    .returning({ id: evalSuites.id })

  const suiteId = suite?.id
  if (!suiteId) throw new Error('failed to upsert eval suite')

  // Keep the case rows in step with the JSONL file, so the UI can join results
  // back to inputs without re-reading the file.
  const caseIds = new Map<string, string>()
  for (const item of outcome.outcomes) {
    const [row] = await db
      .insert(evalCases)
      .values({
        suiteId,
        externalId: item.case.id,
        inputText: item.case.input,
        expectedJson: item.case.expected,
        mustInclude: [...item.case.must_include],
        mustNotInclude: [...item.case.must_not_include],
        rubricNotes: item.case.rubric_notes,
        source: item.case.source,
        calibrationOutput: item.case.calibration_output ?? null,
      })
      .onConflictDoNothing()
      .returning({ id: evalCases.id })

    if (row?.id) {
      caseIds.set(item.case.id, row.id)
    } else {
      const existing = await db
        .select({ id: evalCases.id, externalId: evalCases.externalId })
        .from(evalCases)
        .where(eq(evalCases.suiteId, suiteId))
      for (const found of existing) caseIds.set(found.externalId, found.id)
    }
  }

  const [run] = await db
    .insert(evalRuns)
    .values({
      suiteId,
      promptVersion: outcome.promptVersion,
      modelId: outcome.modelId,
      locale: outcome.outcomes[0]?.case.locale ?? 'da',
      finishedAt: new Date(),
      passCount: outcome.passCount,
      failCount: outcome.failCount,
      meanScore: outcome.meanScore,
      totalCostDkk: outcome.totalCostDkk,
      p50LatencyMs: outcome.p50LatencyMs,
      p95LatencyMs: outcome.p95LatencyMs,
      judgeTrustworthy: outcome.judgeTrustworthy,
      judgeTrustNote: outcome.judgeTrustNote,
    })
    .returning({ id: evalRuns.id })

  const runId = run?.id
  if (!runId) throw new Error('failed to insert eval run')

  for (const item of outcome.outcomes) {
    const caseId = caseIds.get(item.case.id)
    if (!caseId) continue
    await db.insert(evalResults).values({
      evalRunId: runId,
      caseId,
      outputJson: item.output ?? null,
      deterministicPass: item.deterministicPass,
      failedChecks: item.failures.map((f) => `${f.check}: ${f.detail}`),
      scoresJson: item.judge?.scores ?? null,
      spreadJson: item.judge?.spreads ?? null,
      unstable: item.judge?.unstable ?? false,
      meanScore: item.judge?.meanScore ?? 0,
      passed: item.passed,
      judgeRationale: item.judge?.rationales ?? null,
      tokensIn: item.tokensIn,
      tokensOut: item.tokensOut,
      costDkk: item.costDkk,
      latencyMs: item.latencyMs,
    })
  }

  return runId
}

export type { Scores }
export { DIMENSIONS }
