'use client'

import { useRef, useState } from 'react'
import { Loader2, Play, Square } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { VerdictBar } from '@/components/agents/verdict-bar'
import { ResultView } from '@/components/agents/result-view'
import { formatDkk } from '@/lib/ai/cost'
import { findCprNumbers, MAX_INPUT_CHARS } from '@/lib/ai/guards'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n/da'
import { cn } from '@/lib/utils'

export type AgentMeta = {
  slug: string
  name: string
  description: string
  versions: { version: string; notes: string }[]
  defaultVersion: string
  sampleInput: string
}

type RunMeta = {
  runId: string | null
  modelId: string
  promptVersion: string
  tokensIn: number
  tokensOut: number
  costDkk: number
  latencyMs: number
}

type ErrorCode = keyof Dictionary['errors']

function isErrorCode(value: unknown, t: Dictionary): value is ErrorCode {
  return typeof value === 'string' && value in t.errors
}

export function AgentRunner({ agent }: { agent: AgentMeta }) {
  const t = useT()
  const { locale } = useLocale()

  const [input, setInput] = useState('')
  const [version, setVersion] = useState(agent.defaultVersion)
  const [partial, setPartial] = useState<unknown>(null)
  const [meta, setMeta] = useState<RunMeta | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [running, setRunning] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // Same detector the server uses, run here purely so the user gets the answer
  // instantly. The server check is the one that actually enforces C2.
  const cprMatches = findCprNumbers(input)
  const tooLong = input.length > MAX_INPUT_CHARS
  const canRun = input.trim().length >= 20 && cprMatches.length === 0 && !tooLong && !running

  async function run() {
    setRunning(true)
    setError(null)
    setPartial(null)
    setMeta(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`/api/agents/${agent.slug}/run`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, version, locale }),
        signal: controller.signal,
      })

      if (!response.ok || !response.body) {
        const payload: unknown = await response.json().catch(() => null)
        const code =
          typeof payload === 'object' && payload !== null && 'code' in payload
            ? (payload as { code: unknown }).code
            : null
        setError(isErrorCode(code, t) ? code : 'unknown')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // NDJSON: everything before the last newline is a complete frame.
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) continue
          const frame: unknown = JSON.parse(line)
          if (typeof frame !== 'object' || frame === null || !('type' in frame)) continue

          const typed = frame as { type: string } & Record<string, unknown>
          if (typed.type === 'partial') {
            setPartial(typed.object)
          } else if (typed.type === 'done') {
            setMeta(typed as unknown as RunMeta)
          } else if (typed.type === 'error') {
            setError(isErrorCode(typed.code, t) ? typed.code : 'unknown')
          }
        }
      }
    } catch (caught) {
      // An abort is the user's own doing, not an error to report.
      if (!(caught instanceof DOMException && caught.name === 'AbortError')) {
        setError('unknown')
      }
    } finally {
      setRunning(false)
      abortRef.current = null
    }
  }

  const activeVersion = agent.versions.find((v) => v.version === version)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input */}
      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>{t.agent.inputTitle}</PanelTitle>
          <div className="flex items-center gap-2">
            <label htmlFor="prompt-version" className="text-xs text-ink-muted">
              {t.agent.versionLabel}
            </label>
            <select
              id="prompt-version"
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              className="rounded-[6px] border border-border bg-surface px-1.5 py-1 font-mono text-xs text-ink"
            >
              {agent.versions.map((v) => (
                <option key={v.version} value={v.version}>
                  {v.version}
                </option>
              ))}
            </select>
          </div>
        </PanelHeader>

        <PanelBody className="flex min-h-0 flex-1 flex-col gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t.agent.inputPlaceholder}
            spellCheck={false}
            className={cn(
              'min-h-[280px] flex-1 resize-y rounded-[8px] border bg-surface p-3 text-ink',
              'placeholder:text-ink-faint',
              cprMatches.length > 0 || tooLong ? 'border-danger' : 'border-border',
            )}
          />

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-faint">{t.agent.inputHint}</span>
            <span className={cn('tabular shrink-0', tooLong ? 'text-danger' : 'text-ink-faint')}>
              {t.agent.charCount(input.length, MAX_INPUT_CHARS)}
            </span>
          </div>

          {cprMatches.length > 0 ? (
            <Alert tone="danger" title={t.errors.cpr_blocked} />
          ) : null}
          {tooLong ? <Alert tone="danger" title={t.errors.too_long} /> : null}

          {activeVersion ? (
            <div className="rounded-[8px] border border-border bg-surface-sunk p-3">
              <p className="text-2xs font-medium text-ink-faint">{t.agent.versionNotes}</p>
              <p className="mt-1 text-xs text-ink-muted">{activeVersion.notes}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={run} disabled={!canRun}>
              {running ? (
                <Loader2 aria-hidden className="animate-spin" />
              ) : (
                <Play aria-hidden />
              )}
              {running ? t.agent.running : t.agent.run}
            </Button>

            {running ? (
              <Button variant="secondary" onClick={() => abortRef.current?.abort()}>
                <Square aria-hidden />
                {t.agent.stop}
              </Button>
            ) : null}

            <Button variant="ghost" onClick={() => setInput(agent.sampleInput)}>
              {t.agent.useSample}
            </Button>
            <Button variant="ghost" onClick={() => setInput('')} disabled={input.length === 0}>
              {t.agent.clear}
            </Button>
          </div>
        </PanelBody>
      </Panel>

      {/* Result */}
      <Panel className="flex flex-col">
        <PanelHeader>
          <PanelTitle>{t.agent.resultTitle}</PanelTitle>
          {meta ? (
            <span className="tabular font-mono text-2xs text-ink-faint">
              {meta.modelId} · {meta.promptVersion} · {meta.tokensIn}/{meta.tokensOut} ·{' '}
              {formatDkk(meta.costDkk, locale)} · {meta.latencyMs} {t.units.ms}
            </span>
          ) : null}
        </PanelHeader>

        <PanelBody className="min-h-0 flex-1">
          {error ? <Alert tone="danger" title={t.errors[error]} /> : null}

          {!error && partial === null ? (
            <p className="py-12 text-ink-muted">{t.agent.resultEmpty}</p>
          ) : null}

          {partial !== null ? (
            <ResultView
              agentSlug={agent.slug}
              value={partial}
              streaming={running}
              input={input}
            />
          ) : null}
        </PanelBody>

        {meta?.runId ? <VerdictBar runId={meta.runId} output={partial} /> : null}
      </Panel>
    </div>
  )
}
