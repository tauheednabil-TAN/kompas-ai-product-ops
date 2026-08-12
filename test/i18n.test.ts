import { describe, expect, it } from 'vitest'
import { da } from '@/lib/i18n/da'
import { en } from '@/lib/i18n/en'
import { isNavItemActive } from '@/lib/nav'

type Node = Record<string, unknown>

/** Every leaf path in a nested dictionary, e.g. "nav.overblik". */
function paths(node: Node, prefix = ''): string[] {
  return Object.entries(node).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object') {
      return paths(value as Node, path)
    }
    return [path]
  })
}

function leafAt(node: Node, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc as Node)?.[key], node)
}

describe('dictionary parity', () => {
  const daPaths = paths(da).sort()
  const enPaths = paths(en as unknown as Node).sort()

  it('has identical key sets in both locales', () => {
    // The single most common i18n bug is a missing key silently falling back to
    // the other language. TypeScript catches most of it; this catches the rest.
    expect(enPaths).toEqual(daPaths)
  })

  it('has the same value type at every key', () => {
    for (const path of daPaths) {
      const daValue = leafAt(da, path)
      const enValue = leafAt(en as unknown as Node, path)
      expect(typeof enValue, `type mismatch at ${path}`).toBe(typeof daValue)
    }
  })

  it('has no empty strings', () => {
    for (const path of daPaths) {
      for (const [locale, dict] of [
        ['da', da],
        ['en', en as unknown as Node],
      ] as const) {
        const value = leafAt(dict, path)
        if (typeof value === 'string') {
          expect(value.trim().length, `${locale}.${path} is empty`).toBeGreaterThan(0)
        }
      }
    }
  })

  it('leaves no Danish-only characters in the English chrome', () => {
    // Catches a Danish string pasted into en.ts and never translated. Words that
    // are legitimately identical in both languages have no æøå, so this is a
    // cheap, high-signal check.
    const offenders: string[] = []
    for (const path of enPaths) {
      const value = leafAt(en as unknown as Node, path)
      if (typeof value === 'string' && /[æøåÆØÅ]/.test(value)) {
        offenders.push(`${path}: ${value}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('pluralises run counts correctly in both locales', () => {
    expect(da.audit.rowCount(1)).toBe('1 kørsel')
    expect(da.audit.rowCount(2)).toBe('2 kørsler')
    expect(en.audit.rowCount(1)).toBe('1 run')
    expect(en.audit.rowCount(2)).toBe('2 runs')
  })
})

describe('sidebar active state', () => {
  it('only marks the dashboard active on the exact root path', () => {
    expect(isNavItemActive('/', '/')).toBe(true)
    expect(isNavItemActive('/agenter', '/')).toBe(false)
  })

  it('marks a section active for its own subpaths but not for prefix collisions', () => {
    expect(isNavItemActive('/agenter', '/agenter')).toBe(true)
    expect(isNavItemActive('/agenter/feedback-triage', '/agenter')).toBe(true)
    // The playbook nav item links deeper than its section root.
    expect(isNavItemActive('/haandbog/design', '/haandbog')).toBe(true)
    // Must not match a different section that merely starts with the same text.
    expect(isNavItemActive('/agenter-arkiv', '/agenter')).toBe(false)
  })
})
