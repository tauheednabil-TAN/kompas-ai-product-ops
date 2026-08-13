import { feedbackTriage } from './feedback-triage'
import { regelRadar } from './regel-radar'
import { releaseNoter } from './release-noter'
import { sagsspejl } from './sagsspejl'
import { skillBuilder } from './skill-builder'
import type { AgentDefinition } from './types'

/**
 * Agents that appear on /agenter and have their own eval suite.
 *
 * The skill builder is deliberately not here: it produces developer tooling, not
 * a proposal about a citizen or a product, so it has no verdict workflow and no
 * eval suite. It is still an agent — same runtime, same telemetry, same audit
 * row — it just lives on its own page.
 */
export const AGENTS: readonly AgentDefinition[] = [
  feedbackTriage,
  sagsspejl,
  releaseNoter,
  regelRadar,
]

const ALL: readonly AgentDefinition[] = [...AGENTS, skillBuilder]

export function getAgent(slug: string): AgentDefinition | undefined {
  return ALL.find((agent) => agent.slug === slug)
}
