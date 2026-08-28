import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      exclude: ['src/**/*.test.ts', 'src/**/fakers/**', 'src/**/index.ts'],
      include: ['src/**/*.ts'],
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
        branches: 57.7,
        functions: 68.6,
        lines: 64.5,
        statements: 62.4,
      },
    },
    globals: true,
  },
})
