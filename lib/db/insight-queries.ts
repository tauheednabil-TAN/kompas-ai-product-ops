import 'server-only'

import { desc, sql } from 'drizzle-orm'
import { getDb } from './index'
import { agentRuns, evalRuns } from './schema'
import type { QueryResult } from './queries'

async function run<T>(fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<QueryResult<T>> {
  const db = getDb()
  if (!db) return { state: 'not-configured' }
  try {
    return { state: 'ok', data: await fn(db) }
  } catch (error) {
    return { state: 'unreachable', error: error instanceof Error ? error.message : String(error) }
  }
}

export type Insights = {
  /** Feedback themes per week, from the stored triage output. */
  themesOverTime: { week: string; theme: string; count: number }[]
  severityByProduct: { product: string; severity: string; count: number }[]
  passRateByVersion: { version: string; suite: string; passRate: number; startedAt: string }[]
  costByAgent: { agent: string; costDkk: number; runs: number }[]
  latencyOverTime: { day: string; p50: number; p95: number }[]
  verdictDistribution: { verdict: string; count: number }[]
  totalRuns: number
}

/**
 * Every number here comes from a real row.
 *
 * The theme and severity series read the stored `output_json` of successful
 * Feedback-triage runs rather than a separate analytics table — there is exactly
 * one source of truth for what an agent said, and duplicating it into a second
 * table is how dashboards start disagreeing with the audit log.
 */
export function getInsights(): Promise<QueryResult<Insights>> {
  return run(async (db) => {
    const themesOverTime = await db
      .select({
        week: sql<string>`to_char(date_trunc('week', ${agentRuns.createdAt}), 'YYYY-MM-DD')`,
        theme: sql<string>`${agentRuns.outputJson}->>'tema'`,
        count: sql<number>`count(*)::int`,
      })
      .from(agentRuns)
      .where(
        sql`${agentRuns.agentSlug} = 'feedback-triage' and ${agentRuns.status} = 'ok' and ${agentRuns.outputJson} ? 'tema'`,
      )
      .groupBy(
        sql`date_trunc('week', ${agentRuns.createdAt})`,
        sql`${agentRuns.outputJson}->>'tema'`,
      )
      .orderBy(sql`date_trunc('week', ${agentRuns.createdAt})`)

    const severityByProduct = await db
      .select({
        product: sql<string>`${agentRuns.outputJson}->>'produkt'`,
        severity: sql<string>`${agentRuns.outputJson}->>'alvorlighed'`,
        count: sql<number>`count(*)::int`,
      })
      .from(agentRuns)
      .where(
        sql`${agentRuns.agentSlug} = 'feedback-triage' and ${agentRuns.status} = 'ok' and ${agentRuns.outputJson} ? 'produkt'`,
      )
      .groupBy(sql`${agentRuns.outputJson}->>'produkt'`, sql`${agentRuns.outputJson}->>'alvorlighed'`)

    const passRateRows = await db
      .select({
        version: evalRuns.promptVersion,
        suiteId: evalRuns.suiteId,
        passCount: evalRuns.passCount,
        failCount: evalRuns.failCount,
        startedAt: sql<string>`to_char(${evalRuns.startedAt}, 'YYYY-MM-DD"T"HH24:MI:SS')`,
      })
      .from(evalRuns)
      .orderBy(evalRuns.startedAt)

    const costByAgent = await db
      .select({
        agent: agentRuns.agentSlug,
        costDkk: sql<number>`coalesce(sum(${agentRuns.costDkk}), 0)::float8`,
        runs: sql<number>`count(*)::int`,
      })
      .from(agentRuns)
      .groupBy(agentRuns.agentSlug)
      .orderBy(desc(sql`sum(${agentRuns.costDkk})`))

    const latencyOverTime = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${agentRuns.createdAt}), 'YYYY-MM-DD')`,
        // percentile_disc, not percentile_cont: an interpolated latency is a
        // number no request ever actually took.
        p50: sql<number>`coalesce(percentile_disc(0.5) within group (order by ${agentRuns.latencyMs}), 0)::int`,
        p95: sql<number>`coalesce(percentile_disc(0.95) within group (order by ${agentRuns.latencyMs}), 0)::int`,
      })
      .from(agentRuns)
      .where(sql`${agentRuns.status} = 'ok'`)
      .groupBy(sql`date_trunc('day', ${agentRuns.createdAt})`)
      .orderBy(sql`date_trunc('day', ${agentRuns.createdAt})`)

    const verdictDistribution = await db
      .select({
        verdict: agentRuns.humanVerdict,
        count: sql<number>`count(*)::int`,
      })
      .from(agentRuns)
      .groupBy(agentRuns.humanVerdict)

    const [totals] = await db.select({ count: sql<number>`count(*)::int` }).from(agentRuns)

    return {
      themesOverTime: themesOverTime.filter((row) => row.theme !== null),
      severityByProduct: severityByProduct.filter((row) => row.product !== null),
      passRateByVersion: passRateRows.map((row) => {
        const total = row.passCount + row.failCount
        return {
          version: row.version,
          suite: row.suiteId,
          passRate: total === 0 ? 0 : row.passCount / total,
          startedAt: row.startedAt,
        }
      }),
      costByAgent,
      latencyOverTime,
      verdictDistribution,
      totalRuns: totals?.count ?? 0,
    }
  })
}
