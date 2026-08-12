import 'server-only'

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export type Database = ReturnType<typeof createDb>

function createDb(url: string) {
  return drizzle(neon(url), { schema })
}

let cached: Database | null = null

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

/**
 * Returns the Drizzle client, or `null` when `DATABASE_URL` is unset.
 *
 * Returning null rather than throwing is deliberate: an unconfigured database
 * should render an explicit, actionable Danish message on the page, not a stack
 * trace. Pages read this and branch. Write paths (`requireDb`) still throw,
 * because silently not persisting a model call would violate C4.
 */
export function getDb(): Database | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (!cached) cached = createDb(url)
  return cached
}

export function requireDb(): Database {
  const db = getDb()
  if (!db) {
    throw new Error(
      'DATABASE_URL is not set. Every model call must be logged (C4), so this operation cannot proceed without a database.',
    )
  }
  return db
}

export { schema }
