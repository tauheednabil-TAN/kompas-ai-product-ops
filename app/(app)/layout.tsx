import { cookies } from 'next/headers'
import { LocaleToggle } from '@/components/chrome/locale-toggle'
import { Sidebar } from '@/components/chrome/sidebar'
import { SyntheticBanner } from '@/components/chrome/synthetic-banner'
import { ThemeToggle } from '@/components/chrome/theme-toggle'
import { BANNER_COOKIE, SIDEBAR_COOKIE } from '@/lib/ui-cookies'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  const collapsed = store.get(SIDEBAR_COOKIE)?.value === '1'
  const bannerDismissed = store.get(BANNER_COOKIE)?.value === '1'

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar initialCollapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border bg-surface px-6">
          <ThemeToggle />
          <LocaleToggle />
        </header>

        <SyntheticBanner initialDismissed={bannerDismissed} />

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1240px] px-6 py-8 md:px-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
