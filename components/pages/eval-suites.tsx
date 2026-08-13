'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DbNotice } from '@/components/db-notice'
import { Alert } from '@/components/ui/alert'
import { Chip } from '@/components/ui/chip'
import { EmptyState, PageHeader, Panel } from '@/components/ui/panel'
import { Sparkline } from '@/components/evals/sparkline'
import { formatDkk } from '@/lib/ai/cost'
import { formatDateTime, formatPercent } from '@/lib/format'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { QueryResult } from '@/lib/db/queries'
import type { SuiteCard } from '@/lib/db/eval-queries'

export function EvalSuites({ result }: { result: QueryResult<SuiteCard[]> }) {
  const t = useT()
  const { locale } = useLocale()

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.modules.evalueringer.title} subtitle={t.modules.evalueringer.subtitle} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const suites = result.data

  return (
    <>
      <PageHeader
        title={t.modules.evalueringer.title}
        subtitle={t.modules.evalueringer.subtitle}
        action={<span className="text-2xs text-ink-faint">{t.evals.passRule}</span>}
      />

      {suites.length === 0 ? (
        <Panel>
          <EmptyState message={t.modules.evalueringer.empty} />
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {suites.map((suite) => (
            <Panel key={suite.name} className="transition-colors duration-[120ms] hover:border-border-strong">
              <Link href={`/evalueringer/${suite.name}`} className="block p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-ink">{suite.name}</h2>
                  <ArrowRight aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-faint" />
                </div>

                {suite.latest ? (
                  <>
                    {!suite.latest.judgeTrustworthy ? (
                      <Alert tone="danger" title={t.evals.judgeUntrustworthy} className="mt-3" />
                    ) : null}

                    <div className="mt-4 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-2xs text-ink-faint">{t.evals.passRate}</p>
                        <p className="tabular text-2xl font-semibold text-ink">
                          {formatPercent(suite.latest.passRate, locale)}
                        </p>
                      </div>
                      <Sparkline values={suite.trend} label={t.evals.trend} />
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
                      <Stat label={t.evals.meanScore} value={t.evals.scoreOf(suite.latest.meanScore)} />
                      <Stat label={t.evals.cost} value={formatDkk(suite.latest.totalCostDkk, locale)} />
                      <Stat label={t.evals.version} value={suite.latest.promptVersion} mono />
                      <Stat
                        label={t.evals.lastRun}
                        value={
                          suite.latest.finishedAt
                            ? formatDateTime(suite.latest.finishedAt, locale)
                            : '—'
                        }
                        mono
                      />
                    </dl>

                    {suite.versions.length > 1 ? (
                      <p className="mt-3 flex flex-wrap gap-1.5">
                        {suite.versions.map((version) => (
                          <Chip key={version} tone="neutral">
                            {version}
                          </Chip>
                        ))}
                      </p>
                    ) : null}
                  </>
                ) : (
                  <p className="mt-3 text-ink-muted">{t.evals.runSuiteHint}</p>
                )}
              </Link>
            </Panel>
          ))}
        </div>
      )}
    </>
  )
}

function Stat({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-2xs text-ink-faint">{label}</dt>
      <dd className={mono ? 'truncate font-mono text-xs text-ink' : 'tabular text-ink'}>{value}</dd>
    </div>
  )
}
