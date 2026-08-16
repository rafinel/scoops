import type { Page } from '@playwright/test'

import { accountResponse } from './identity-data-fixtures'

export type IdentityModuleFixture = {
  mockAnonymousProvider: () => Promise<void>
  mockManagerSession: () => Promise<void>
  mockManagerAccount: () => Promise<void>
}

export const IdentityModuleFixture = (page: Page): IdentityModuleFixture => {
  let sessionMode: 'anonymous' | 'manager' = 'anonymous'

  return {
    async mockAnonymousProvider() {
      await page.route('**/auth/v1/session*', async (route) => {
        if (sessionMode === 'manager') {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                session: {
                  access_token: 'browser-manager-token',
                  refresh_token: 'browser-refresh-token',
                  expires_at: 4_000_000_000,
                  user: { id: 'browser-manager-id', email: 'manager@example.com' },
                },
              },
              error: null,
            }),
            status: 200,
          })
          return
        }
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({ data: { session: null }, error: null }),
          status: 200,
        })
      })
    },

    async mockManagerSession() {
      sessionMode = 'manager'
      await page.addInitScript(() => {
        const session = {
          access_token: 'browser-manager-token',
          refresh_token: 'browser-refresh-token',
          expires_at: 4_000_000_000,
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'browser-manager-id', email: 'manager@example.com' },
        }
        for (const key of [
          'supabase.auth.token',
          'sb-127-auth-token',
          'sb-127.0.0.1-auth-token',
          'sb-127.0.0.1:54321-auth-token',
        ]) {
          window.localStorage.setItem(key, JSON.stringify(session))
        }
      })
    },

    async mockManagerAccount() {
      await page.route('**/auth/session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(accountResponse()),
          status: 200,
        })
      })
    },
  }
}
