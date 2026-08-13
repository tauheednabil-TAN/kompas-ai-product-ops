import { feedbackTriage } from './feedback-triage'
import { sagsspejl } from './sagsspejl'
import type { AgentDefinition } from './types'

export const AGENTS: readonly AgentDefinition[] = [feedbackTriage, sagsspejl]

export function getAgent(slug: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.slug === slug)
}
