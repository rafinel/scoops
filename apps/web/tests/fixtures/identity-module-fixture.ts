import type { Page } from '@playwright/test'

import { accountResponse } from './identity-data-fixtures'

export type IdentityModuleFixture = {
  mockAnonymousProvider: () => Promise<void>
  mockManagerSession: () => Promise<void>
  mockManagerAccount: () => Promise<void>
  mockOperatorSession: () => Promise<void>
  mockOperatorAccount: () => Promise<void>
}

export const IdentityModuleFixture = (page: Page): IdentityModuleFixture => {
  let sessionMode: 'anonymous' | 'manager' | 'operator' = 'anonymous'

  return {
    async mockAnonymousProvider() {
      await page.route('**/auth/v1/session*', async (route) => {
        if (sessionMode === 'manager' || sessionMode === 'operator') {
          const isOperator = sessionMode === 'operator'
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                session: {
                  access_token: 'browser-manager-token',
                  refresh_token: 'browser-refresh-token',
                  expires_at: 4_000_000_000,
                  user: {
                    id: isOperator ? 'browser-operator-id' : 'browser-manager-id',
                    email: isOperator ? 'operator@example.com' : 'manager@example.com',
                  },
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
      await page.route('**/auth/v1/logout*', async (route) => {
        sessionMode = 'anonymous'
        await route.fulfill({
          contentType: 'application/json',
          status: 200,
          body: JSON.stringify({}),
        })
        await page.evaluate(() => {
          for (const key of [
            'supabase.auth.token',
            'sb-127-auth-token',
            'sb-127.0.0.1-auth-token',
            'sb-127.0.0.1:54321-auth-token',
          ]) {
            window.localStorage.removeItem(key)
          }
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

    async mockOperatorSession() {
      sessionMode = 'operator'
      await page.addInitScript(() => {
        const session = {
          access_token: 'browser-operator-token',
          refresh_token: 'browser-operator-refresh-token',
          expires_at: 4_000_000_000,
          expires_in: 3600,
          token_type: 'bearer',
          user: { id: 'browser-operator-id', email: 'operator@example.com' },
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

    async mockOperatorAccount() {
      await page.route('**/auth/session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(
            accountResponse({
              id: 'browser-operator-id',
              name: 'Scoops Operator',
              email: 'operator@example.com',
              profile: 'operator',
            }),
          ),
          status: 200,
        })
      })
    },
  }
}
