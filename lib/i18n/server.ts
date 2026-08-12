import { cookies } from 'next/headers'
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config'

/**
 * Server-side locale read. Only used for first paint (`<html lang>`) and for
 * seeding the client provider — after hydration the client owns the value.
 *
 * `cookies()` is async in Next 16.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : DEFAULT_LOCALE
}
