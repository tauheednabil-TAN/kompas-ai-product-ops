'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { DbNotice } from '@/components/db-notice'
import { Alert } from '@/components/ui/alert'
import { Chip, type ChipTone } from '@/components/ui/chip'
import { EmptyState, PageHeader, Panel, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { Mono } from '@/components/ui/table'
import { formatDkk } from '@/lib/ai/cost'
import { formatPercent } from '@/lib/format'
import { compareRuns, verdictLine, type CaseDelta } from '@/lib/evals/compare'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { QueryResult } from '@/lib/db/queries'
import type { ComparisonSource } from '@/lib/db/eval-queries'
import { cn } from '@/lib/utils'

export function EvalCompare({ result }: { result: QueryResult<ComparisonSource | null> }) {
  const t = useT()
  const { locale } = useLocale()

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.evals.compareTitle} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const source = result.data
  if (!source) {
    return (
      <>
        <PageHeader title={t.evals.compareTitle} />
        <Panel>
          <EmptyState message={t.evals.noComparison} />
        </Panel>
      </>
    )
  }

  const comparison = compareRuns(source.a, source.b)
  const verdict = verdictLine(comparison, locale)

  return (
    <>
      <PageHeader
        title={`${source.suiteName}: ${comparison.a.version} → ${comparison.b.version}`}
        subtitle={t.evals.compareTitle}
      />

      {/* The one-line verdict. States the trade-off including the bad half. */}
      <Alert
        tone={
          !comparison.judgeTrustworthy
            ? 'danger'
            : comparison.passRateDeltaPp < 0
              ? 'warn'
              : 'info'
        }
        title={verdict}
        className="mb-6"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Delta
          label={t.evals.passRate}
          from={formatPercent(comparison.a.passRate, locale)}
          to={formatPercent(comparison.b.passRate, locale)}
          delta={`${comparison.passRateDeltaPp >= 0 ? '+' : ''}${comparison.passRateDeltaPp.toFixed(0)}pp`}
          good={comparison.passRateDeltaPp >= 0}
        />
        <Delta
          label={t.evals.meanScore}
          from={comparison.a.meanScore.toFixed(2)}
          to={comparison.b.meanScore.toFixed(2)}
          delta={`${comparison.meanScoreDelta >= 0 ? '+' : ''}${comparison.meanScoreDelta.toFixed(2)}`}
          good={comparison.meanScoreDelta >= 0}
        />
        <Delta
          label={t.evals.cost}
          from={formatDkk(comparison.a.totalCostDkk, locale)}
          to={formatDkk(comparison.b.totalCostDkk, locale)}
          delta={
            comparison.costDeltaPct === null
              ? '—'
              : `${comparison.costDeltaPct >= 0 ? '+' : ''}${comparison.costDeltaPct.toFixed(0)} %`
          }
          // Cheaper is better, so the sign convention inverts here.
          good={(comparison.costDeltaPct ?? 0) <= 0}
        />
        <Delta
          label={t.evals.latency}
          from={`${comparison.a.p50LatencyMs} ${t.units.ms}`}
          to={`${comparison.b.p50LatencyMs} ${t.units.ms}`}
          delta={
            comparison.latencyDeltaPct === null
              ? '—'
              : `${comparison.latencyDeltaPct >= 0 ? '+' : ''}${comparison.latencyDeltaPct.toFixed(0)} %`
          }
          good={(comparison.latencyDeltaPct ?? 0) <= 0}
        />
      </div>

      <div className="flex flex-col gap-6">
        <Bucket
          title={t.evals.worsened}
          tone="danger"
          deltas={comparison.regressed}
          source={source}
          defaultOpen
        />
        <Bucket title={t.evals.improved} tone="ok" deltas={comparison.improved} source={source} />
        <Bucket title={t.evals.unchanged} tone="neutral" deltas={comparison.unchanged} source={source} />
      </div>
    </>
  )
}

function Delta({
  label,
  from,
  to,
  delta,
  good,
}: {
  label: string
  from: string
  to: string
  delta: string
  good: boolean
}) {
  return (
    <Panel className="p-5">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="tabular mt-1 flex items-baseline gap-2">
        <span className="text-ink-faint">{from}</span>
        <span aria-hidden className="text-ink-faint">
          →
        </span>
        <span className="text-2xl font-semibold text-ink">{to}</span>
      </p>
      <p className={cn('tabular mt-1 text-xs font-medium', good ? 'text-ok' : 'text-danger')}>
        {delta}
      </p>
    </Panel>
  )
}

function Bucket({
  title,
  tone,
  deltas,
  source,
  defaultOpen = false,
}: {
  title: string
  tone: ChipTone
  deltas: CaseDelta[]
  source: ComparisonSource
  defaultOpen?: boolean
}) {
  const t = useT()

  if (deltas.length === 0) return null

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
        <Chip tone={tone}>{t.evals.caseCount(deltas.length)}</Chip>
      </PanelHeader>
      <div className="divide-y divide-border">
        {deltas.map((delta) => (
          <Row key={delta.externalId} delta={delta} source={source} defaultOpen={defaultOpen} />
        ))}
      </div>
    </Panel>
  )
}

/**
 * A regression is only useful if you can see *what* regressed, so each row
 * expands to both outputs side by side with the judge's reasoning for each.
 */
function Row({
  delta,
  source,
  defaultOpen,
}: {
  delta: CaseDelta
  source: ComparisonSource
  defaultOpen: boolean
}) {
  const t = useT()
  const { locale } = useLocale()
  const [open, setOpen] = useState(defaultOpen && delta.bucket === 'forvaerret')
  const detail = source.outputs[delta.externalId]

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors duration-[120ms] hover:bg-surface-sunk"
      >
        {open ? (
          <ChevronDown aria-hidden className="size-4 shrink-0 text-ink-faint" />
        ) : (
          <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-faint" />
        )}

        <Mono className="w-20 shrink-0">{delta.externalId}</Mono>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {delta.passChange === 'gained' ? (
            <Chip tone="ok">{`${t.evals.failed} → ${t.evals.passed}`}</Chip>
          ) : delta.passChange === 'lost' ? (
            <Chip tone="danger">{`${t.evals.passed} → ${t.evals.failed}`}</Chip>
          ) : null}
          {delta.b?.unstable ? <Chip tone="warn">{t.evals.unstable}</Chip> : null}
        </div>

        <span className="tabular shrink-0 font-mono text-xs text-ink-muted">
          {delta.a?.meanScore.toFixed(1) ?? '—'} → {delta.b?.meanScore.toFixed(1) ?? '—'}
        </span>
        <span
          className={cn(
            'tabular w-14 shrink-0 text-right font-mono text-xs font-medium',
            delta.scoreDelta > 0 ? 'text-ok' : delta.scoreDelta < 0 ? 'text-danger' : 'text-ink-faint',
          )}
        >
          {delta.scoreDelta >= 0 ? '+' : ''}
          {delta.scoreDelta.toFixed(2)}
        </span>
      </button>

      {open && detail ? (
        <div className="border-t border-border bg-surface-sunk px-5 py-4">
          <div className="mb-4">
            <p className="mb-1 flex items-center gap-2 text-2xs font-medium text-ink-faint">
              {t.evals.input}
              {locale === 'en' ? (
                <span className="rounded-[6px] border border-border px-1.5 py-0.5">
                  {t.common.sourceTextDanish}
                </span>
              ) : null}
            </p>
            <p className="text-xs whitespace-pre-wrap text-ink-muted">{detail.input}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <OutputSide
              version={source.a.promptVersion}
              output={detail.a}
              failedChecks={delta.a?.failedChecks ?? []}
            />
            <OutputSide
              version={source.b.promptVersion}
              output={detail.b}
              failedChecks={delta.b?.failedChecks ?? []}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function OutputSide({
  version,
  output,
  failedChecks,
}: {
  version: string
  output: unknown
  failedChecks: string[]
}) {
  const t = useT()
  return (
    <div className="min-w-0">
      <p className="mb-1.5 font-mono text-2xs font-medium text-ink-faint">{version}</p>
      {failedChecks.length > 0 ? (
        <ul className="mb-2 flex flex-col gap-0.5">
          {failedChecks.map((failure, index) => (
            <li key={index} className="font-mono text-2xs text-danger">
              {failure}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 font-mono text-2xs text-ok">{t.evals.deterministic}: OK</p>
      )}
      <pre className="max-h-[320px] overflow-auto rounded-[8px] border border-border bg-surface p-2 font-mono text-2xs">
        {JSON.stringify(output, null, 2)}
      </pre>
    </div>
  )
}
