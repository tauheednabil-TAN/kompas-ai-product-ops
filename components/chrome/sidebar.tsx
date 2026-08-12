'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { NAV_ITEMS, isNavItemActive } from '@/lib/nav'
import { SIDEBAR_COOKIE } from '@/lib/ui-cookies'
import { cn } from '@/lib/utils'

/**
 * The collapsed state arrives from a cookie read on the server, not from
 * localStorage. A client-only read would paint the sidebar at full width and
 * then snap it narrow on every single navigation.
 */
export function Sidebar({ initialCollapsed }: { initialCollapsed: boolean }) {
  const t = useT()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(initialCollapsed)

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev
      document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'}; path=/; max-age=31536000; samesite=lax`
      return next
    })
  }

  return (
    <nav
      aria-label={t.nav.primary}
      className={cn(
        'flex shrink-0 flex-col border-r border-border bg-surface',
        // Width is the one layout property animated anywhere in the app. It is
        // chrome, not content, so nothing in the reading column reflows.
        'transition-[width] duration-[180ms] ease-[cubic-bezier(0.2,0,0,1)]',
        // Below md the rail is forced regardless of the stored preference —
        // 232px of navigation on a 375px screen leaves no room for content.
        collapsed ? 'w-[60px]' : 'w-[60px] md:w-[232px]',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-border px-3">
        <Link href="/" className="flex min-w-0 items-center gap-2 rounded-[6px] px-1 py-1 text-ink">
          <KompasMark />
          {!collapsed && (
            <span className="hidden truncate text-base font-semibold tracking-[-0.01em] md:inline">
              {t.app.name}
            </span>
          )}
        </Link>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_ITEMS.map((item) => {
          const label = item.label(t)
          const active = isNavItemActive(pathname, item.match)
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? label : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-[8px] py-2 transition-colors duration-[120ms]',
                  collapsed
                    ? 'justify-center px-0'
                    : 'justify-center px-0 md:justify-start md:px-2.5',
                  active
                    ? 'bg-accent-soft font-medium text-accent'
                    : 'text-ink-muted hover:bg-surface-sunk hover:text-ink',
                )}
              >
                <Icon aria-hidden className="size-4 shrink-0" />
                {!collapsed && <span className="hidden truncate md:inline">{label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* The toggle is desktop-only: below md the rail is not a preference. */}
      <div className="hidden border-t border-border p-2 md:block">
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? t.nav.expand : t.nav.collapse}
          title={collapsed ? t.nav.expand : t.nav.collapse}
          className={cn(
            'flex w-full items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-ink-muted',
            'transition-colors duration-[120ms] hover:bg-surface-sunk hover:text-ink',
            collapsed && 'justify-center px-0',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden className="size-4 shrink-0" />
          ) : (
            <PanelLeftClose aria-hidden className="size-4 shrink-0" />
          )}
          {!collapsed && <span className="truncate text-xs">{t.nav.collapse}</span>}
        </button>
      </div>
    </nav>
  )
}

/**
 * The wordmark. A compass needle reduced to two strokes — geometric, drawn on
 * the same grid as everything else, and it survives being 16px wide.
 */
function KompasMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className="size-5 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
    >
      <circle cx="8" cy="8" r="6.5" strokeWidth="1.25" />
      <path d="M10.5 5.5 6.8 6.8 5.5 10.5l3.7-1.3z" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  )
}
