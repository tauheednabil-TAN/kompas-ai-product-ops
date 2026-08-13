'use server'

import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireDb } from '@/lib/db'
import { agentRuns, evalCases, evalSuites } from '@/lib/db/schema'

const schema = z.object({
  runId: z.uuid(),
  rationale: z.string().min(10).max(2000),
})

export type AddCaseResult =
  | { ok: true; externalId: string; jsonl: string; agentSlug: string }
  | { ok: false; code: 'bad_request' | 'not_found' | 'no_database' }

/**
 * Turn a rejected run into a permanent regression test.
 *
 * This is the loop that makes Kompas a product rather than a demo: a real
 * failure that a human noticed becomes a case that can never silently come back.
 *
 * Two destinations on purpose. The row goes in the database so the case is
 * visible in the UI immediately, and the JSONL line is handed back so it can be
 * committed to `evals/<agent>/cases.jsonl`. The file is the source of truth for
 * `npm run eval` and for CI — a case that only exists in a database is not a
 * regression test, it is a note.
 */
export async function addRejectionAsEvalCase(input: unknown): Promise<AddCaseResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, code: 'bad_request' }

  try {
    const db = requireDb()

    const [run] = await db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.id, parsed.data.runId))
      .limit(1)

    if (!run) return { ok: false, code: 'not_found' }

    const [suite] = await db
      .insert(evalSuites)
      .values({ agentSlug: run.agentSlug, name: run.agentSlug, description: '' })
      .onConflictDoUpdate({ target: evalSuites.name, set: { agentSlug: run.agentSlug } })
      .returning({ id: evalSuites.id })

    if (!suite) return { ok: false, code: 'no_database' }

    // Short, stable, and sortable by creation. Full timestamps would make the
    // ids unreadable in the case table.
    const externalId = `rej-${run.id.slice(0, 8)}`

    await db
      .insert(evalCases)
      .values({
        suiteId: suite.id,
        externalId,
        inputText: run.inputText,
        expectedJson: null,
        mustInclude: [],
        mustNotInclude: [],
        rubricNotes: parsed.data.rationale,
        source: 'from_rejection',
      })
      .onConflictDoNothing()

    const jsonl = JSON.stringify({
      id: externalId,
      input: run.inputText,
      must_include: [],
      must_not_include: [],
      expected: null,
      rubric_notes: parsed.data.rationale,
      source: 'from_rejection',
      locale: 'da',
    })

    return { ok: true, externalId, jsonl, agentSlug: run.agentSlug }
  } catch {
    return { ok: false, code: 'no_database' }
  }
}
