import type { Locale } from './i18n/config'

const TAG: Record<Locale, string> = { da: 'da-DK', en: 'en-GB' }

/** Date + time for tables and detail panels. Always 24-hour, always zero-padded. */
export function formatDateTime(value: Date | string, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(TAG[locale], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatDate(value: Date | string, locale: Locale): string {
  const date = value instanceof Date ? value : new Date(value)
  return new Intl.DateTimeFormat(TAG[locale], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(TAG[locale]).format(value)
}

export function formatPercent(fraction: number, locale: Locale, digits = 0): string {
  return new Intl.NumberFormat(TAG[locale], {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(fraction)
}
