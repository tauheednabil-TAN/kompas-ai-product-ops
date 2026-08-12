import {
  AlertTriangle,
  Ban,
  Check,
  CircleDashed,
  Info,
  Pencil,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A state chip. Colour never stands alone — every tone carries an icon, so the
 * meaning survives greyscale printing and colour-vision deficiency. This is a
 * hard rule from §4, not a preference.
 */
export type ChipTone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'accent'

const TONE: Record<ChipTone, { className: string; icon: LucideIcon }> = {
  ok: { className: 'bg-ok-soft text-ok border-ok/25', icon: Check },
  warn: { className: 'bg-warn-soft text-warn border-warn/25', icon: AlertTriangle },
  danger: { className: 'bg-danger-soft text-danger border-danger/25', icon: X },
  info: { className: 'bg-info-soft text-info border-info/25', icon: Info },
  accent: { className: 'bg-accent-soft text-accent border-accent/25', icon: Check },
  neutral: {
    className: 'bg-surface-sunk text-ink-muted border-border',
    icon: CircleDashed,
  },
}

export function Chip({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: ChipTone
  /** Override the tone's default icon. Never pass null — see the rule above. */
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  const spec = TONE[tone]
  const Icon = icon ?? spec.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[6px] border px-1.5 py-0.5 text-xs font-medium',
        spec.className,
        className,
      )}
    >
      <Icon aria-hidden className="size-3" />
      {children}
    </span>
  )
}

const VERDICT_TONE = {
  pending: { tone: 'neutral', icon: CircleDashed },
  accepted: { tone: 'ok', icon: Check },
  edited: { tone: 'warn', icon: Pencil },
  rejected: { tone: 'danger', icon: X },
} as const satisfies Record<string, { tone: ChipTone; icon: LucideIcon }>

export function VerdictChip({
  verdict,
  label,
}: {
  verdict: keyof typeof VERDICT_TONE
  label: string
}) {
  const spec = VERDICT_TONE[verdict]
  return (
    <Chip tone={spec.tone} icon={spec.icon}>
      {label}
    </Chip>
  )
}

const STATUS_TONE = {
  ok: { tone: 'ok', icon: Check },
  error: { tone: 'danger', icon: AlertTriangle },
  blocked: { tone: 'warn', icon: Ban },
} as const satisfies Record<string, { tone: ChipTone; icon: LucideIcon }>

export function StatusChip({
  status,
  label,
}: {
  status: keyof typeof STATUS_TONE
  label: string
}) {
  const spec = STATUS_TONE[status]
  return (
    <Chip tone={spec.tone} icon={spec.icon}>
      {label}
    </Chip>
  )
}
