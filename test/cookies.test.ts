import { afterEach, describe, expect, it, vi } from 'vitest'
import { readCookie, writeCookie, YEAR_IN_SECONDS } from '@/lib/cookies'

/**
 * A minimal document.cookie stand-in. Not a mock of our own code — it stands in
 * for the browser API, which is the thing whose failure modes are under test.
 */
function installCookieJar(options: { throwOnWrite?: boolean; silentlyIgnore?: boolean } = {}) {
  let jar = ''
  vi.stubGlobal('document', {
    get cookie() {
      return jar
    },
    set cookie(value: string) {
      if (options.throwOnWrite) {
        throw new DOMException('The operation is insecure.', 'SecurityError')
      }
      if (options.silentlyIgnore) return
      const pair = value.split(';')[0] ?? ''
      jar = jar ? `${jar}; ${pair}` : pair
    },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('writeCookie', () => {
  it('writes and reads back a value', () => {
    installCookieJar()
    expect(writeCookie('kompas_theme', 'dark', { maxAge: YEAR_IN_SECONDS })).toBe(true)
    expect(readCookie('kompas_theme')).toBe('dark')
  })

  it('reports failure instead of throwing when the browser refuses the write', () => {
    // A sandboxed iframe without allow-same-origin throws a SecurityError. This
    // is the case that made every toggle in the app appear broken: the throw
    // used to escape and skip the line that applied the visual change.
    installCookieJar({ throwOnWrite: true })
    expect(() => writeCookie('kompas_theme', 'dark')).not.toThrow()
    expect(writeCookie('kompas_theme', 'dark')).toBe(false)
  })

  it('reports failure when the write is silently ignored', () => {
    // Some privacy modes accept the assignment and drop it. Only a read-back
    // catches that.
    installCookieJar({ silentlyIgnore: true })
    expect(writeCookie('kompas_theme', 'dark')).toBe(false)
  })

  it('round-trips values needing encoding', () => {
    installCookieJar()
    writeCookie('x', 'a; b=c')
    expect(readCookie('x')).toBe('a; b=c')
  })

  it('returns null for a cookie that is not set', () => {
    installCookieJar()
    expect(readCookie('kompas_missing')).toBeNull()
  })

  it('does not confuse a name that is a suffix of another', () => {
    installCookieJar()
    writeCookie('kompas_theme', 'dark')
    expect(readCookie('theme')).toBeNull()
  })

  it('is safe to call on the server, where document does not exist', () => {
    vi.stubGlobal('document', undefined)
    expect(writeCookie('x', 'y')).toBe(false)
    expect(readCookie('x')).toBeNull()
  })
})
