'use client'

import { useState, useTransition } from 'react'
import { Check, FlaskConical, Pencil, X } from 'lucide-react'
import { setVerdict } from '@/app/actions/runs'
import { addRejectionAsEvalCase } from '@/app/actions/eval-cases'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { useT } from '@/lib/i18n/provider'

type Verdict = 'accepted' | 'edited' | 'rejected'

/**
 * Constraint C3 made concrete. Every output surface carries this bar, and the
 * notice above it says in plain language that nothing happens on its own.
 *
 * A rejection asks for a note, because the note is what makes the rejection
 * useful later: Phase 4 turns rejected runs into permanent eval cases.
 */
export function VerdictBar({ runId, output }: { runId: string; output: unknown }) {
  const t = useT()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState<Verdict | null>(null)
  const [drafting, setDrafting] = useState<Verdict | null>(null)
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [caseJsonl, setCaseJsonl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function submit(verdict: Verdict, withNote: string) {
    startTransition(async () => {
      const result = await setVerdict({
        runId,
        verdict,
        note: withNote.trim() || undefined,
        editedOutput: verdict === 'edited' ? output : undefined,
      })
      if (result.ok) {
        setSaved(verdict)
        setSavedNote(withNote.trim())
        setDrafting(null)
        setNote('')
      }
    })
  }

  function promote() {
    startTransition(async () => {
      const result = await addRejectionAsEvalCase({ runId, rationale: savedNote })
      if (result.ok) setCaseJsonl(result.jsonl)
    })
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-3 border-t border-border px-5 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={saved === 'accepted' ? 'ok' : saved === 'edited' ? 'warn' : 'danger'}>
            {t.verdict[saved]}
          </Chip>
          <span className="text-xs text-ink-muted">{t.agent.verdictSaved}</span>

          {/* The loop that makes this a product: a real failure a human caught
              becomes a case that can never silently come back. */}
          {saved === 'rejected' && savedNote.length >= 10 && caseJsonl === null ? (
            <Button variant="secondary" size="sm" onClick={promote} disabled={pending}>
              <FlaskConical aria-hidden />
              {t.agent.addAsEvalCase}
            </Button>
          ) : null}
        </div>

        {caseJsonl ? (
          <Alert tone="ok" title={t.agent.evalCaseCreated}>
            <p className="mb-2">{t.agent.evalCaseCommitHint}</p>
            <pre className="max-h-32 overflow-auto rounded-[6px] border border-border bg-surface-sunk p-2 font-mono text-2xs whitespace-pre-wrap">
              {caseJsonl}
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => {
                void navigator.clipboard.writeText(caseJsonl).then(() => setCopied(true))
              }}
            >
              {copied ? t.common.copied : t.common.copy}
            </Button>
          </Alert>
        ) : null}
      </div>
    )
  }

  return (
    <div className="border-t border-border px-5 py-3">
      <p className="mb-3 text-xs text-ink-muted">{t.agent.proposalNotice}</p>

      {drafting ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="verdict-note" className="text-xs text-ink-faint">
            {t.agent.noteLabel}
          </label>
          <textarea
            id="verdict-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.agent.notePlaceholder}
            rows={3}
            className="w-full resize-y rounded-[8px] border border-border bg-surface p-2 text-ink placeholder:text-ink-faint"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDrafting(null)} disabled={pending}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => submit(drafting, note)}
              disabled={pending}
            >
              {t.agent.submitVerdict}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => submit('accepted', '')}
            disabled={pending}
          >
            <Check aria-hidden />
            {t.agent.accept}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setDrafting('edited')}
            disabled={pending}
          >
            <Pencil aria-hidden />
            {t.agent.edit}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDrafting('rejected')}
            disabled={pending}
          >
            <X aria-hidden />
            {t.agent.reject}
          </Button>
        </div>
      )}
    </div>
  )
}
