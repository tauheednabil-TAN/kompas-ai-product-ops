import { AgentList } from '@/components/pages/agent-list'
import { AGENTS } from '@/lib/agents/registry'

export default function Page() {
  // Only serialisable data crosses to the client — prompt builders are functions
  // and must stay on the server.
  const agents = AGENTS.map((agent) => ({
    slug: agent.slug,
    name_da: agent.name_da,
    name_en: agent.name_en,
    description_da: agent.description_da,
    description_en: agent.description_en,
    versionCount: agent.versions.length,
    defaultVersion: agent.defaultVersion,
  }))

  return <AgentList agents={agents} />
}
