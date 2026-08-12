/** Theme primitives shared by server and client. No `'use client'` — see lib/i18n/config.ts. */

export type ThemeChoice = 'light' | 'dark' | 'system'

export const THEME_COOKIE = 'kompas_theme'

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * Runs before React hydrates, inlined into <head>. Without it the page paints in
 * light mode and then snaps to dark, which looks broken on every reload.
 */
export const THEME_INIT_SCRIPT = `
(function(){try{
  var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/);
  var c=m?decodeURIComponent(m[1]):'system';
  var dark=c==='dark'||(c!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',dark);
  document.documentElement.style.colorScheme=dark?'dark':'light';
}catch(e){}})();
`.trim()
