import 'server-only'

import { desc, eq, gte, sql } from 'drizzle-orm'
import { getDb } from './index'
import { agentRuns, blockedSubmissions, type AgentRun } from './schema'

/**
 * Every query returns a discriminated result rather than throwing, so a page can
 * render a specific message for "not configured" versus "configured but
 * unreachable" versus "fine, but empty". Three genuinely different situations
 * that a generic error boundary would flatten into one useless screen.
 */
export type QueryResult<T> =
  | { state: 'ok'; data: T }
  | { state: 'not-configured' }
  | { state: 'unreachable'; error: string }

async function run<T>(fn: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<T>): Promise<QueryResult<T>> {
  const db = getDb()
  if (!db) return { state: 'not-configured' }
  try {
    return { state: 'ok', data: await fn(db) }
  } catch (error) {
    return {
      state: 'unreachable',
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function listAgentRuns(limit = 100): Promise<QueryResult<AgentRun[]>> {
  return run((db) => db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(limit))
}

export function getAgentRun(id: string): Promise<QueryResult<AgentRun | undefined>> {
  return run(async (db) => {
    const rows = await db.select().from(agentRuns).where(eq(agentRuns.id, id)).limit(1)
    return rows[0]
  })
}

export type OverviewStats = {
  runs7d: number
  spendThisMonthDkk: number
  acceptanceRate: number | null
  blockedCount: number
  recentRuns: AgentRun[]
}

export function getOverviewStats(): Promise<QueryResult<OverviewStats>> {
  return run(async (db) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const [runs7dRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agentRuns)
      .where(gte(agentRuns.createdAt, sevenDaysAgo))

    const [spendRow] = await db
      .select({ total: sql<number>`coalesce(sum(${agentRuns.costDkk}), 0)::float8` })
      .from(agentRuns)
      .where(gte(agentRuns.createdAt, monthStart))

    // Acceptance rate counts only runs a human actually judged. Including
    // pending runs in the denominator would make the number drift down purely
    // because nobody has reviewed yet, which says nothing about quality.
    const [verdictRow] = await db
      .select({
        judged: sql<number>`count(*) filter (where ${agentRuns.humanVerdict} <> 'pending')::int`,
        accepted: sql<number>`count(*) filter (where ${agentRuns.humanVerdict} = 'accepted')::int`,
      })
      .from(agentRuns)

    const [blockedRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(blockedSubmissions)

    const recentRuns = await db
      .select()
      .from(agentRuns)
      .orderBy(desc(agentRuns.createdAt))
      .limit(5)

    const judged = verdictRow?.judged ?? 0

    return {
      runs7d: runs7dRow?.count ?? 0,
      spendThisMonthDkk: spendRow?.total ?? 0,
      acceptanceRate: judged > 0 ? (verdictRow?.accepted ?? 0) / judged : null,
      blockedCount: blockedRow?.count ?? 0,
      recentRuns,
    }
  })
}
