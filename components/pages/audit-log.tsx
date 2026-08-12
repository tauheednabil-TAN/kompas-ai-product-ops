'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { StatusChip, VerdictChip } from '@/components/ui/chip'
import { DbNotice } from '@/components/db-notice'
import { EmptyState, PageHeader, Panel } from '@/components/ui/panel'
import { Sheet } from '@/components/ui/sheet'
import { Mono, TableWrap, Td, Th, Thead, Tr } from '@/components/ui/table'
import { formatDkk } from '@/lib/ai/cost'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { QueryResult } from '@/lib/db/queries'
import type { AgentRun } from '@/lib/db/schema'
import { formatDateTime } from '@/lib/format'

export function AuditLog({ result }: { result: QueryResult<AgentRun[]> }) {
  const t = useT()
  const { locale } = useLocale()
  const [selected, setSelected] = useState<AgentRun | null>(null)

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.audit.title} subtitle={t.audit.subtitle} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const runs = result.data

  return (
    <>
      <PageHeader
        title={t.audit.title}
        subtitle={t.audit.subtitle}
        action={<span className="tabular text-xs text-ink-muted">{t.audit.rowCount(runs.length)}</span>}
      />

      <Panel className="overflow-hidden">
        {runs.length === 0 ? (
          <EmptyState
            message={t.audit.empty}
            action={
              <Button asChild variant="primary" size="sm">
                <Link href="/agenter">{t.audit.emptyAction}</Link>
              </Button>
            }
          />
        ) : (
          <TableWrap>
            <Thead>
              <Tr>
                <Th>{t.units.created}</Th>
                <Th>{t.units.agent}</Th>
                <Th>{t.units.promptVersion}</Th>
                <Th>{t.units.model}</Th>
                <Th className="text-right">{t.units.tokens}</Th>
                <Th className="text-right">{t.units.cost}</Th>
                <Th className="text-right">{t.units.latency}</Th>
                <Th>{t.units.status}</Th>
                <Th>{t.verdict.label}</Th>
              </Tr>
            </Thead>
            <tbody>
              {runs.map((run) => (
                <Tr
                  key={run.id}
                  onClick={() => setSelected(run)}
                  tabIndex={0}
                  role="button"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setSelected(run)
                    }
                  }}
                  className="cursor-pointer"
                >
                  <Td className="whitespace-nowrap">
                    <Mono>{formatDateTime(run.createdAt, locale)}</Mono>
                  </Td>
                  <Td className="whitespace-nowrap">{run.agentSlug}</Td>
                  <Td>
                    <Mono>{run.promptVersion}</Mono>
                  </Td>
                  <Td>
                    <Mono>{run.modelId}</Mono>
                  </Td>
                  <Td className="text-right tabular whitespace-nowrap">
                    <Mono>
                      {run.tokensIn} / {run.tokensOut}
                    </Mono>
                  </Td>
                  <Td className="text-right tabular whitespace-nowrap">
                    {formatDkk(run.costDkk, locale)}
                  </Td>
                  <Td className="text-right tabular whitespace-nowrap">
                    {run.latencyMs} {t.units.ms}
                  </Td>
                  <Td>
                    <StatusChip status={run.status} label={t.status[run.status]} />
                  </Td>
                  <Td>
                    <VerdictChip verdict={run.humanVerdict} label={t.verdict[run.humanVerdict]} />
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected ? selected.agentSlug : ''}
        description={selected ? formatDateTime(selected.createdAt, locale) : undefined}
        closeLabel={t.common.close}
      >
        {selected ? <RunDetail run={selected} /> : null}
      </Sheet>
    </>
  )
}

function RunDetail({ run }: { run: AgentRun }) {
  const t = useT()
  const { locale } = useLocale()

  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label={t.units.promptVersion} value={run.promptVersion} mono />
        <Field label={t.units.model} value={run.modelId} mono />
        <Field label={t.units.tokensIn} value={String(run.tokensIn)} mono />
        <Field label={t.units.tokensOut} value={String(run.tokensOut)} mono />
        <Field label={t.units.cost} value={formatDkk(run.costDkk, locale)} />
        <Field label={t.units.latency} value={`${run.latencyMs} ${t.units.ms}`} />
        <Field label={t.audit.inputHash} value={run.inputHash.slice(0, 16)} mono />
        <Field
          label={t.verdict.label}
          value={t.verdict[run.humanVerdict]}
        />
      </dl>

      {run.errorMessage ? (
        <Section title={t.audit.errorMessage}>
          <p className="text-danger">{run.errorMessage}</p>
        </Section>
      ) : null}

      <Section title={t.audit.inputText} sourceChip>
        <pre className="whitespace-pre-wrap font-sans text-ink-muted">{run.inputText}</pre>
      </Section>

      {run.outputJson ? (
        <Section title={t.audit.outputText}>
          <pre className="overflow-x-auto rounded-[8px] border border-border bg-surface-sunk p-3 font-mono text-xs">
            {JSON.stringify(run.outputJson, null, 2)}
          </pre>
        </Section>
      ) : null}

      {run.humanNote ? (
        <Section title={t.audit.humanNote}>
          <p className="text-ink-muted">{run.humanNote}</p>
        </Section>
      ) : null}
    </div>
  )
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs text-ink' : 'tabular text-ink'}>{value}</dd>
    </div>
  )
}

/**
 * `sourceChip` marks a region holding Danish domain content. In English mode it
 * gets a muted "Source text (Danish)" label rather than being translated —
 * language Layer 3.
 */
function Section({
  title,
  sourceChip = false,
  children,
}: {
  title: string
  sourceChip?: boolean
  children: React.ReactNode
}) {
  const t = useT()
  const { locale } = useLocale()
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-2">
        <h3 className="text-xs font-medium text-ink-faint">{title}</h3>
        {sourceChip && locale === 'en' ? (
          <span className="rounded-[6px] border border-border px-1.5 py-0.5 text-2xs text-ink-faint">
            {t.common.sourceTextDanish}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  )
}
