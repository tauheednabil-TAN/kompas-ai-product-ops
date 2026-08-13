import 'server-only'

import { isDemoMode } from './ai/client'

/**
 * Per-IP rate limit for the public demo.
 *
 * In-memory on purpose, and honest about what that means: on a serverless
 * platform each instance keeps its own counter, so the real limit is
 * `LIMIT × instances`. That is fine for the job it has — stopping one person
 * with a shared link from draining an API key — and it avoids adding a Redis
 * dependency for a demo. A production limiter would need shared state, and the
 * README says so.
 */
const WINDOW_MS = 60 * 60 * 1000
const LIMIT = 20

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export type RateLimitVerdict =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

export function checkRateLimit(request: Request): RateLimitVerdict {
  if (!isDemoMode()) return { allowed: true }

  // Vercel sets x-forwarded-for; the first entry is the client.
  const forwarded = request.headers.get('x-forwarded-for') ?? ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'

  const now = Date.now()
  const bucket = buckets.get(ip)

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (bucket.count >= LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }

  bucket.count += 1

  // Opportunistic cleanup so a long-lived instance does not accumulate a bucket
  // per address it has ever seen.
  if (buckets.size > 5000) {
    for (const [key, value] of buckets) if (now >= value.resetAt) buckets.delete(key)
  }

  return { allowed: true }
}
