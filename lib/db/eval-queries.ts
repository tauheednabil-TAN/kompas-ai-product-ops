import 'server-only'

import { and, desc, eq } from 'drizzle-orm'
import type { RunSummary } from '@/lib/evals/compare'
import type { Dimension } from '@/lib/evals/rubrics'
import { getDb } from './index'
import { evalCases, evalResults, evalRuns, evalSuites } from './schema'
import { safeErrorDetail, type QueryResult } from './queries'

async function run<T>(fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<QueryResult<T>> {
  const db = getDb()
  if (!db) return { state: 'not-configured' }
  try {
    return { state: 'ok', data: await fn(db) }
  } catch (error) {
    return { state: 'unreachable', error: safeErrorDetail(error) }
  }
}

export type SuiteCard = {
  name: string
  agentSlug: string
  latest: {
    promptVersion: string
    modelId: string
    passRate: number
    meanScore: number
    totalCostDkk: number
    finishedAt: Date | null
    judgeTrustworthy: boolean
  } | null
  /** Pass rate of the last runs, oldest first, for the sparkline. */
  trend: number[]
  versions: string[]
}

export function listSuites(): Promise<QueryResult<SuiteCard[]>> {
  return run(async (db) => {
    const suites = await db.select().from(evalSuites).orderBy(evalSuites.name)

    return Promise.all(
      suites.map(async (suite) => {
        const runs = await db
          .select()
          .from(evalRuns)
          .where(eq(evalRuns.suiteId, suite.id))
          .orderBy(desc(evalRuns.startedAt))
          .limit(12)

        const rate = (r: (typeof runs)[number]) => {
          const total = r.passCount + r.failCount
          return total === 0 ? 0 : r.passCount / total
        }

        const latest = runs[0]

        return {
          name: suite.name,
          agentSlug: suite.agentSlug,
          latest: latest
            ? {
                promptVersion: latest.promptVersion,
                modelId: latest.modelId,
                passRate: rate(latest),
                meanScore: latest.meanScore,
                totalCostDkk: latest.totalCostDkk,
                finishedAt: latest.finishedAt,
                judgeTrustworthy: latest.judgeTrustworthy,
              }
            : null,
          // Oldest first so the sparkline reads left to right in time order.
          trend: [...runs].reverse().map(rate),
          versions: [...new Set(runs.map((r) => r.promptVersion))].sort(),
        }
      }),
    )
  })
}

export type CaseRow = {
  externalId: string
  source: string
  inputText: string
  rubricNotes: string
  outputJson: unknown
  deterministicPass: boolean
  failedChecks: string[]
  scores: Record<Dimension, number> | null
  spreads: Record<Dimension, number> | null
  unstable: boolean
  meanScore: number
  passed: boolean
  rationales: Record<Dimension, string>[] | null
  costDkk: number
  latencyMs: number
}

export type SuiteDetail = {
  name: string
  agentSlug: string
  promptVersion: string
  modelId: string
  startedAt: Date
  passCount: number
  failCount: number
  meanScore: number
  totalCostDkk: number
  p50LatencyMs: number
  p95LatencyMs: number
  judgeTrustworthy: boolean
  judgeTrustNote: string | null
  availableVersions: string[]
  cases: CaseRow[]
}

function asScores(value: unknown): Record<Dimension, number> | null {
  return value && typeof value === 'object' ? (value as Record<Dimension, number>) : null
}

export function getSuiteDetail(
  suiteName: string,
  version?: string,
): Promise<QueryResult<SuiteDetail | null>> {
  return run(async (db) => {
    const [suite] = await db.select().from(evalSuites).where(eq(evalSuites.name, suiteName)).limit(1)
    if (!suite) return null

    const allRuns = await db
      .select()
      .from(evalRuns)
      .where(eq(evalRuns.suiteId, suite.id))
      .orderBy(desc(evalRuns.startedAt))

    const latest = version
      ? allRuns.find((r) => r.promptVersion === version)
      : allRuns[0]
    if (!latest) return null

    const rows = await db
      .select({ result: evalResults, evalCase: evalCases })
      .from(evalResults)
      .innerJoin(evalCases, eq(evalResults.caseId, evalCases.id))
      .where(eq(evalResults.evalRunId, latest.id))

    return {
      name: suite.name,
      agentSlug: suite.agentSlug,
      promptVersion: latest.promptVersion,
      modelId: latest.modelId,
      startedAt: latest.startedAt,
      passCount: latest.passCount,
      failCount: latest.failCount,
      meanScore: latest.meanScore,
      totalCostDkk: latest.totalCostDkk,
      p50LatencyMs: latest.p50LatencyMs,
      p95LatencyMs: latest.p95LatencyMs,
      judgeTrustworthy: latest.judgeTrustworthy,
      judgeTrustNote: latest.judgeTrustNote,
      availableVersions: [...new Set(allRuns.map((r) => r.promptVersion))].sort(),
      cases: rows
        .map(({ result, evalCase }) => ({
          externalId: evalCase.externalId,
          source: evalCase.source,
          inputText: evalCase.inputText,
          rubricNotes: evalCase.rubricNotes,
          outputJson: result.outputJson,
          deterministicPass: result.deterministicPass,
          failedChecks: result.failedChecks,
          scores: asScores(result.scoresJson),
          spreads: asScores(result.spreadJson),
          unstable: result.unstable,
          meanScore: result.meanScore,
          passed: result.passed,
          rationales: Array.isArray(result.judgeRationale)
            ? (result.judgeRationale as Record<Dimension, string>[])
            : null,
          costDkk: result.costDkk,
          latencyMs: result.latencyMs,
        }))
        // Failures first: the rows worth looking at should not be below the fold.
        .sort((a, b) => Number(a.passed) - Number(b.passed) || a.externalId.localeCompare(b.externalId)),
    }
  })
}

export type ComparisonSource = {
  suiteName: string
  agentSlug: string
  a: RunSummary
  b: RunSummary
  /** Keyed by case id, for the expandable regression rows. */
  outputs: Record<string, { a: unknown; b: unknown; rationaleA: unknown; rationaleB: unknown; input: string }>
  availableVersions: string[]
}

/** Most recent run of a suite at a given prompt version. */
export function getComparison(
  suiteName: string,
  versionA: string,
  versionB: string,
): Promise<QueryResult<ComparisonSource | null>> {
  return run(async (db) => {
    const [suite] = await db.select().from(evalSuites).where(eq(evalSuites.name, suiteName)).limit(1)
    if (!suite) return null

    const allRuns = await db
      .select()
      .from(evalRuns)
      .where(eq(evalRuns.suiteId, suite.id))
      .orderBy(desc(evalRuns.startedAt))

    const pick = async (version: string) => {
      const [found] = await db
        .select()
        .from(evalRuns)
        .where(and(eq(evalRuns.suiteId, suite.id), eq(evalRuns.promptVersion, version)))
        .orderBy(desc(evalRuns.startedAt))
        .limit(1)
      if (!found) return null

      const rows = await db
        .select({ result: evalResults, evalCase: evalCases })
        .from(evalResults)
        .innerJoin(evalCases, eq(evalResults.caseId, evalCases.id))
        .where(eq(evalResults.evalRunId, found.id))

      return { run: found, rows }
    }

    const [left, right] = await Promise.all([pick(versionA), pick(versionB)])
    if (!left || !right) return null

    const outputs: ComparisonSource['outputs'] = {}
    for (const { result, evalCase } of left.rows) {
      outputs[evalCase.externalId] = {
        a: result.outputJson,
        b: null,
        rationaleA: result.judgeRationale,
        rationaleB: null,
        input: evalCase.inputText,
      }
    }
    for (const { result, evalCase } of right.rows) {
      const existing = outputs[evalCase.externalId]
      if (existing) {
        existing.b = result.outputJson
        existing.rationaleB = result.judgeRationale
      } else {
        outputs[evalCase.externalId] = {
          a: null,
          b: result.outputJson,
          rationaleA: null,
          rationaleB: result.judgeRationale,
          input: evalCase.inputText,
        }
      }
    }

    const toSummary = (side: NonNullable<Awaited<ReturnType<typeof pick>>>): RunSummary => ({
      promptVersion: side.run.promptVersion,
      judgeTrustworthy: side.run.judgeTrustworthy,
      results: side.rows
        // Calibration cases measure the judge, not the prompt. Including them
        // would move the pass rate for reasons that have nothing to do with the
        // version being compared.
        .filter(({ evalCase }) => evalCase.source !== 'calibration')
        .map(({ result, evalCase }) => ({
          externalId: evalCase.externalId,
          passed: result.passed,
          meanScore: result.meanScore,
          costDkk: result.costDkk,
          latencyMs: result.latencyMs,
          unstable: result.unstable,
          failedChecks: result.failedChecks,
        })),
    })

    return {
      suiteName: suite.name,
      agentSlug: suite.agentSlug,
      a: toSummary(left),
      b: toSummary(right),
      outputs,
      availableVersions: [...new Set(allRuns.map((r) => r.promptVersion))].sort(),
    }
  })
}

