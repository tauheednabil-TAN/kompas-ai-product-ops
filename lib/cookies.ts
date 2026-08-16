/**
 * Cookie writes that cannot break the UI.
 *
 * `document.cookie = …` is not guaranteed to succeed. It throws or silently
 * no-ops inside a sandboxed iframe without `allow-same-origin`, under a strict
 * third-party-cookie policy, and in some privacy modes — all of which are
 * ordinary conditions for an embedded preview.
 *
 * That mattered here because every toggle in the app wrote its cookie *before*
 * applying the visual change. A throw meant the persistence failed **and** the
 * theme never switched, so the control looked broken rather than merely
 * forgetful.
 *
 * The rule this module enforces: persistence is best-effort, the visible effect
 * is not. Apply the change first, then try to remember it.
 */

export type CookieOptions = {
  /** Seconds. Omit for a session cookie that clears when the browser closes. */
  maxAge?: number
}

/** Returns true when the value was actually persisted. */
export function writeCookie(name: string, value: string, options: CookieOptions = {}): boolean {
  if (typeof document === 'undefined') return false

  const parts = [`${name}=${encodeURIComponent(value)}`, 'path=/', 'samesite=lax']
  if (options.maxAge !== undefined) parts.push(`max-age=${options.maxAge}`)

  try {
    document.cookie = parts.join('; ')
    // Writing can fail silently rather than throwing, so confirm by reading back.
    return readCookie(name) === value
  } catch {
    return false
  }
}

export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
    return match?.[1] ? decodeURIComponent(match[1]) : null
  } catch {
    return null
  }
}

/** One year. Used for preferences that should outlive the browser session. */
export const YEAR_IN_SECONDS = 31_536_000
