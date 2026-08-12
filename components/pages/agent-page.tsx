'use client'

import { AgentRunner } from '@/components/agents/agent-runner'
import { PageHeader } from '@/components/ui/panel'
import { useLocale, useT } from '@/lib/i18n/provider'

export type AgentPageData = {
  slug: string
  name_da: string
  name_en: string
  description_da: string
  description_en: string
  defaultVersion: string
  sampleInput: string
  versions: { version: string; notes_da: string; notes_en: string }[]
}

export function AgentPage({ agent }: { agent: AgentPageData }) {
  const t = useT()
  const { locale } = useLocale()

  return (
    <>
      <PageHeader
        title={locale === 'da' ? agent.name_da : agent.name_en}
        subtitle={locale === 'da' ? agent.description_da : agent.description_en}
      />
      <AgentRunner
        agent={{
          slug: agent.slug,
          name: locale === 'da' ? agent.name_da : agent.name_en,
          description: locale === 'da' ? agent.description_da : agent.description_en,
          defaultVersion: agent.defaultVersion,
          sampleInput: agent.sampleInput,
          versions: agent.versions.map((v) => ({
            version: v.version,
            notes: locale === 'da' ? v.notes_da : v.notes_en,
          })),
        }}
      />
      <p className="mt-4 text-xs text-ink-faint">{t.agent.inputHint}</p>
    </>
  )
}
