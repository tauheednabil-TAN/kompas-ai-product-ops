import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // This repo sits inside a OneDrive folder whose parent contains an unrelated
  // package-lock.json. Pinning the root stops Turbopack inferring a workspace
  // above the repo and makes local and CI builds resolve identically.
  turbopack: {
    root: path.resolve(import.meta.dirname),
  },
}

export default nextConfig
