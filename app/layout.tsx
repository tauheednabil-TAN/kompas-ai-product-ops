import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import { InlineScript } from '@/components/inline-script'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from '@/lib/i18n/config'
import { LocaleProvider } from '@/lib/i18n/provider'
import { THEME_COOKIE, THEME_INIT_SCRIPT, isThemeChoice } from '@/lib/theme/config'
import { ThemeProvider } from '@/lib/theme/provider'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Kompas',
  description:
    'Internt AI Product Ops-værktøj — versionerede prompts, målte evalueringer og fuldt revisionsspor.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()

  const localeCookie = store.get(LOCALE_COOKIE)?.value
  const locale = isLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE

  const themeCookie = store.get(THEME_COOKIE)?.value
  const theme = isThemeChoice(themeCookie) ? themeCookie : 'system'

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Runs before hydration so the page never paints light and snaps to dark. */}
        <InlineScript html={THEME_INIT_SCRIPT} />
      </head>
      <body>
        <ThemeProvider initialChoice={theme}>
          <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
