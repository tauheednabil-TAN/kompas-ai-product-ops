'use client'

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import type { ThemeChoice } from '@/lib/theme/config'
import { useTheme } from '@/lib/theme/provider'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { choice, setChoice } = useTheme()
  const t = useT()

  const options: readonly { value: ThemeChoice; icon: LucideIcon; label: string }[] = [
    { value: 'light', icon: Sun, label: t.theme.light },
    { value: 'dark', icon: Moon, label: t.theme.dark },
    { value: 'system', icon: Monitor, label: t.theme.system },
  ]

  return (
    <div
      role="group"
      aria-label={t.theme.label}
      className="inline-flex items-center rounded-[8px] border border-border bg-surface p-0.5"
    >
      {options.map(({ value, icon: Icon, label }) => {
        const active = value === choice
        return (
          <button
            key={value}
            type="button"
            onClick={() => setChoice(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              'rounded-[6px] p-1.5 transition-colors duration-[120ms]',
              active
                ? 'bg-accent-soft text-accent'
                : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
            )}
          >
            <Icon aria-hidden className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
