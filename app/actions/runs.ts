'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireDb } from '@/lib/db'
import { agentRuns } from '@/lib/db/schema'

const verdictSchema = z.object({
  runId: z.uuid(),
  verdict: z.enum(['accepted', 'edited', 'rejected']),
  note: z.string().max(2000).optional(),
  /** Present only for 'edited': what the human changed the output to. */
  editedOutput: z.unknown().optional(),
})

export type VerdictResult = { ok: true } | { ok: false; code: 'bad_request' | 'no_database' }

/**
 * Constraint C3: every AI output is a proposal, and this is where a human turns
 * it into a decision. The verdict is what the eval harness later mines for real
 * failures, so it is stored on the run itself rather than in a side table.
 */
export async function setVerdict(input: unknown): Promise<VerdictResult> {
  const parsed = verdictSchema.safeParse(input)
  if (!parsed.success) return { ok: false, code: 'bad_request' }

  try {
    const db = requireDb()
    await db
      .update(agentRuns)
      .set({
        humanVerdict: parsed.data.verdict,
        humanNote: parsed.data.note ?? null,
        editedOutput: parsed.data.editedOutput ?? null,
        verdictAt: new Date(),
      })
      .where(eq(agentRuns.id, parsed.data.runId))
  } catch {
    return { ok: false, code: 'no_database' }
  }

  revalidatePath('/revisionsspor')
  revalidatePath('/')
  return { ok: true }
}
