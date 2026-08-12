import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Replaces vite-tsconfig-paths; Vite resolves the "@/*" alias from
    // tsconfig.json natively.
    tsconfigPaths: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx'],
    // The default `forks` pool fails to hand off to workers when the project
    // lives under a OneDrive path containing spaces; threads is unaffected.
    pool: 'threads',
  },
})
