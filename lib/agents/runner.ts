import 'server-only'

import { createHash } from 'node:crypto'
import { generateObject } from 'ai'
import { MAX_RETRIES, REQUEST_TIMEOUT_MS, resolveModel } from '@/lib/ai/client'
import { computeCost } from '@/lib/ai/cost'
import { AgentError, toAgentError } from '@/lib/ai/errors'
import type { Locale } from '@/lib/i18n/config'
import { findVersion, type AgentDefinition, type PromptVersion } from './types'

export function hashInput(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

export type RunTelemetry = {
  modelId: string
  promptVersion: string
  tokensIn: number
  tokensOut: number
  costDkk: number
  latencyMs: number
}

/**
 * Everything needed to make the call, assembled once.
 *
 * Streaming (the UI) and non-streaming (the eval harness) must use *identical*
 * prompts, temperature and provider options, or eval scores would be measuring a
 * different thing from what users actually get. Sharing this builder is what
 * guarantees that.
 */
export function buildCall(
  agent: AgentDefinition,
  version: PromptVersion,
  input: string,
  locale: Locale,
) {
  const { spec, model, providerOptions } = resolveModel(version.tier)
  return {
    spec,
    params: {
      model,
      schema: agent.outputSchema,
      schemaName: agent.slug,
      system: version.system(locale),
      prompt: version.build(input, locale),
      temperature: version.temperature,
      providerOptions,
      maxRetries: MAX_RETRIES,
      abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  }
}

export function resolveVersion(agent: AgentDefinition, requested: string | undefined): PromptVersion {
  const version = findVersion(agent.versions, requested, agent.defaultVersion)
  if (!version) throw new AgentError('unknown_version', 400, requested)
  return version
}

export type RunOnceResult = {
  output: unknown
  telemetry: RunTelemetry
}

/**
 * One non-streaming call. Used by the eval harness and by the judge.
 *
 * Throws an `AgentError` on failure so callers get a stable code rather than a
 * provider-shaped exception.
 */
export async function runAgentOnce(
  agent: AgentDefinition,
  requestedVersion: string | undefined,
  input: string,
  locale: Locale,
): Promise<RunOnceResult> {
  const version = resolveVersion(agent, requestedVersion)
  const { spec, params } = buildCall(agent, version, input, locale)

  const startedAt = Date.now()
  try {
    const result = await generateObject(params)
    const cost = computeCost(spec, result.usage)
    return {
      output: result.object,
      telemetry: {
        modelId: spec.id,
        promptVersion: version.version,
        tokensIn: cost.tokensIn,
        tokensOut: cost.tokensOut,
        costDkk: cost.dkk,
        latencyMs: Date.now() - startedAt,
      },
    }
  } catch (error) {
    throw toAgentError(error)
  }
}
