import {
  BookOpen,
  Bot,
  ChartNoAxesColumn,
  ClipboardCheck,
  FlaskConical,
  LayoutDashboard,
  ScrollText,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { Dictionary } from './i18n/da'

export type NavItem = {
  href: string
  /** Prefix that marks this item active; `href` may point deeper than the section root. */
  match: string
  icon: LucideIcon
  label: (t: Dictionary) => string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', match: '/', icon: LayoutDashboard, label: (t) => t.nav.overblik },
  { href: '/agenter', match: '/agenter', icon: Bot, label: (t) => t.nav.agenter },
  { href: '/sagsspejl', match: '/sagsspejl', icon: ClipboardCheck, label: (t) => t.nav.sagsspejl },
  { href: '/faerdigheder', match: '/faerdigheder', icon: Wrench, label: (t) => t.nav.faerdigheder },
  {
    href: '/evalueringer',
    match: '/evalueringer',
    icon: FlaskConical,
    label: (t) => t.nav.evalueringer,
  },
  { href: '/indsigter', match: '/indsigter', icon: ChartNoAxesColumn, label: (t) => t.nav.indsigter },
  {
    href: '/revisionsspor',
    match: '/revisionsspor',
    icon: ScrollText,
    label: (t) => t.nav.revisionsspor,
  },
  { href: '/haandbog', match: '/haandbog', icon: BookOpen, label: (t) => t.nav.haandbog },
]

/**
 * Prefix matching on segment boundaries. A plain `startsWith` would light up
 * "Agenter" on a hypothetical `/agenter-arkiv`, which is a different section.
 */
export function isNavItemActive(pathname: string, match: string): boolean {
  if (match === '/') return pathname === '/'
  return pathname === match || pathname.startsWith(`${match}/`)
}
