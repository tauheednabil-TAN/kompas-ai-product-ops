'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DbNotice } from '@/components/db-notice'
import { EmptyState, PageHeader, Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { formatDkk } from '@/lib/ai/cost'
import { enumLabel } from '@/lib/i18n/enums'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { Locale } from '@/lib/i18n/config'
import type { QueryResult } from '@/lib/db/queries'
import type { Insights } from '@/lib/db/insight-queries'

/**
 * Chart styling follows §4: no gridlines except a faint horizontal set, one
 * accent colour as the primary series, semantic colours only where they carry
 * meaning, tabular numerals in tooltips, and an explicit empty state per chart.
 *
 * Colours are read from the CSS custom properties, so the charts re-theme with
 * everything else instead of holding a second, drifting palette.
 */
const AXIS = { fontSize: 11, fill: 'var(--ink-faint)' }
const GRID = 'var(--border)'

function tooltipStyle() {
  return {
    contentStyle: {
      background: 'var(--surface)',
      border: `1px solid ${GRID}`,
      borderRadius: 8,
      fontSize: 12,
      fontVariantNumeric: 'tabular-nums' as const,
      boxShadow: 'var(--shadow-popover)',
    },
    labelStyle: { color: 'var(--ink)' },
    itemStyle: { color: 'var(--ink-muted)' },
  }
}

/**
 * Recharts types a tooltip value as possibly undefined and possibly an array.
 * Taking `unknown` and coercing keeps the call sites readable without an `any`.
 */
function numeric(value: unknown): number {
  if (typeof value === 'number') return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const SEVERITY_COLOUR: Record<string, string> = {
  Lav: 'var(--ink-faint)',
  Middel: 'var(--info)',
  Høj: 'var(--warn)',
  Kritisk: 'var(--danger)',
}

const VERDICT_COLOUR: Record<string, string> = {
  accepted: 'var(--ok)',
  edited: 'var(--warn)',
  rejected: 'var(--danger)',
  pending: 'var(--ink-faint)',
}

export function Indsigter({ result }: { result: QueryResult<Insights> }) {
  const t = useT()
  const { locale } = useLocale()

  if (result.state !== 'ok') {
    return (
      <>
        <PageHeader title={t.modules.indsigter.title} subtitle={t.modules.indsigter.subtitle} />
        <DbNotice state={result.state} error={result.state === 'unreachable' ? result.error : undefined} />
      </>
    )
  }

  const data = result.data

  if (data.totalRuns === 0) {
    return (
      <>
        <PageHeader title={t.modules.indsigter.title} subtitle={t.modules.indsigter.subtitle} />
        <Panel>
          <EmptyState message={t.modules.indsigter.empty} />
        </Panel>
      </>
    )
  }

  const themeSeries = pivotThemes(data.themesOverTime, locale)
  const severitySeries = pivotSeverity(data.severityByProduct, locale)
  const verdictSeries = data.verdictDistribution.map((row) => ({
    name: t.verdict[row.verdict as keyof typeof t.verdict] ?? row.verdict,
    key: row.verdict,
    value: row.count,
  }))

  return (
    <>
      <PageHeader title={t.modules.indsigter.title} subtitle={t.modules.indsigter.subtitle} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Chart title={t.charts.verdictDistribution} hint={t.charts.verdictHint} empty={verdictSeries.length === 0} emptyText={t.charts.empty}>
          <PieChart>
            <Pie
              data={verdictSeries}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              // Direct labels rather than a legend: one less thing to look up.
              label={({ name, value }: { name?: string; value?: number }) => `${name}: ${value}`}
              labelLine={false}
              isAnimationActive={false}
            >
              {verdictSeries.map((entry) => (
                <Cell key={entry.key} fill={VERDICT_COLOUR[entry.key] ?? 'var(--ink-faint)'} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle()} />
          </PieChart>
        </Chart>

        <Chart title={t.charts.themesOverTime} hint={t.charts.themesOverTimeHint} empty={themeSeries.rows.length === 0} emptyText={t.charts.empty}>
          <AreaChart data={themeSeries.rows}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="week" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip {...tooltipStyle()} />
            {themeSeries.keys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stackId="themes"
                stroke="var(--accent)"
                // One accent colour; the stack is separated by opacity, not by a
                // second hue, because these categories have no semantic colour.
                fill="var(--accent)"
                fillOpacity={0.15 + (index % 5) * 0.15}
                strokeOpacity={0.6}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </Chart>

        <Chart title={t.charts.severityByProduct} empty={severitySeries.rows.length === 0} emptyText={t.charts.empty}>
          <BarChart data={severitySeries.rows} layout="vertical">
            <CartesianGrid stroke={GRID} horizontal={false} />
            <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="product" tick={AXIS} tickLine={false} axisLine={false} width={110} />
            <Tooltip {...tooltipStyle()} />
            {severitySeries.keys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="severity"
                fill={SEVERITY_COLOUR[key] ?? 'var(--accent)'}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </Chart>

        <Chart title={t.charts.passRateByVersion} empty={data.passRateByVersion.length === 0} emptyText={t.charts.empty}>
          <LineChart data={data.passRateByVersion}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="version" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis
              tick={AXIS}
              tickLine={false}
              axisLine={false}
              // Fixed 0–1 domain: auto-scaling would turn a two-point wobble
              // into a cliff.
              domain={[0, 1]}
              width={40}
              tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
            />
            <Tooltip
              {...tooltipStyle()}
              formatter={(value: unknown) => `${Math.round(numeric(value) * 100)}%`}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              stroke="var(--accent)"
              strokeWidth={1.5}
              dot={{ r: 2.5, fill: 'var(--accent)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </Chart>

        <Chart title={t.charts.costByAgent} empty={data.costByAgent.length === 0} emptyText={t.charts.empty}>
          <BarChart data={data.costByAgent}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="agent" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={52} />
            <Tooltip
              {...tooltipStyle()}
              formatter={(value: unknown) => formatDkk(numeric(value), locale)}
            />
            <Bar dataKey="costDkk" fill="var(--accent)" isAnimationActive={false} />
          </BarChart>
        </Chart>

        <Chart title={t.charts.latency} hint={t.charts.latencyHint} empty={data.latencyOverTime.length === 0} emptyText={t.charts.empty}>
          <LineChart data={data.latencyOverTime}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={44} />
            <Tooltip {...tooltipStyle()} formatter={(value: unknown) => `${numeric(value)} ms`} />
            <Line type="monotone" dataKey="p50" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="p95"
              stroke="var(--warn)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </Chart>
      </div>
    </>
  )
}

function Chart({
  title,
  hint,
  empty,
  emptyText,
  children,
}: {
  title: string
  hint?: string
  empty: boolean
  emptyText: string
  children: React.ReactElement
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>{title}</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {hint ? <p className="mb-3 text-xs text-ink-muted">{hint}</p> : null}
        {empty ? (
          <p className="py-16 text-center text-ink-faint">{emptyText}</p>
        ) : (
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {children}
            </ResponsiveContainer>
          </div>
        )}
      </PanelBody>
    </Panel>
  )
}

/** Long-form rows to one row per week with a column per theme. */
function pivotThemes(rows: Insights['themesOverTime'], locale: Locale) {
  const keys = [...new Set(rows.map((row) => row.theme))]
  const byWeek = new Map<string, Record<string, string | number>>()

  for (const row of rows) {
    const existing = byWeek.get(row.week) ?? { week: row.week }
    existing[enumLabel(row.theme, locale)] = row.count
    byWeek.set(row.week, existing)
  }

  return {
    keys: keys.map((key) => enumLabel(key, locale)),
    rows: [...byWeek.values()],
  }
}

function pivotSeverity(rows: Insights['severityByProduct'], locale: Locale) {
  const keys = [...new Set(rows.map((row) => row.severity))]
  const byProduct = new Map<string, Record<string, string | number>>()

  for (const row of rows) {
    const existing = byProduct.get(row.product) ?? { product: enumLabel(row.product, locale) }
    existing[row.severity] = row.count
    byProduct.set(row.product, existing)
  }

  return { keys, rows: [...byProduct.values()] }
}
