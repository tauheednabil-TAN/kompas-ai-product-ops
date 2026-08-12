import { AlertTriangle, Info, ShieldAlert, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AlertTone = 'info' | 'warn' | 'danger'

const TONE: Record<AlertTone, { className: string; icon: LucideIcon }> = {
  info: { className: 'border-info/30 bg-info-soft text-info', icon: Info },
  warn: { className: 'border-warn/30 bg-warn-soft text-warn', icon: AlertTriangle },
  danger: { className: 'border-danger/30 bg-danger-soft text-danger', icon: ShieldAlert },
}

/**
 * Inline, specific, actionable. Errors name what failed and what to do about it
 * — never "Something went wrong."
 */
export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: AlertTone
  title: string
  children?: React.ReactNode
  className?: string
}) {
  const spec = TONE[tone]
  const Icon = spec.icon
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-[10px] border p-4', spec.className, className)}
    >
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        {children ? <div className="mt-1 text-ink-muted">{children}</div> : null}
      </div>
    </div>
  )
}
