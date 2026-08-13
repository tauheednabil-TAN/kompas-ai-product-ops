'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GitCompareArrows } from 'lucide-react'
import { DbNotice } from '@/components/db-notice'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { EmptyState, PageHeader, Panel } from '@/components/ui/panel'
import { Sheet } from '@/components/ui/sheet'
import { Mono, TableWrap, Td, Th, Thead, Tr } from '@/components/ui/table'
import { formatDkk } from '@/lib/ai/cost'
import { formatDateTime, formatPercent } from '@/lib/format'
import { DIMENSIONS, DIMENSION_LABELS } from '@/lib/evals/rubrics'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { QueryResult } from '@/lib/db/queries'
import type { CaseRow, SuiteDetail } from '@/lib/db/eval-queries'
import { cn } from '@/lib/utils'

export function EvalSuiteDetail({ result }: { result: QueryResult<SuiteDetail | null> }) {
  const t = useT()
  const { locale } = useLocale()
  const [selected, setSelected] = useState<CaseRow | null>(null)

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.modules.evalueringer.title} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const suite = result.data
  if (!suite) {
    return (
      <>
        <PageHeader title={t.modules.evalueringer.title} />
        <Panel>
          <EmptyState message={t.modules.evalueringer.empty} />
        </Panel>
      </>
    )
  }

  const total = suite.passCount + suite.failCount
  const passRate = total === 0 ? 0 : suite.passCount / total
  const canCompare = suite.availableVersions.length > 1

  return (
    <>
      <PageHeader
        title={suite.name}
        subtitle={`${suite.promptVersion} · ${suite.modelId} · ${formatDateTime(suite.startedAt, locale)}`}
        action={
          canCompare ? (
            <Button asChild variant="primary" size="sm">
              <Link
                href={`/evalueringer/${suite.name}/sammenlign?a=${suite.availableVersions[0]}&b=${suite.availableVersions[suite.availableVersions.length - 1]}`}
              >
                <GitCompareArrows aria-hidden />
                {t.evals.compare}
              </Link>
            </Button>
          ) : null
        }
      />

      {!suite.judgeTrustworthy ? (
        <Alert tone="danger" title={t.evals.judgeUntrustworthy} className="mb-6">
          <p>{suite.judgeTrustNote}</p>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label={t.evals.passRate} value={formatPercent(passRate, locale)} hint={`${suite.passCount}/${total}`} />
        <Metric label={t.evals.meanScore} value={t.evals.scoreOf(suite.meanScore)} />
        <Metric label={t.evals.cost} value={formatDkk(suite.totalCostDkk, locale)} />
        <Metric
          label={t.evals.latency}
          value={`${suite.p50LatencyMs} / ${suite.p95LatencyMs} ${t.units.ms}`}
          hint="p50 / p95"
        />
      </div>

      <Panel className="overflow-hidden">
        <TableWrap className="max-h-[600px] overflow-y-auto">
          <Thead>
            <Tr>
              <Th>{t.evals.caseId}</Th>
              <Th>{t.evals.result}</Th>
              {DIMENSIONS.map((dimension) => (
                <Th key={dimension} className="text-right">
                  {DIMENSION_LABELS[dimension][locale].slice(0, 4)}.
                </Th>
              ))}
              <Th className="text-right">{t.evals.meanScore}</Th>
              <Th className="text-right">{t.evals.latency}</Th>
              <Th className="text-right">{t.evals.cost}</Th>
            </Tr>
          </Thead>
          <tbody>
            {suite.cases.map((row) => (
              <Tr
                key={row.externalId}
                role="button"
                tabIndex={0}
                onClick={() => setSelected(row)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setSelected(row)
                  }
                }}
                className="cursor-pointer"
              >
                <Td className="whitespace-nowrap">
                  <Mono>{row.externalId}</Mono>
                </Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.source === 'calibration' ? (
                      <Chip tone="info">{t.evals.calibration}</Chip>
                    ) : (
                      <Chip tone={row.passed ? 'ok' : 'danger'}>
                        {row.passed ? t.evals.passed : t.evals.failed}
                      </Chip>
                    )}
                    {row.unstable ? <Chip tone="warn">{t.evals.unstable}</Chip> : null}
                  </div>
                </Td>
                {DIMENSIONS.map((dimension) => {
                  const score = row.scores?.[dimension]
                  return (
                    <Td key={dimension} className="tabular text-right">
                      <span
                        className={cn(
                          dimension === 'sikkerhed' && score !== undefined && score < 4
                            ? 'font-medium text-danger'
                            : 'text-ink-muted',
                        )}
                      >
                        {score ?? '—'}
                      </span>
                    </Td>
                  )
                })}
                <Td className="tabular text-right font-medium">{row.meanScore.toFixed(1)}</Td>
                <Td className="tabular text-right whitespace-nowrap text-ink-muted">
                  {row.latencyMs} {t.units.ms}
                </Td>
                <Td className="tabular text-right whitespace-nowrap text-ink-muted">
                  {formatDkk(row.costDkk, locale)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>

      <p className="mt-3 text-2xs text-ink-faint">{t.evals.passRule} {t.evals.safetyVeto}</p>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.externalId ?? ''}
        description={selected ? `${suite.promptVersion} · ${suite.modelId}` : undefined}
        closeLabel={t.common.close}
      >
        {selected ? <CaseDetail row={selected} /> : null}
      </Sheet>
    </>
  )
}

function CaseDetail({ row }: { row: CaseRow }) {
  const t = useT()
  const { locale } = useLocale()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {row.source === 'calibration' ? (
          <Chip tone="info">{t.evals.calibration}</Chip>
        ) : (
          <Chip tone={row.passed ? 'ok' : 'danger'}>{row.passed ? t.evals.passed : t.evals.failed}</Chip>
        )}
        <Chip tone={row.deterministicPass ? 'ok' : 'danger'}>{t.evals.deterministic}</Chip>
        {row.unstable ? <Chip tone="warn">{t.evals.unstable}</Chip> : null}
      </div>

      {row.source === 'calibration' ? (
        <Alert tone="info" title={t.evals.calibration}>
          <p>{t.evals.calibrationExplained}</p>
        </Alert>
      ) : null}

      {row.unstable ? (
        <Alert tone="warn" title={t.evals.unstable}>
          <p>{t.evals.unstableExplained}</p>
        </Alert>
      ) : null}

      {row.failedChecks.length > 0 ? (
        <Section title={t.evals.failedChecks}>
          <ul className="flex flex-col gap-1">
            {row.failedChecks.map((failure, index) => (
              <li key={index} className="font-mono text-xs text-danger">
                {failure}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {row.scores ? (
        <Section title={t.evals.judgeRationale}>
          <div className="flex flex-col gap-3">
            {DIMENSIONS.map((dimension) => (
              <div key={dimension}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-ink">
                    {DIMENSION_LABELS[dimension][locale]}
                  </span>
                  <span className="tabular font-mono text-xs text-ink-muted">
                    {row.scores?.[dimension]}
                    {row.spreads && row.spreads[dimension] > 0
                      ? ` · ${t.evals.spreadLabel} ${row.spreads[dimension]}`
                      : ''}
                  </span>
                </div>
                {/* All three rationales, so a reviewer can watch the judge
                    disagree with itself rather than seeing only the median. */}
                {row.rationales?.map((pass, index) => (
                  <p key={index} className="mt-1 text-xs text-ink-muted">
                    <span className="text-ink-faint">{t.evals.judgePass(index + 1)}: </span>
                    {pass[dimension]}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {row.rubricNotes ? (
        <Section title={t.evals.rubricNotes}>
          <p className="text-ink-muted">{row.rubricNotes}</p>
        </Section>
      ) : null}

      <Section title={t.evals.input} sourceChip>
        <pre className="whitespace-pre-wrap font-sans text-ink-muted">{row.inputText}</pre>
      </Section>

      <Section title={t.evals.output}>
        <pre className="overflow-x-auto rounded-[8px] border border-border bg-surface-sunk p-3 font-mono text-xs">
          {JSON.stringify(row.outputJson, null, 2)}
        </pre>
      </Section>
    </div>
  )
}

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

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Panel className="p-5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="tabular mt-1 text-2xl font-semibold text-ink">{value}</p>
      {hint ? <p className="tabular mt-1 text-2xs text-ink-faint">{hint}</p> : null}
    </Panel>
  )
}
