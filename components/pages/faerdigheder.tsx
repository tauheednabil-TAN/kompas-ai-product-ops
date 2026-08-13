'use client'

import { useState } from 'react'
import { Check, Download, FileText, Loader2, Wand2, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { EmptyState, PageHeader, Panel, PanelBody, PanelHeader, PanelTitle } from '@/components/ui/panel'
import { Mono } from '@/components/ui/table'
import { assembleSkillMarkdown } from '@/lib/agents/skill-builder'
import { CHECK_LABELS, validateSkill, type ValidationResult } from '@/lib/skills/validate'
import { useLocale, useT } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n/da'
import { cn } from '@/lib/utils'

export type SkillSummary = {
  file: string
  name: string
  description: string
  markdown: string
  valid: boolean
}

type Draft = { name?: string; description?: string; body_md?: string }
type ErrorCode = keyof Dictionary['errors']

export function Faerdigheder({
  skills,
  sampleInput,
  githubEnabled,
}: {
  skills: SkillSummary[]
  sampleInput: string
  githubEnabled: boolean
}) {
  const t = useT()
  const { locale } = useLocale()

  const [input, setInput] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<ErrorCode | null>(null)

  // Assembled and validated on every keystroke of the stream, so the checklist
  // fills in as the model writes rather than appearing all at once at the end.
  const markdown =
    draft?.name && draft.description && draft.body_md
      ? assembleSkillMarkdown({
          name: draft.name,
          description: draft.description,
          body_md: draft.body_md,
        })
      : null
  const validation: ValidationResult | null = markdown ? validateSkill(markdown) : null

  async function generate() {
    setRunning(true)
    setError(null)
    setDraft(null)

    try {
      const response = await fetch('/api/agents/skill-builder/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input, locale }),
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
          if (frame.type === 'partial') setDraft(frame.object as Draft)
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

  async function download() {
    if (!markdown || !draft?.name) return
    const response = await fetch('/api/skills/zip', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: draft.name, markdown }),
    })
    if (!response.ok) return

    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${draft.name}.zip`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader title={t.modules.faerdigheder.title} subtitle={t.modules.faerdigheder.subtitle} />

      <Panel className="mb-8 overflow-hidden">
        <PanelHeader>
          <PanelTitle>{t.skills.registry}</PanelTitle>
          <span className="text-xs text-ink-muted">{skills.length}</span>
        </PanelHeader>

        {skills.length === 0 ? (
          <EmptyState message={t.skills.noSkills} />
        ) : (
          <ul className="divide-y divide-border">
            {skills.map((skill) => (
              <li key={skill.file} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <FileText aria-hidden className="size-4 shrink-0 text-ink-faint" />
                  <Mono className="text-ink">{skill.name}</Mono>
                  <Chip tone="neutral">{t.skills.seeded}</Chip>
                  {skill.valid ? (
                    <Chip tone="ok">{t.skills.validationPassed}</Chip>
                  ) : (
                    <Chip tone="danger">{t.skills.invalidSkill}</Chip>
                  )}
                </div>
                <p className="mt-1.5 max-w-[68ch] text-ink-muted">{skill.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>{t.skills.describeTask}</PanelTitle>
          </PanelHeader>
          <PanelBody className="flex min-h-0 flex-1 flex-col gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.skills.describePlaceholder}
              className="min-h-[240px] flex-1 resize-y rounded-[8px] border border-border bg-surface p-3 text-ink placeholder:text-ink-faint"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={generate}
                disabled={input.trim().length < 20 || running}
              >
                {running ? <Loader2 aria-hidden className="animate-spin" /> : <Wand2 aria-hidden />}
                {running ? t.skills.generating : t.skills.generate}
              </Button>
              <Button variant="ghost" onClick={() => setInput(sampleInput)}>
                {t.agent.useSample}
              </Button>
            </div>
          </PanelBody>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader>
            <PanelTitle>{t.skills.preview}</PanelTitle>
            {validation ? (
              <Chip tone={validation.valid ? 'ok' : 'warn'}>
                {validation.valid ? t.skills.validationPassed : t.skills.validationFailed}
              </Chip>
            ) : null}
          </PanelHeader>

          <PanelBody className="flex min-h-0 flex-1 flex-col gap-4">
            {error ? <Alert tone="danger" title={t.errors[error]} /> : null}

            {!error && !markdown ? (
              <p className="py-12 text-ink-muted">{t.modules.faerdigheder.empty}</p>
            ) : null}

            {validation ? (
              <section>
                <h3 className="mb-2 text-xs font-medium text-ink-faint">{t.skills.validation}</h3>
                {/* A checklist, not a blob of errors: a list of specific things
                    that are or are not true is actionable. */}
                <ul className="flex flex-col gap-1">
                  {validation.checks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2 text-xs">
                      {check.ok ? (
                        <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ok" />
                      ) : (
                        <X aria-hidden className="mt-0.5 size-3.5 shrink-0 text-danger" />
                      )}
                      <span className={cn('min-w-0', check.ok ? 'text-ink-muted' : 'text-ink')}>
                        {CHECK_LABELS[check.id][locale]}
                        {check.detail ? (
                          <span className="block text-danger">{check.detail}</span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {markdown ? (
              <>
                <pre className="max-h-[360px] flex-1 overflow-auto rounded-[8px] border border-border bg-surface-sunk p-3 font-mono text-xs whitespace-pre-wrap">
                  {markdown}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" onClick={download} disabled={!validation?.valid}>
                    <Download aria-hidden />
                    {t.skills.downloadZip}
                  </Button>
                  {/* C8: hidden entirely when no token is configured. */}
                  {githubEnabled ? (
                    <Button variant="secondary" disabled={!validation?.valid}>
                      {t.skills.openPr}
                    </Button>
                  ) : null}
                </div>
              </>
            ) : null}
          </PanelBody>
        </Panel>
      </div>
    </>
  )
}
