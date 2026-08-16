'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import { writeCookie, YEAR_IN_SECONDS } from '../cookies'
import { THEME_COOKIE, type ThemeChoice } from './config'

/** Kept next to THEME_INIT_SCRIPT's logic in config.ts so the two cannot drift. */
function applyTheme(choice: ThemeChoice): void {
  const dark =
    choice === 'dark' ||
    (choice === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

type ThemeContextValue = {
  choice: ThemeChoice
  setChoice: (next: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({
  initialChoice,
  children,
}: {
  initialChoice: ThemeChoice
  children: React.ReactNode
}) {
  const [choice, setChoiceState] = useState<ThemeChoice>(initialChoice)

  const setChoice = useCallback((next: ThemeChoice) => {
    // Order matters. The visible change happens first and unconditionally;
    // remembering it is best-effort. Previously the cookie write sat in the
    // middle, so anywhere cookies are blocked — a sandboxed preview iframe, a
    // strict privacy setting — a throw skipped applyTheme() and the toggle did
    // nothing at all.
    setChoiceState(next)
    applyTheme(next)
    writeCookie(THEME_COOKIE, next, { maxAge: YEAR_IN_SECONDS })
  }, [])

  /**
   * In development React's Strict Mode remounts once and resets <html> to only
   * the attributes it manages from JSX, wiping the class the inline script set.
   * Re-applying before paint restores it. A no-op in production.
   */
  useLayoutEffect(() => {
    applyTheme(choice)
  }, [choice])

  // Follow the OS only while the user has explicitly chosen to follow the OS.
  useEffect(() => {
    if (choice !== 'system') return
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyTheme('system')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [choice])

  const value = useMemo<ThemeContextValue>(() => ({ choice, setChoice }), [choice, setChoice])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
