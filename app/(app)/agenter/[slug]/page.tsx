import { notFound } from 'next/navigation'
import { AgentPage } from '@/components/pages/agent-page'
import { AGENTS, getAgent } from '@/lib/agents/registry'

export function generateStaticParams() {
  return AGENTS.map((agent) => ({ slug: agent.slug }))
}

export default async function Page(props: PageProps<'/agenter/[slug]'>) {
  const { slug } = await props.params
  const agent = getAgent(slug)
  if (!agent) notFound()

  return (
    <AgentPage
      agent={{
        slug: agent.slug,
        name_da: agent.name_da,
        name_en: agent.name_en,
        description_da: agent.description_da,
        description_en: agent.description_en,
        defaultVersion: agent.defaultVersion,
        sampleInput: String(agent.sampleInput),
        versions: agent.versions.map((v) => ({
          version: v.version,
          notes_da: v.notes_da,
          notes_en: v.notes_en,
        })),
      }}
    />
  )
}
