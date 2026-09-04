import { defineConfig, devices } from '@playwright/test'

const PLAYWRIGHT_PORT = process.env.PLAYWRIGHT_PORT ?? '4001'
const PLAYWRIGHT_BASE_URL = `http://localhost:${PLAYWRIGHT_PORT}`

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  fullyParallel: true,
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
    command: `SCOOPS_PLAYWRIGHT_MOCK_SSR_AUTH=1 pnpm exec vite dev --host localhost --port ${PLAYWRIGHT_PORT}`,
    url: PLAYWRIGHT_BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
  },
})
