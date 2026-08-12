'use client'

import { Alert } from '@/components/ui/alert'
import { useT } from '@/lib/i18n/provider'

/**
 * "Not configured" and "unreachable" are genuinely different problems with
 * genuinely different fixes, so they get different messages. A generic error
 * boundary would flatten both into one useless screen.
 */
export function DbNotice({ state, error }: { state: 'not-configured' | 'unreachable'; error?: string }) {
  const t = useT()

  if (state === 'not-configured') {
    return (
      <Alert tone="warn" title={t.db.notConfiguredTitle}>
        <p>{t.db.notConfiguredBody}</p>
      </Alert>
    )
  }

  return (
    <Alert tone="danger" title={t.db.unreachableTitle}>
      <p>{t.db.unreachableBody}</p>
      {error ? <p className="mt-2 font-mono text-xs break-all">{error}</p> : null}
    </Alert>
  )
}
