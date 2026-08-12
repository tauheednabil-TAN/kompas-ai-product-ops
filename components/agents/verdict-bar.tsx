'use client'

import { useState, useTransition } from 'react'
import { Check, Pencil, X } from 'lucide-react'
import { setVerdict } from '@/app/actions/runs'
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
        setDrafting(null)
        setNote('')
      }
    })
  }

  if (saved) {
    return (
      <div className="flex items-center gap-2 border-t border-border px-5 py-3">
        <Chip tone={saved === 'accepted' ? 'ok' : saved === 'edited' ? 'warn' : 'danger'}>
          {t.verdict[saved]}
        </Chip>
        <span className="text-xs text-ink-muted">{t.agent.verdictSaved}</span>
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
