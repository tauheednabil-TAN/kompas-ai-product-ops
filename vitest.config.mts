import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Replaces vite-tsconfig-paths; Vite resolves the "@/*" alias from
    // tsconfig.json natively.
    tsconfigPaths: true,
    alias: {
      // `server-only` throws on import outside a Server Component, which would
      // make any server module untestable. Stubbing it keeps the guard in place
      // for the real build (Next enforces it there) without blocking tests.
      'server-only': new URL('./test/stubs/server-only.ts', import.meta.url).pathname,
    },
  },
  test: {
    // Node, not jsdom: none of these tests touch the DOM, and jsdom was costing
    // around five minutes of environment setup per run.
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    // The default `forks` pool fails to hand off to workers when the project
    // lives under a OneDrive path containing spaces; threads is unaffected.
    pool: 'threads',
  },
})
