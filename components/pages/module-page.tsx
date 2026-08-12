'use client'

import { EmptyState, PageHeader, Panel } from '@/components/ui/panel'
import { useT } from '@/lib/i18n/provider'
import type { Dictionary } from '@/lib/i18n/da'

type ModuleKey = keyof Dictionary['modules']

/**
 * The standard page shape: header, then a panel. Every module route uses this so
 * the chrome is identical everywhere and only the body differs.
 */
export function ModulePage({
  module,
  action,
  children,
}: {
  module: ModuleKey
  action?: React.ReactNode
  children?: React.ReactNode
}) {
  const t = useT()
  const copy = t.modules[module]

  return (
    <>
      <PageHeader title={copy.title} subtitle={copy.subtitle} action={action} />
      {children ?? (
        <Panel>
          <EmptyState message={copy.empty} />
        </Panel>
      )}
    </>
  )
}
