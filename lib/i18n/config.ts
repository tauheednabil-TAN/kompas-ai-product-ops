/**
 * Locale primitives shared by server and client.
 *
 * Deliberately has **no** `'use client'` directive. Server Components cannot
 * call a function that lives in a client module — everything exported from one
 * becomes a client reference. Anything both sides need lives here instead.
 */

export type Locale = 'da' | 'en'

export const LOCALE_COOKIE = 'kompas_locale'
export const DEFAULT_LOCALE: Locale = 'da'

export function isLocale(value: unknown): value is Locale {
  return value === 'da' || value === 'en'
}
