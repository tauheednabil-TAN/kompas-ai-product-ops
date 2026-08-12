import { cn } from '@/lib/utils'

/**
 * 40px rows, sticky header on a sunk background, row hover at half-strength
 * accent tint, zebra striping off. Tabular numerals come from the base layer.
 *
 * The wrapper scrolls horizontally on its own so a wide table never makes the
 * page body scroll sideways — that is what breaks 390px mobile.
 */
export function TableWrap({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
    </div>
  )
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="sticky top-0 z-10 bg-surface-sunk">{children}</thead>
}

export function Th({ className, children, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      scope="col"
      className={cn(
        'h-9 border-b border-border px-3 text-xs font-medium whitespace-nowrap text-ink-muted',
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function Tr({ className, children, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors duration-[120ms] last:border-b-0 hover:bg-accent-soft/50',
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function Td({ className, children, ...props }: React.ComponentProps<'td'>) {
  return (
    <td className={cn('h-10 px-3 align-middle text-ink', className)} {...props}>
      {children}
    </td>
  )
}

/** Monospace cell for ids, hashes, model names and token counts. */
export function Mono({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn('font-mono text-xs text-ink-muted', className)}>{children}</span>
}
