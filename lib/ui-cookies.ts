/**
 * Cookie names for UI preferences that the server must know at first paint, so
 * the layout never renders one shape and then snaps to another.
 *
 * No `'use client'` — read on the server, written on the client.
 */

/** '1' when the sidebar is collapsed to the icon rail. Persistent (1 year). */
export const SIDEBAR_COOKIE = 'kompas_sidebar_collapsed'

/**
 * '1' when the synthetic-data banner has been dismissed. A **session** cookie
 * with no max-age, so it clears when the browser closes — C2 requires the
 * warning to come back for every new session.
 */
export const BANNER_COOKIE = 'kompas_banner_dismissed'
