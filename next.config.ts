import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Security headers.
 *
 * No CSP `script-src` lockdown here, and that is a deliberate, documented gap
 * rather than an oversight: the theme script is inlined to prevent a flash
 * before hydration, and Next's own bootstrap is inline too, so a strict policy
 * needs a per-request nonce threaded through a proxy. The headers below are the
 * ones that are worth having without that machinery. Noted in the README.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // The app needs none of these.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Blocks plugin content and stops a stray <base> rewriting relative URLs.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
]

const nextConfig: NextConfig = {
  // This repo sits inside a OneDrive folder whose parent contains an unrelated
  // package-lock.json. Pinning the root stops Turbopack inferring a workspace
  // above the repo and makes local and CI builds resolve identically.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
