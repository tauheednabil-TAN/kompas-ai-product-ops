'use client'

import Link from 'next/link'
import { DbNotice } from '@/components/db-notice'
import { StatusChip } from '@/components/ui/chip'
import { EmptyState, PageHeader, Panel, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { Mono, TableWrap, Td, Th, Thead, Tr } from '@/components/ui/table'
import { formatDkk } from '@/lib/ai/cost'
import { formatDateTime, formatInteger, formatPercent } from '@/lib/format'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { OverviewStats, QueryResult } from '@/lib/db/queries'

export function Overblik({ result }: { result: QueryResult<OverviewStats> }) {
  const t = useT()
  const { locale } = useLocale()

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.overblik.title} subtitle={t.overblik.subtitle} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const stats = result.data

  return (
    <>
      <PageHeader title={t.overblik.title} subtitle={t.overblik.subtitle} />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t.overblik.runs7d} value={formatInteger(stats.runs7d, locale)} />
        <Metric label={t.overblik.spendMonth} value={formatDkk(stats.spendThisMonthDkk, locale)} />
        <Metric
          label={t.overblik.acceptanceRate}
          value={
            stats.acceptanceRate === null
              ? '—'
              : formatPercent(stats.acceptanceRate, locale)
          }
          hint={stats.acceptanceRate === null ? t.overblik.noVerdictsYet : undefined}
        />
        <Metric
          label={t.overblik.blockedCpr}
          value={formatInteger(stats.blockedCount, locale)}
          hint={t.overblik.blockedHint}
        />
      </div>

      <Panel className="overflow-hidden">
        <PanelHeader>
          <PanelTitle>{t.overblik.recentRuns}</PanelTitle>
          <Link
            href="/revisionsspor"
            className="text-xs font-medium text-accent hover:text-accent-hover"
          >
            {t.audit.title}
          </Link>
        </PanelHeader>

        {stats.recentRuns.length === 0 ? (
          <EmptyState message={t.audit.empty} />
        ) : (
          <TableWrap>
            <Thead>
              <Tr>
                <Th>{t.units.created}</Th>
                <Th>{t.units.agent}</Th>
                <Th>{t.units.promptVersion}</Th>
                <Th className="text-right">{t.units.cost}</Th>
                <Th>{t.units.status}</Th>
              </Tr>
            </Thead>
            <tbody>
              {stats.recentRuns.map((run) => (
                <Tr key={run.id}>
                  <Td className="whitespace-nowrap">
                    <Mono>{formatDateTime(run.createdAt, locale)}</Mono>
                  </Td>
                  <Td>{run.agentSlug}</Td>
                  <Td>
                    <Mono>{run.promptVersion}</Mono>
                  </Td>
                  <Td className="text-right tabular whitespace-nowrap">
                    {formatDkk(run.costDkk, locale)}
                  </Td>
                  <Td>
                    <StatusChip status={run.status} label={t.status[run.status]} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="p-5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-2xs text-ink-faint">{hint}</p> : null}
    </Panel>
  )
}
