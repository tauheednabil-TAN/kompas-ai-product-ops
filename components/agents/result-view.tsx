'use client'

import { Chip } from '@/components/ui/chip'
import { FeedbackTriageResult } from '@/components/agents/feedback-triage-result'
import { enumLabel, SEVERITY_TONE } from '@/lib/i18n/enums'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * Renders an agent result.
 *
 * Feedback-triage has a bespoke view because it is the demo path and every field
 * earns specific treatment. Everything else uses the generic renderer below,
 * which walks the object rather than being hand-written per agent — a
 * hand-written view per agent is four views that drift out of sync with four
 * schemas.
 */
export function ResultView({
  agentSlug,
  value,
  streaming,
  input,
}: {
  agentSlug: string
  value: unknown
  streaming: boolean
  input: string
}) {
  if (agentSlug === 'feedback-triage') {
    return <FeedbackTriageResult value={value} streaming={streaming} input={input} />
  }
  return <GenericResult value={value} streaming={streaming} input={input} />
}

/** Keys whose values are canonical enums and should render as chips. */
const ENUM_KEYS = new Set([
  'produkt',
  'tema',
  'alvorlighed',
  'risikoniveau',
  'kilde_type',
  'samlet_vurdering',
  'metode',
  'kategori',
  'påvirkede_brugere',
])

const SEVERITY_KEYS = new Set(['alvorlighed', 'risikoniveau'])

function humanise(key: string): string {
  return key.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase())
}

function GenericResult({
  value,
  streaming,
  input,
}: {
  value: unknown
  streaming: boolean
  input: string
}) {
  if (typeof value !== 'object' || value === null) return null

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
        <Field key={key} name={key} value={child} streaming={streaming} input={input} />
      ))}
    </div>
  )
}

function Field({
  name,
  value,
  streaming,
  input,
  depth = 0,
}: {
  name: string
  value: unknown
  streaming: boolean
  input: string
  depth?: number
}) {
  const { locale } = useLocale()

  if (value === undefined || value === null) return null

  if (typeof value === 'boolean') {
    return (
      <Row label={humanise(name)}>
        <Chip tone={value ? 'ok' : 'warn'}>{String(value)}</Chip>
      </Row>
    )
  }

  if (typeof value === 'string') {
    if (value.length === 0) return null

    if (ENUM_KEYS.has(name)) {
      const tone = SEVERITY_KEYS.has(name)
        ? (SEVERITY_TONE[value as keyof typeof SEVERITY_TONE] ?? 'neutral')
        : 'accent'
      return (
        <Row label={humanise(name)}>
          <Chip tone={tone}>{enumLabel(value, locale)}</Chip>
        </Row>
      )
    }

    // Any field named as a quote gets the grounding check surfaced, exactly as
    // Feedback-triage does — the guarantee should not depend on which agent ran.
    if (name.includes('citat')) {
      const grounded = input.includes(value)
      return (
        <Row label={humanise(name)}>
          <div className="flex flex-col gap-1.5">
            {!streaming ? (
              <Chip tone={grounded ? 'ok' : 'danger'}>
                {grounded
                  ? locale === 'da'
                    ? 'Findes ordret'
                    : 'Verbatim match'
                  : locale === 'da'
                    ? 'Ikke ordret i teksten'
                    : 'Not verbatim in the text'}
              </Chip>
            ) : null}
            <blockquote className="border-l-2 border-accent pl-3 text-ink-muted italic">
              {value}
            </blockquote>
          </div>
        </Row>
      )
    }

    return (
      <Row label={humanise(name)}>
        <p className={cn('text-ink', streaming && 'caret')}>{value}</p>
      </Row>
    )
  }

  if (Array.isArray(value)) {
    const items = value.filter((item) => item !== undefined && item !== null)
    if (items.length === 0) return null

    if (items.every((item) => typeof item === 'string')) {
      return (
        <Row label={humanise(name)}>
          <ul className="list-disc pl-5 text-ink-muted marker:text-ink-faint">
            {items.map((item, index) => (
              <li key={index}>{String(item)}</li>
            ))}
          </ul>
        </Row>
      )
    }

    return (
      <Row label={humanise(name)}>
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={index} className="rounded-[8px] border border-border p-3">
              <Field name="" value={item} streaming={streaming} input={input} depth={depth + 1} />
            </div>
          ))}
        </div>
      </Row>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    const body = (
      <div className={cn('flex flex-col gap-3', depth > 0 && 'gap-2')}>
        {entries.map(([key, child]) => (
          <Field
            key={key}
            name={key}
            value={child}
            streaming={streaming}
            input={input}
            depth={depth + 1}
          />
        ))}
      </div>
    )
    return name ? <Row label={humanise(name)}>{body}</Row> : body
  }

  return (
    <Row label={humanise(name)}>
      <span className="tabular text-ink">{String(value)}</span>
    </Row>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section>
      {label ? <p className="mb-1.5 text-xs font-medium text-ink-faint">{label}</p> : null}
      {children}
    </section>
  )
}
