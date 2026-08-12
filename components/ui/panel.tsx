import { cn } from '@/lib/utils'

/** Card / panel. 1px border, 10px radius, 20px padding. Never a shadow. */
export function Panel({
  className,
  children,
  ...props
}: React.ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-[10px] border border-border bg-surface', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export function PanelHeader({ className, children, ...props }: React.ComponentProps<'header'>) {
  return (
    <header
      className={cn('flex items-center justify-between gap-4 border-b border-border px-5 py-3', className)}
      {...props}
    >
      {children}
    </header>
  )
}

export function PanelTitle({ className, children, ...props }: React.ComponentProps<'h2'>) {
  return (
    <h2 className={cn('text-base font-semibold text-ink', className)} {...props}>
      {children}
    </h2>
  )
}

export function PanelBody({ className, children, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

/**
 * Page header. Always present, always the same shape: title, one muted subtitle
 * line, right-aligned primary action.
 */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: React.ReactNode
}) {
  return (
    <header className="mb-8 flex items-start justify-between gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.01em] text-ink">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-[68ch] text-ink-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}

/**
 * Empty state: one plain sentence explaining what appears here, plus one action.
 * Never an illustration, never "Oops!".
 */
export function EmptyState({
  message,
  action,
}: {
  message: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-4 px-5 py-12">
      <p className="max-w-[52ch] text-ink-muted">{message}</p>
      {action}
    </div>
  )
}

/** Loading skeleton. Matches final layout dimensions; never a centred spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[6px] bg-surface-sunk', className)}
      aria-hidden
    />
  )
}
