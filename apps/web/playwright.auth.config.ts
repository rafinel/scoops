import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/auth.setup.ts',
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4000',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm exec vite dev --host 127.0.0.1 --port 4000',
    url: 'http://127.0.0.1:4000',
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
})
