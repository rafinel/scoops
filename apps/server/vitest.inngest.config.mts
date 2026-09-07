import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    exclude: [],
    fileParallelism: false,
    hookTimeout: 120_000,
    include: ['src/**/messaging/inngest/jobs/tests/**/*.test.ts'],
    isolate: false,
    maxWorkers: 1,
    testTimeout: 120_000,
  },
})
