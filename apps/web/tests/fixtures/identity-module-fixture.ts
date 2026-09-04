import type { Page } from '@playwright/test'

import { accountResponse } from './identity-data-fixtures'

const SESSION_COOKIE = 'scoops.session_token'

export type IdentityModuleFixture = {
  mockAnonymousProvider: () => Promise<void>
  mockManagerSession: () => Promise<void>
  mockManagerAccount: () => Promise<void>
  mockSessionUnavailable: () => Promise<void>
  mockOperatorSession: () => Promise<void>
  mockOperatorAccount: () => Promise<void>
}

export const IdentityModuleFixture = (page: Page): IdentityModuleFixture => {
  let sessionMode: 'anonymous' | 'manager' | 'operator' = 'anonymous'

  const setSsrAuth = async (status: number, body: unknown) => {
    await page.context().setExtraHTTPHeaders({
      'x-scoops-playwright-auth': encodeURIComponent(JSON.stringify({ status, body })),
    })
  }

  const sessionResponse = () => {
    const isOperator = sessionMode === 'operator'
    const account = accountResponse(
      isOperator
        ? {
            id: 'browser-operator-id',
            name: 'Scoops Operator',
            email: 'operator@example.com',
            profile: 'operator',
          }
        : undefined,
    )

    return {
      ...account,
      session:
        sessionMode === 'anonymous'
          ? null
          : {
              sessionId: `${sessionMode}-session-id`,
              user: { id: account.id, email: account.email },
              createdAt: '2026-01-01T00:00:00.000Z',
              expiresAt: '2099-01-01T00:30:00.000Z',
              absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
            },
    }
  }

  return {
    async mockAnonymousProvider() {
      if (process.env.SCOOPS_RUN_REAL_INTEGRATION === '1') return

      await setSsrAuth(401, { account: null, session: null })
      await page.route('**/api/auth/sign-out*', async (route) => {
        sessionMode = 'anonymous'
        await route.fulfill({ status: 204, body: '' })
      })
      await page.route('**/api/auth/get-session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(sessionResponse()),
          status: 200,
        })
      })
      await page.route('**/auth/session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(sessionResponse()),
          status: sessionMode === 'anonymous' ? 401 : 200,
        })
      })
    },

    async mockManagerSession() {
      sessionMode = 'manager'
      await setSsrAuth(200, sessionResponse())
      await page.context().addCookies([
        {
          name: SESSION_COOKIE,
          value: 'browser-manager-session',
          domain: '127.0.0.1',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])
    },

    async mockManagerAccount() {
      sessionMode = 'manager'
      await setSsrAuth(200, {
        ...accountResponse(),
        session: {
          sessionId: 'manager-session-id',
          user: { id: 'browser-manager-id', email: 'manager@example.com' },
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:30:00.000Z',
          absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
        },
      })
      await page.route('**/auth/session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            ...accountResponse(),
            session: {
              sessionId: 'manager-session-id',
              user: { id: 'browser-manager-id', email: 'manager@example.com' },
              createdAt: '2026-01-01T00:00:00.000Z',
              expiresAt: '2099-01-01T00:30:00.000Z',
              absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
            },
          }),
          status: 200,
        })
      })
    },

    async mockSessionUnavailable() {
      await setSsrAuth(503, { message: 'Identity service unavailable' })
    },

    async mockOperatorSession() {
      sessionMode = 'operator'
      await setSsrAuth(200, sessionResponse())
      await page.context().addCookies([
        {
          name: SESSION_COOKIE,
          value: 'browser-operator-session',
          domain: '127.0.0.1',
          path: '/',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])
    },

    async mockOperatorAccount() {
      sessionMode = 'operator'
      await setSsrAuth(200, {
        ...accountResponse({
          id: 'browser-operator-id',
          name: 'Scoops Operator',
          email: 'operator@example.com',
          profile: 'operator',
        }),
        session: {
          sessionId: 'operator-session-id',
          user: { id: 'browser-operator-id', email: 'operator@example.com' },
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2099-01-01T00:30:00.000Z',
          absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
        },
      })
      await page.route('**/auth/session*', async (route) => {
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            ...accountResponse({
              id: 'browser-operator-id',
              name: 'Scoops Operator',
              email: 'operator@example.com',
              profile: 'operator',
            }),
            session: {
              sessionId: 'operator-session-id',
              user: { id: 'browser-operator-id', email: 'operator@example.com' },
              createdAt: '2026-01-01T00:00:00.000Z',
              expiresAt: '2099-01-01T00:30:00.000Z',
              absoluteExpiresAt: '2099-01-08T00:00:00.000Z',
            },
          }),
          status: 200,
        })
      })
    },
  }
}
