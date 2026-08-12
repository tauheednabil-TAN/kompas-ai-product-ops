'use client'

import type { Locale } from '@/lib/i18n/config'
import { useLocale, useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const OPTIONS: readonly Locale[] = ['da', 'en']

/**
 * A compact segmented control, not a dropdown and not a flag icon — flags are
 * wrong for languages (which country's flag is English?) and read as unserious
 * in a public-sector tool.
 *
 * Always visible on every route, including inside detail sheets.
 */
export function LocaleToggle() {
  const { locale, setLocale } = useLocale()
  const t = useT()

  return (
    <div
      role="group"
      aria-label={t.locale.label}
      className="inline-flex items-center rounded-[8px] border border-border bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = option === locale
        return (
          <button
            key={option}
            type="button"
            onClick={() => setLocale(option)}
            aria-pressed={active}
            // The visible label is an abbreviation; screen readers get the full name.
            aria-label={option === 'da' ? t.locale.da : t.locale.en}
            className={cn(
              'rounded-[6px] px-2 py-1 text-xs font-medium uppercase transition-colors duration-[120ms]',
              active
                ? 'bg-accent-soft text-accent'
                : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
