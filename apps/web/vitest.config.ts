import { fileURLToPath, URL } from 'node:url'

import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    coverage: {
      exclude: ['src/**/*.test.{ts,tsx}', 'src/routeTree.gen.ts'],
      include: ['src/**/*.{ts,tsx}'],
      provider: 'v8',
      reporter: [
        'text-summary',
        'json-summary',
        'html',
        ['lcov', { projectRoot: '../..' }],
      ],
      reportOnFailure: true,
      reportsDirectory: './coverage',
      // Baseline floor measured on 2026-08-27. Raise only; project target is 85/80.
      thresholds: {
        autoUpdate: false,
        branches: 49.2,
        functions: 49,
        lines: 54.1,
        statements: 52.2,
      },
    },
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
