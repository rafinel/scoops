import { defineConfig, devices } from '@playwright/test'

const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? '4001'
const PLAYWRIGHT_BASE_URL = `http://localhost:${PLAYWRIGHT_PORT}`
const isAnalyticsFixtureEnabled = process.env.SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE === '1'
const analyticsServerEnvironment = isAnalyticsFixtureEnabled
  ? [
      'SCOOPS_PLAYWRIGHT_ANALYTICS_FIXTURE=1',
      'VITE_SCOOPS_WEB_APP_MODE=stg',
      'VITE_SENTRY_DSN=https://fixture@sentry.invalid/1',
      `VITE_SCOOPS_RELEASE_SHA=${'a'.repeat(40)}`,
      'VITE_POSTHOG_ENABLED=true',
      'VITE_POSTHOG_PROJECT_TOKEN=phc_scoops_playwright_fixture',
      'VITE_POSTHOG_API_HOST=https://posthog.invalid',
      'SENTRY_ORG=fixture-org',
      'SENTRY_PROJECT=fixture-project',
      'SENTRY_AUTH_TOKEN=fixture-token',
    ].join(' ')
  : ''

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: PLAYWRIGHT_BASE_URL,
    trace: 'on-first-retry',
  },
  expect: {
    timeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `${analyticsServerEnvironment} SCOOPS_PLAYWRIGHT_MOCK_SSR_AUTH=1 pnpm exec vite dev --host localhost --port ${PLAYWRIGHT_PORT}`,
    url: PLAYWRIGHT_BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
  },
})
