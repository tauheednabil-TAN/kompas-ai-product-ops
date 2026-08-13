'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Loader2, Play } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Chip, type ChipTone } from '@/components/ui/chip'
import { PageHeader, Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { VerdictBar } from '@/components/agents/verdict-bar'
import { formatDkk } from '@/lib/ai/cost'
import { applySuggestions, diffWords } from '@/lib/diff'
import { findCprNumbers, MAX_INPUT_CHARS } from '@/lib/ai/guards'
import { enumLabel, FINDING_TONE, VERDICT_TONE } from '@/lib/i18n/enums'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n/da'
import { cn } from '@/lib/utils'

export type SeedNote = { id: string; titel: string; tekst: string }

type Finding = {
  kategori?: string
  alvorlighed?: string
  citat?: string
  begrundelse?: string
  forslag?: string
}

type Analysis = {
  samlet_vurdering?: string
  metode?: string
  fund?: (Finding | undefined)[]
  manglende_felter?: (string | undefined)[]
  styrker?: (string | undefined)[]
}

type RunMeta = {
  runId: string | null
  modelId: string
  promptVersion: string
  costDkk: number
  latencyMs: number
}

type ErrorCode = keyof Dictionary['errors']

export function Sagsspejl({ notes }: { notes: SeedNote[] }) {
  const t = useT()
  const { locale } = useLocale()

  const [input, setInput] = useState('')
  const [consent, setConsent] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [meta, setMeta] = useState<RunMeta | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [running, setRunning] = useState(false)
  const [activeFinding, setActiveFinding] = useState<number | null>(null)
  const [tab, setTab] = useState<'findings' | 'rewrite'>('findings')
  const noteRef = useRef<HTMLDivElement>(null)

  const cprMatches = findCprNumbers(input)
  const tooLong = input.length > MAX_INPUT_CHARS
  const canRun = input.trim().length >= 40 && cprMatches.length === 0 && !tooLong && consent && !running

  const findings = useMemo(
    () => (analysis?.fund ?? []).filter((f): f is Finding => Boolean(f)),
    [analysis],
  )

  async function analyse() {
    setRunning(true)
    setError(null)
    setAnalysis(null)
    setMeta(null)
    setActiveFinding(null)
    setTab('findings')

    try {
      const response = await fetch('/api/agents/sagsspejl/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, locale, consent }),
      })

      if (!response.ok || !response.body) {
        const payload: unknown = await response.json().catch(() => null)
        const code =
          typeof payload === 'object' && payload !== null && 'code' in payload
            ? String((payload as { code: unknown }).code)
            : 'unknown'
        setError(code in t.errors ? (code as ErrorCode) : 'unknown')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const frame = JSON.parse(line) as { type: string } & Record<string, unknown>
          if (frame.type === 'partial') setAnalysis(frame.object as Analysis)
          else if (frame.type === 'done') setMeta(frame as unknown as RunMeta)
          else if (frame.type === 'error') {
            const code = String(frame.code)
            setError(code in t.errors ? (code as ErrorCode) : 'unknown')
          }
        }
      }
    } catch {
      setError('unknown')
    } finally {
      setRunning(false)
    }
  }

  function jumpToQuote(index: number) {
    setActiveFinding(index)
    // Scroll the highlight into view in the left column without moving the page.
    requestAnimationFrame(() => {
      noteRef.current
        ?.querySelector(`[data-finding="${index}"]`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }

  const overallTone: ChipTone =
    analysis?.samlet_vurdering && analysis.samlet_vurdering in VERDICT_TONE
      ? VERDICT_TONE[analysis.samlet_vurdering as keyof typeof VERDICT_TONE]
      : 'neutral'

  return (
    <>
      <PageHeader title={t.modules.sagsspejl.title} subtitle={t.modules.sagsspejl.subtitle} />

      <Alert tone="info" title={t.sagsspejl.scopeNotice} className="mb-6" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: the note */}
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>{t.sagsspejl.noteTitle}</PanelTitle>
            <select
              aria-label={t.sagsspejl.pickSeed}
              value=""
              onChange={(event) => {
                const note = notes.find((n) => n.id === event.target.value)
                if (note) setInput(note.tekst)
              }}
              className="max-w-[220px] rounded-[6px] border border-border bg-surface px-1.5 py-1 text-xs text-ink"
            >
              <option value="">{t.sagsspejl.pickSeed}</option>
              {notes.map((note) => (
                <option key={note.id} value={note.id}>
                  {note.titel}
                </option>
              ))}
            </select>
          </PanelHeader>

          <PanelBody className="flex min-h-0 flex-1 flex-col gap-3">
            {analysis ? (
              <div
                ref={noteRef}
                className="max-h-[420px] overflow-y-auto rounded-[8px] border border-border bg-surface-sunk p-3 whitespace-pre-wrap"
              >
                <HighlightedNote
                  text={input}
                  findings={findings}
                  active={activeFinding}
                  onSelect={setActiveFinding}
                />
              </div>
            ) : (
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t.sagsspejl.notePlaceholder}
                spellCheck={false}
                className={cn(
                  'min-h-[320px] flex-1 resize-y rounded-[8px] border bg-surface p-3 text-ink placeholder:text-ink-faint',
                  cprMatches.length > 0 || tooLong ? 'border-danger' : 'border-border',
                )}
              />
            )}

            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-ink-faint">{t.agent.inputHint}</span>
              <span className={cn('tabular shrink-0', tooLong ? 'text-danger' : 'text-ink-faint')}>
                {t.agent.charCount(input.length, MAX_INPUT_CHARS)}
              </span>
            </div>

            {cprMatches.length > 0 ? <Alert tone="danger" title={t.errors.cpr_blocked} /> : null}
            {tooLong ? <Alert tone="danger" title={t.errors.too_long} /> : null}

            {/* Required every session. Enforced server-side too. */}
            <label className="flex cursor-pointer items-start gap-2 rounded-[8px] border border-border bg-surface-sunk p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
              />
              <span className="text-xs text-ink-muted">{t.sagsspejl.consentLabel}</span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={analyse} disabled={!canRun}>
                {running ? <Loader2 aria-hidden className="animate-spin" /> : <Play aria-hidden />}
                {running ? t.sagsspejl.analysing : t.sagsspejl.analyse}
              </Button>
              {analysis ? (
                <Button variant="ghost" onClick={() => { setAnalysis(null); setMeta(null) }}>
                  {t.agent.clear}
                </Button>
              ) : null}
            </div>
          </PanelBody>
        </Panel>

        {/* Right: findings */}
        <Panel className="flex flex-col">
          <PanelHeader>
            <div className="flex items-center gap-1">
              <TabButton active={tab === 'findings'} onClick={() => setTab('findings')}>
                {t.sagsspejl.tabFindings}
              </TabButton>
              <TabButton active={tab === 'rewrite'} onClick={() => setTab('rewrite')}>
                {t.sagsspejl.tabRewrite}
              </TabButton>
            </div>
            {analysis?.samlet_vurdering ? (
              <Chip tone={overallTone}>{enumLabel(analysis.samlet_vurdering, locale)}</Chip>
            ) : null}
          </PanelHeader>

          <PanelBody className="min-h-0 flex-1">
            {error ? <Alert tone="danger" title={t.errors[error]} /> : null}

            {!error && !analysis ? (
              <p className="py-12 text-ink-muted">{t.modules.sagsspejl.empty}</p>
            ) : null}

            {analysis && tab === 'findings' ? (
              <FindingsList
                analysis={analysis}
                findings={findings}
                input={input}
                active={activeFinding}
                onJump={jumpToQuote}
              />
            ) : null}

            {analysis && tab === 'rewrite' ? <RewriteTab input={input} findings={findings} /> : null}
          </PanelBody>

          {meta ? (
            <div className="border-t border-border px-5 py-2">
              <p className="tabular font-mono text-2xs text-ink-faint">
                {meta.modelId} · {meta.promptVersion} · {formatDkk(meta.costDkk, locale)} ·{' '}
                {meta.latencyMs} {t.units.ms}
                {meta.runId ? (
                  <>
                    {' · '}
                    <Link href="/revisionsspor" className="text-accent hover:text-accent-hover">
                      {t.sagsspejl.footerRun}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          {meta?.runId ? <VerdictBar runId={meta.runId} output={analysis} /> : null}
        </Panel>
      </div>
    </>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-[6px] px-2 py-1 text-xs font-medium transition-colors duration-[120ms]',
        active ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

/**
 * The note with each finding's quote marked inline.
 *
 * Segments are built by locating each quote's literal offset. A quote that is
 * not a literal substring simply does not get a highlight — and the findings
 * list flags it — rather than being fuzzy-matched into place, which would hide a
 * grounding failure.
 */
function HighlightedNote({
  text,
  findings,
  active,
  onSelect,
}: {
  text: string
  findings: Finding[]
  active: number | null
  onSelect: (index: number) => void
}) {
  const segments = useMemo(() => {
    type Span = { start: number; end: number; index: number }
    const spans: Span[] = []

    findings.forEach((finding, index) => {
      if (!finding.citat) return
      const start = text.indexOf(finding.citat)
      if (start === -1) return
      spans.push({ start, end: start + finding.citat.length, index })
    })

    spans.sort((a, b) => a.start - b.start)

    // Drop overlaps: two findings quoting the same passage would otherwise
    // produce nested marks and duplicated text.
    const kept: Span[] = []
    for (const span of spans) {
      const last = kept[kept.length - 1]
      if (!last || span.start >= last.end) kept.push(span)
    }

    const out: { text: string; index: number | null }[] = []
    let cursor = 0
    for (const span of kept) {
      if (span.start > cursor) out.push({ text: text.slice(cursor, span.start), index: null })
      out.push({ text: text.slice(span.start, span.end), index: span.index })
      cursor = span.end
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor), index: null })
    return out
  }, [text, findings])

  return (
    <>
      {segments.map((segment, i) =>
        segment.index === null ? (
          <span key={i} className="text-ink-muted">
            {segment.text}
          </span>
        ) : (
          <mark
            key={i}
            data-finding={segment.index}
            onClick={() => onSelect(segment.index as number)}
            className={cn(
              'cursor-pointer rounded-[3px] px-0.5 transition-colors duration-[120ms]',
              active === segment.index
                ? 'bg-accent-soft text-accent ring-1 ring-accent'
                : 'bg-warn-soft text-warn',
            )}
          >
            {segment.text}
          </mark>
        ),
      )}
    </>
  )
}

const SEVERITY_ORDER = ['Skal rettes', 'Bør rettes', 'Info']

function FindingsList({
  analysis,
  findings,
  input,
  active,
  onJump,
}: {
  analysis: Analysis
  findings: Finding[]
  input: string
  active: number | null
  onJump: (index: number) => void
}) {
  const t = useT()
  const { locale } = useLocale()

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: findings
      .map((finding, index) => ({ finding, index }))
      .filter(({ finding }) => finding.alvorlighed === severity),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="flex flex-col gap-5">
      {analysis.metode ? (
        <p className="text-xs text-ink-faint">
          {t.sagsspejl.method}: <span className="text-ink-muted">{enumLabel(analysis.metode, locale)}</span>
        </p>
      ) : null}

      {findings.length === 0 ? (
        <Alert tone="info" title={t.sagsspejl.noFindings} />
      ) : (
        grouped.map((group) => (
          <section key={group.severity}>
            <h3 className="mb-2 text-xs font-medium text-ink-faint">
              {enumLabel(group.severity, locale)}
            </h3>
            <div className="flex flex-col gap-2">
              {group.items.map(({ finding, index }) => {
                const grounded = finding.citat ? input.includes(finding.citat) : false
                const tone: ChipTone =
                  finding.alvorlighed && finding.alvorlighed in FINDING_TONE
                    ? FINDING_TONE[finding.alvorlighed as keyof typeof FINDING_TONE]
                    : 'neutral'
                return (
                  <article
                    key={index}
                    className={cn(
                      'rounded-[8px] border p-3 transition-colors duration-[120ms]',
                      active === index ? 'border-accent bg-accent-soft/40' : 'border-border',
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Chip tone={tone}>
                        {finding.kategori ? enumLabel(finding.kategori, locale) : ''}
                      </Chip>
                      {grounded ? (
                        <button
                          type="button"
                          onClick={() => onJump(index)}
                          className="text-xs font-medium text-accent hover:text-accent-hover"
                        >
                          {t.sagsspejl.jumpToQuote}
                        </button>
                      ) : (
                        <Chip tone="danger">{t.sagsspejl.quoteNotFound}</Chip>
                      )}
                    </div>

                    {finding.citat ? (
                      <blockquote className="mb-2 border-l-2 border-border pl-2 text-ink-muted italic">
                        {finding.citat}
                      </blockquote>
                    ) : null}

                    {finding.begrundelse ? (
                      <p className="mb-2 text-ink-muted">
                        <span className="text-ink-faint">{t.sagsspejl.justification}: </span>
                        {finding.begrundelse}
                      </p>
                    ) : null}

                    {finding.forslag ? (
                      <p className="rounded-[6px] bg-surface-sunk p-2 text-ink">
                        <span className="text-ink-faint">{t.sagsspejl.suggestion}: </span>
                        {finding.forslag}
                      </p>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ))
      )}

      {analysis.manglende_felter && analysis.manglende_felter.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium text-ink-faint">{t.sagsspejl.missingFields}</h3>
          <ul className="list-disc pl-5 text-ink-muted marker:text-ink-faint">
            {analysis.manglende_felter.filter(Boolean).map((field, i) => (
              <li key={i}>{field}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {analysis.styrker && analysis.styrker.length > 0 ? (
        <section>
          <h3 className="mb-2 text-xs font-medium text-ink-faint">{t.sagsspejl.strengths}</h3>
          <ul className="flex flex-col gap-1">
            {analysis.styrker.filter(Boolean).map((strength, i) => (
              <li key={i} className="flex gap-2 text-ink-muted">
                <span aria-hidden className="text-ok">
                  +
                </span>
                {strength}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function RewriteTab({ input, findings }: { input: string; findings: Finding[] }) {
  const t = useT()
  const [copied, setCopied] = useState(false)

  const { rewritten, applied, unmatched } = useMemo(
    () =>
      applySuggestions(
        input,
        findings
          .filter((f): f is Finding & { citat: string; forslag: string } =>
            Boolean(f.citat && f.forslag),
          )
          .map((f) => ({ citat: f.citat, forslag: f.forslag })),
      ),
    [input, findings],
  )

  const ops = useMemo(() => diffWords(input, rewritten), [input, rewritten])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone={applied > 0 ? 'ok' : 'neutral'}>{t.sagsspejl.rewriteApplied(applied)}</Chip>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(rewritten).then(() => setCopied(true))
          }}
        >
          {copied ? t.common.copied : t.sagsspejl.copyRewrite}
        </Button>
      </div>

      {unmatched.length > 0 ? (
        <Alert tone="warn" title={t.sagsspejl.rewriteUnmatched(unmatched.length)} />
      ) : null}

      <p className="text-xs text-ink-faint">{t.sagsspejl.rewriteHint}</p>

      <div className="flex gap-4 text-2xs text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-[2px] bg-danger-soft ring-1 ring-danger/30" />
          {t.sagsspejl.removed}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-[2px] bg-ok-soft ring-1 ring-ok/30" />
          {t.sagsspejl.added}
        </span>
      </div>

      <div className="max-h-[460px] overflow-y-auto rounded-[8px] border border-border bg-surface-sunk p-3 whitespace-pre-wrap">
        {ops.map((op, i) =>
          op.type === 'equal' ? (
            <span key={i} className="text-ink-muted">
              {op.text}
            </span>
          ) : op.type === 'delete' ? (
            <del key={i} className="bg-danger-soft text-danger no-underline line-through">
              {op.text}
            </del>
          ) : (
            <ins key={i} className="bg-ok-soft text-ok no-underline">
              {op.text}
            </ins>
          ),
        )}
      </div>
    </div>
  )
}
