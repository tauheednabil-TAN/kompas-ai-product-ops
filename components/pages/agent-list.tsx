'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EmptyState, PageHeader, Panel } from '@/components/ui/panel'
import { Mono } from '@/components/ui/table'
import { useLocale, useT } from '@/lib/i18n/provider'

export type AgentSummary = {
  slug: string
  name_da: string
  name_en: string
  description_da: string
  description_en: string
  versionCount: number
  defaultVersion: string
}

export function AgentList({ agents }: { agents: AgentSummary[] }) {
  const t = useT()
  const { locale } = useLocale()

  return (
    <>
      <PageHeader title={t.modules.agenter.title} subtitle={t.modules.agenter.subtitle} />

      {agents.length === 0 ? (
        <Panel>
          <EmptyState message={t.modules.agenter.empty} />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {agents.map((agent) => (
            <Panel key={agent.slug} className="transition-colors duration-[120ms] hover:border-border-strong">
              <Link href={`/agenter/${agent.slug}`} className="block p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-ink">
                    {locale === 'da' ? agent.name_da : agent.name_en}
                  </h2>
                  <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                </div>
                <p className="mt-1 text-ink-muted">
                  {locale === 'da' ? agent.description_da : agent.description_en}
                </p>
                <p className="mt-3">
                  <Mono>
                    {agent.slug} · {agent.versionCount} {t.agent.versionLabel.toLowerCase()} ·{' '}
                    {agent.defaultVersion}
                  </Mono>
                </p>
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}
