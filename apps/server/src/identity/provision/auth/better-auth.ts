import { APIError, betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getCookies } from 'better-auth/cookies'

import { betterAuthAccountModel } from '@/identity/database/drizzle/models/better-auth-account-model'
import { betterAuthSessionModel } from '@/identity/database/drizzle/models/better-auth-session-model'
import { betterAuthRateLimitModel } from '@/identity/database/drizzle/models/better-auth-rate-limit-model'
import { betterAuthUserModel } from '@/identity/database/drizzle/models/better-auth-user-model'
import { betterAuthVerificationModel } from '@/identity/database/drizzle/models/better-auth-verification-model'
import {
  hashPassword,
  verifyPassword,
} from '@/identity/provision/auth/better-auth-password'
import { BetterAuthSecurityControls } from '@/identity/provision/auth/better-auth-security-controls'
import { createBetterAuthRateLimitStorage } from '@/identity/provision/auth/better-auth-rate-limit-storage'
import type { Database } from '@/shared/database/drizzle/drizzle-client'
import type { EnvProvider } from '@/shared/provision/env/env-provider'
import type { IdentityDatabase } from '@scoops/core/identity/interfaces'

const betterAuthDatabaseSchema = {
  account: betterAuthAccountModel,
  rateLimit: betterAuthRateLimitModel,
  session: betterAuthSessionModel,
  user: betterAuthUserModel,
  verification: betterAuthVerificationModel,
}

type BetterAuthRequestContext = {
  path?: string
  body?: unknown
}

function getSignInEmail(context: unknown): string | undefined {
  const request = context as BetterAuthRequestContext
  if (request.path !== '/sign-in/email') return undefined

  const body = request.body as { email?: unknown } | undefined
  return typeof body?.email === 'string' ? body.email : undefined
}

export function getTrustedOrigins(webAppUrl: string): string[] {
  const configured = new URL(webAppUrl)
  const counterpart = new URL(configured.toString())
  if (configured.hostname === 'localhost') counterpart.hostname = '127.0.0.1'
  if (configured.hostname === '127.0.0.1') counterpart.hostname = 'localhost'

  return [...new Set([configured.origin, counterpart.origin])]
}

export function createBetterAuth(
  envProvider: EnvProvider,
  database: Database,
  identityDatabase: IdentityDatabase,
  securityControls = new BetterAuthSecurityControls(identityDatabase, database),
) {
  const mode = envProvider.get('SCOOPS_SERVER_APP_MODE')
  const cookieDomain = envProvider.get('BETTER_AUTH_COOKIE_DOMAIN')
  const trustedOrigins = getTrustedOrigins(envProvider.get('SCOOPS_WEB_APP_URL'))
  const secure = mode === 'stg' || mode === 'prod'

  return betterAuth({
    appName: 'Scoops',
    baseURL: envProvider.get('SCOOPS_SERVER_APP_URL'),
    basePath: '/api/auth',
    secret: envProvider.get('BETTER_AUTH_SECRET'),
    database: drizzleAdapter(database, {
      provider: 'pg',
      schema: betterAuthDatabaseSchema,
      transaction: true,
    }),
    advanced: {
      database: { generateId: 'uuid' },
      cookiePrefix: 'scoops',
      crossSubDomainCookies: {
        enabled: secure && Boolean(cookieDomain),
        ...(cookieDomain ? { domain: cookieDomain } : {}),
      },
      useSecureCookies: secure,
    },
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    },
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 8,
      maxPasswordLength: 64,
      autoSignIn: false,
      resetPasswordTokenExpiresIn: 3_600,
      revokeSessionsOnPasswordReset: true,
      password: { hash: hashPassword, verify: verifyPassword },
    },
    emailVerification: {
      sendOnSignUp: false,
      autoSignInAfterVerification: false,
      expiresIn: 3_600,
    },
    session: {
      expiresIn: 1_800,
      updateAge: 300,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      customStorage: createBetterAuthRateLimitStorage(database),
    },
    user: {
      changeEmail: { enabled: false },
      deleteUser: { enabled: false },
    },
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            if (!(await securityControls.isSessionEligible(session.userId))) return false
            const email = await securityControls.getUserEmail(session.userId)
            return email && (await securityControls.isSignInLocked(email))
              ? false
              : undefined
          },
          after: async (session) => {
            await securityControls.recordSignInSuccess(session.userId)
          },
        },
      },
    },
    hooks: {
      before: async (context) => {
        const email = getSignInEmail(context)
        if (!email) return
        if (await securityControls.isSignInLocked(email)) {
          throw APIError.from('UNAUTHORIZED', {
            code: 'INVALID_EMAIL_OR_PASSWORD',
            message: 'Invalid email or password',
          })
        }
      },
    },
    onAPIError: {
      onError: async (_error, context) => {
        const email = getSignInEmail(context)
        if (!email) return
        if (!(await securityControls.isSignInLocked(email))) {
          await securityControls.recordSignInFailure(email)
        }
      },
    },
    telemetry: { enabled: false },
  })
}

export type BetterAuthInstance = ReturnType<typeof createBetterAuth>

export function getBetterAuthSessionCookieName(auth: BetterAuthInstance): string {
  return getCookies(auth.options).sessionToken.name
}
