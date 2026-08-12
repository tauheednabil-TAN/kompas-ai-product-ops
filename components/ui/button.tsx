'use client'

import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Borders, not shadows. One accent colour. 500 weight, never 600 or 700 on a
 * control. 120ms transitions on colour only — no transform, no scale.
 */
const button = cva(
  'inline-flex items-center justify-center gap-2 rounded-[8px] border font-medium ' +
    'whitespace-nowrap transition-colors duration-[120ms] ease-[cubic-bezier(0.2,0,0,1)] ' +
    'disabled:pointer-events-none disabled:opacity-45 ' +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover',
        secondary:
          'border-border bg-surface text-ink hover:border-border-strong hover:bg-surface-sunk',
        ghost: 'border-transparent bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink',
        danger:
          'border-danger bg-transparent text-danger hover:bg-danger-soft',
      },
      size: {
        sm: 'h-8 px-2.5 text-xs',
        md: 'h-9 px-3.5 text-base',
        icon: 'size-8 p-0',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof button> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(button({ variant, size }), className)} {...props} />
}
