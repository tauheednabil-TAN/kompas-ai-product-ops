'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { writeCookie, YEAR_IN_SECONDS } from '../cookies'
import { LOCALE_COOKIE, type Locale } from './config'
import { da, type Dictionary } from './da'
import { en } from './en'

const DICTIONARIES: Record<Locale, Dictionary> = { da, en }

type LocaleContextValue = {
  locale: Locale
  t: Dictionary
  setLocale: (next: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

/**
 * Both dictionaries ship to the client. They are a few kilobytes, and holding
 * both is what lets the DA|EN toggle apply instantly with no reload and no
 * server round-trip — a requirement of §4.5.
 *
 * The cookie exists so the *server* renders `<html lang>` correctly on first
 * paint; the client is the source of truth after that.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale
  children: React.ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    // Drives `hyphens: auto` for Danish via the `html[lang="en"]` rule in
    // globals.css, and tells screen readers which language to pronounce.
    // Applied before the cookie write, so blocked cookies cannot stop it.
    document.documentElement.lang = next
    writeCookie(LOCALE_COOKIE, next, { maxAge: YEAR_IN_SECONDS })
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: DICTIONARIES[locale], setLocale }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useT / useLocale must be used inside <LocaleProvider>')
  }
  return ctx
}

/** The active dictionary. */
export function useT(): Dictionary {
  return useLocaleContext().t
}

/** The active locale plus the setter, for the toggle and for prompt calls. */
export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const { locale, setLocale } = useLocaleContext()
  return { locale, setLocale }
}
