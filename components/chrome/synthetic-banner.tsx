'use client'

import { useState } from 'react'
import { ShieldAlert, X } from 'lucide-react'
import { writeCookie } from '@/lib/cookies'
import { useT } from '@/lib/i18n/provider'
// One definition, shared with the server component that reads it in the layout.
// It used to be declared here as well, which is a silent-desync waiting to happen.
import { BANNER_COOKIE } from '@/lib/ui-cookies'

/**
 * Constraint C2. Dismissible **per session, never per user** — someone who
 * dismissed this last week must still be told today that they are looking at
 * synthetic data.
 *
 * The dismissal is a *session cookie* (no max-age), not sessionStorage, so the
 * server already knows on first paint whether to render it. sessionStorage would
 * force a client-only read and flash the banner in on every navigation after a
 * dismissal.
 */
export function SyntheticBanner({ initialDismissed }: { initialDismissed: boolean }) {
  const t = useT()
  const [dismissed, setDismissed] = useState(initialDismissed)

  function dismiss() {
    // Hide first, remember second — a blocked cookie must not leave the user
    // unable to dismiss the banner at all. No max-age, so the browser drops it
    // when the session ends.
    setDismissed(true)
    writeCookie(BANNER_COOKIE, '1')
  }

  if (dismissed) return null

  return (
    <div
      role="status"
      className="flex items-center gap-3 border-b border-warn/30 bg-warn-soft px-6 py-2 text-xs text-warn md:px-8"
    >
      <ShieldAlert aria-hidden className="size-4 shrink-0" />
      <p className="min-w-0 flex-1 font-medium">{t.banner.text}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t.banner.dismiss}
        className="shrink-0 rounded-[6px] p-1 transition-colors duration-[120ms] hover:bg-warn/10"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </div>
  )
}
