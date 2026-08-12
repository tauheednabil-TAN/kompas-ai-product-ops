import { feedbackTriage } from './feedback-triage'
import type { AgentDefinition } from './types'

export const AGENTS: readonly AgentDefinition[] = [feedbackTriage]

export function getAgent(slug: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.slug === slug)
}
