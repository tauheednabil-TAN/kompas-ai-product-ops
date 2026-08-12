'use client'

import { Chip } from '@/components/ui/chip'
import { enumLabel, SEVERITY_TONE } from '@/lib/i18n/enums'
import { useLocale, useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * Renders a Feedback-triage result, including *partial* objects arriving from
 * the stream.
 *
 * Everything is optional-guarded because a partial object is not schema-valid by
 * definition — the AI SDK explicitly does not validate partials. Reading them as
 * if they were complete is the classic streaming crash.
 */
type Partial = {
  resumé?: string
  produkt?: string
  tema?: string
  alvorlighed?: string
  begrundelse_alvorlighed?: string
  fagligt_domæne?: (string | undefined)[]
  påvirkede_brugere?: string
  foreslået_user_story?: { som?: string; ønsker_jeg?: string; så_jeg?: string }
  åbne_spørgsmål?: (string | undefined)[]
  citat?: string
}

function asPartial(value: unknown): Partial {
  return typeof value === 'object' && value !== null ? (value as Partial) : {}
}

export function FeedbackTriageResult({
  value,
  streaming,
  input,
}: {
  value: unknown
  streaming: boolean
  input: string
}) {
  const t = useT()
  const { locale } = useLocale()
  const data = asPartial(value)
  const f = t.agent.fields

  const severityTone =
    data.alvorlighed && data.alvorlighed in SEVERITY_TONE
      ? SEVERITY_TONE[data.alvorlighed as keyof typeof SEVERITY_TONE]
      : 'neutral'

  // The quote must be a literal substring of the input. Showing that check in
  // the UI, not just in the eval harness, makes the grounding claim inspectable
  // by the person actually using the tool.
  const quoteGrounded = data.citat ? input.includes(data.citat) : null

  return (
    <div className="flex flex-col gap-5">
      {data.resumé !== undefined ? (
        <section>
          <Label>{f.resumé}</Label>
          <p className={cn('text-ink', streaming && 'caret')}>{data.resumé}</p>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {data.produkt ? <Chip tone="accent">{enumLabel(data.produkt, locale)}</Chip> : null}
        {data.tema ? <Chip tone="neutral">{enumLabel(data.tema, locale)}</Chip> : null}
        {data.alvorlighed ? (
          <Chip tone={severityTone}>
            {f.alvorlighed}: {enumLabel(data.alvorlighed, locale)}
          </Chip>
        ) : null}
        {data.påvirkede_brugere ? (
          <Chip tone="info">{enumLabel(data.påvirkede_brugere, locale)}</Chip>
        ) : null}
      </div>

      {data.begrundelse_alvorlighed ? (
        <section>
          <Label>{f.begrundelse_alvorlighed}</Label>
          <p className="text-ink-muted">{data.begrundelse_alvorlighed}</p>
        </section>
      ) : null}

      {data.fagligt_domæne && data.fagligt_domæne.length > 0 ? (
        <section>
          <Label>{f.fagligt_domæne}</Label>
          <div className="flex flex-wrap gap-2">
            {data.fagligt_domæne.filter(Boolean).map((domain) => (
              <Chip key={domain} tone="neutral">
                {enumLabel(domain as string, locale)}
              </Chip>
            ))}
          </div>
        </section>
      ) : null}

      {data.foreslået_user_story ? (
        <section>
          <Label>{f.foreslået_user_story}</Label>
          <div className="rounded-[8px] border border-border bg-surface-sunk p-3 text-ink">
            <p>
              <span className="text-ink-faint">{f.som} </span>
              {data.foreslået_user_story.som}
            </p>
            <p>
              <span className="text-ink-faint">{f.ønsker_jeg} </span>
              {data.foreslået_user_story.ønsker_jeg}
            </p>
            <p>
              <span className="text-ink-faint">{f.så_jeg} </span>
              {data.foreslået_user_story.så_jeg}
            </p>
          </div>
        </section>
      ) : null}

      {data.åbne_spørgsmål && data.åbne_spørgsmål.length > 0 ? (
        <section>
          <Label>{f.åbne_spørgsmål}</Label>
          <ul className="list-disc pl-5 text-ink-muted marker:text-ink-faint">
            {data.åbne_spørgsmål.filter(Boolean).map((question, index) => (
              <li key={`${index}-${question}`}>{question}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.citat ? (
        <section>
          <div className="mb-1.5 flex items-center gap-2">
            <Label className="mb-0">{f.citat}</Label>
            {quoteGrounded === true ? (
              <Chip tone="ok">{locale === 'da' ? 'Findes ordret' : 'Verbatim match'}</Chip>
            ) : quoteGrounded === false && !streaming ? (
              <Chip tone="danger">
                {locale === 'da' ? 'Ikke ordret i teksten' : 'Not verbatim in the text'}
              </Chip>
            ) : null}
          </div>
          <blockquote className="border-l-2 border-accent pl-3 text-ink-muted italic">
            {data.citat}
          </blockquote>
        </section>
      ) : null}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn('mb-1.5 text-xs font-medium text-ink-faint', className)}>{children}</p>
}
