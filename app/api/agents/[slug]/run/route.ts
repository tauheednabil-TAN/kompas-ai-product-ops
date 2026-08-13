import { streamObject } from 'ai'
import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { computeCost } from '@/lib/ai/cost'
import { hasApiKey } from '@/lib/ai/client'
import { AgentError, toAgentError } from '@/lib/ai/errors'
import { guardInput, outputContainsCpr } from '@/lib/ai/guards'
import { getAgent } from '@/lib/agents/registry'
import { buildCall, hashInput, resolveVersion } from '@/lib/agents/runner'
import { isDbConfigured, requireDb } from '@/lib/db'
import { agentRuns, blockedSubmissions } from '@/lib/db/schema'
import { isLocale } from '@/lib/i18n/config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  input: z.string(),
  version: z.string().optional(),
  locale: z.string().refine(isLocale, 'locale must be "da" or "en"'),
  /** Required, and required to be `true`, for agents that declare consent. */
  consent: z.boolean().optional(),
})

/**
 * Frames sent to the client, newline-delimited JSON.
 *
 * A plain text stream of the object's JSON would be simpler, but the client also
 * needs the run id (to attach a verdict), the real cost and latency, and a
 * typed error code. One framed stream carries all of it in order.
 */
type Frame =
  | { type: 'partial'; object: unknown }
  | {
      type: 'done'
      runId: string | null
      modelId: string
      promptVersion: string
      tokensIn: number
      tokensOut: number
      costDkk: number
      latencyMs: number
    }
  | { type: 'error'; code: string }

export async function POST(request: NextRequest, ctx: RouteContext<'/api/agents/[slug]/run'>) {
  const { slug } = await ctx.params

  const encoder = new TextEncoder()
  const send = (controller: ReadableStreamDefaultController<Uint8Array>, frame: Frame) => {
    controller.enqueue(encoder.encode(`${JSON.stringify(frame)}\n`))
  }

  try {
    const agent = getAgent(slug)
    if (!agent) throw new AgentError('unknown_agent', 404)

    const parsed = bodySchema.safeParse(await request.json())
    if (!parsed.success) throw new AgentError('bad_request', 400, parsed.error.message)
    const { input, version: requestedVersion, locale, consent } = parsed.data

    // Enforced server-side, so a checkbox removed in the DOM changes nothing.
    if (agent.requiresConsent && consent !== true) {
      throw new AgentError('consent_required', 400)
    }

    /**
     * C2 first, ahead of every other check.
     *
     * "What happens if I paste a CPR number?" must always answer "it was
     * blocked" — never "the database is not configured". Recording the blocked
     * attempt is best-effort for exactly that reason: the counter is useful, but
     * losing it must not change the answer the user gets.
     */
    const guard = guardInput(input)
    if (!guard.ok) {
      if (isDbConfigured()) {
        try {
          // Records that it happened and where — never what was pasted.
          await requireDb()
            .insert(blockedSubmissions)
            .values({ surface: `agent:${slug}`, reason: guard.code })
        } catch {
          // The counter is not worth failing the block over.
        }
      }
      throw new AgentError(guard.code, 400)
    }

    // Fail before spending a request. C4 makes the telemetry write mandatory, so
    // a run we cannot log is a run we must not start.
    if (!isDbConfigured()) throw new AgentError('no_database', 503)
    if (!hasApiKey()) throw new AgentError('auth', 503, 'GOOGLE_GENERATIVE_AI_API_KEY is not set')

    const inputParse = agent.inputSchema.safeParse(input)
    if (!inputParse.success) throw new AgentError('bad_request', 400, inputParse.error.message)

    const promptVersion = resolveVersion(agent, requestedVersion)
    const { spec, params } = buildCall(agent, promptVersion, inputParse.data, locale)

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const startedAt = Date.now()
        try {
          const result = streamObject(params)

          for await (const partial of result.partialObjectStream) {
            send(controller, { type: 'partial', object: partial })
          }

          // Rejects if the final object fails schema validation (C6).
          const object = await result.object
          const usage = await result.usage
          const latencyMs = Date.now() - startedAt
          const cost = computeCost(spec, usage)

          // Belt and braces: the model can still hallucinate a CPR number into
          // its output even though none could reach it. That must never persist.
          if (outputContainsCpr(object)) {
            const db = requireDb()
            await db
              .insert(blockedSubmissions)
              .values({ surface: `agent:${slug}`, reason: 'cpr_in_output' })
            send(controller, { type: 'error', code: 'cpr_blocked' })
            controller.close()
            return
          }

          const db = requireDb()
          const [row] = await db
            .insert(agentRuns)
            .values({
              agentSlug: agent.slug,
              promptVersion: promptVersion.version,
              modelId: spec.id,
              inputText: inputParse.data as string,
              inputHash: hashInput(input),
              outputJson: object,
              tokensIn: cost.tokensIn,
              tokensOut: cost.tokensOut,
              costDkk: cost.dkk,
              latencyMs,
              status: 'ok',
            })
            .returning({ id: agentRuns.id })

          send(controller, {
            type: 'done',
            runId: row?.id ?? null,
            modelId: spec.id,
            promptVersion: promptVersion.version,
            tokensIn: cost.tokensIn,
            tokensOut: cost.tokensOut,
            costDkk: cost.dkk,
            latencyMs,
          })
        } catch (error) {
          const agentError = toAgentError(error)

          // A failed run is still a run. Logging it is the difference between an
          // audit log and a success log.
          try {
            const db = requireDb()
            await db.insert(agentRuns).values({
              agentSlug: agent.slug,
              promptVersion: promptVersion.version,
              modelId: spec.id,
              inputText: input,
              inputHash: hashInput(input),
              latencyMs: Date.now() - startedAt,
              status: 'error',
              errorMessage: `${agentError.code}: ${agentError.detail ?? ''}`.trim(),
            })
          } catch {
            // The database is what just failed. Nothing useful left to do here;
            // the client still gets a typed error below.
          }

          send(controller, { type: 'error', code: agentError.code })
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'content-type': 'application/x-ndjson; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  } catch (error) {
    const agentError = toAgentError(error)
    return Response.json({ code: agentError.code }, { status: agentError.status })
  }
}
