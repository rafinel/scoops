import type { Account } from '@scoops/core/identity/domain/entities'
import type { AuthSession, AuthUser } from '@scoops/core/identity/domain/structures'
import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'

import { BROWSER_ENV } from '@/constants'

export type AuthSessionResolution = {
  account: Account | null
  session: AuthSession | null
}

const SESSION_COOKIE_NAME = 'scoops.session_token'
const PLAYWRIGHT_AUTH_HEADER = 'x-scoops-playwright-auth'
const ABSOLUTE_SESSION_MS = 7 * 24 * 60 * 60 * 1000

type SessionCookieValidationContext = {
  apiOrigin: string
  requestHost?: string
}

export const resolveAuthSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<AuthSessionResolution> => {
    const testResolution = resolvePlaywrightAuthSession()
    if (testResolution) return testResolution

    const cookie = getRequestHeader('cookie')
    if (!cookie) return { account: null, session: null }

    const requestOptions = { headers: { Cookie: cookie } }
    const [accountResponse, providerResponse] = await Promise.all([
      fetch(`${BROWSER_ENV.scoopsServerRestUrl}/auth/session`, requestOptions),
      fetch(`${BROWSER_ENV.scoopsServerAppUrl}/api/auth/get-session`, requestOptions),
    ])

    forwardSessionCookies(accountResponse, {
      apiOrigin: BROWSER_ENV.scoopsServerAppUrl,
      requestHost: getRequestHeader('host'),
    })
    forwardSessionCookies(providerResponse, {
      apiOrigin: BROWSER_ENV.scoopsServerAppUrl,
      requestHost: getRequestHeader('host'),
    })

    if (accountResponse.status === 401 || providerResponse.status === 401) {
      return { account: null, session: null }
    }
    if (!accountResponse.ok || !providerResponse.ok) {
      throw new Error('Authentication session is unavailable')
    }

    const accountPayload = (await accountResponse.json()) as unknown
    const providerPayload = (await providerResponse.json()) as unknown
    return {
      account: normalizeAuthSessionResolution(accountPayload).account,
      session: normalizeBetterAuthSession(providerPayload),
    }
  },
)

function resolvePlaywrightAuthSession(): AuthSessionResolution | null {
  if (process.env.SCOOPS_PLAYWRIGHT_MOCK_SSR_AUTH !== '1') return null

  const encoded = getRequestHeader(PLAYWRIGHT_AUTH_HEADER)
  if (!encoded) return null

  const override = JSON.parse(decodeURIComponent(encoded)) as {
    status: number
    body: unknown
  }

  if (override.status === 401) return { account: null, session: null }
  if (override.status !== 200) {
    throw new Error('Authentication session is unavailable')
  }

  return normalizeAuthSessionResolution(override.body)
}

function forwardSessionCookies(
  response: Response,
  context: SessionCookieValidationContext,
): void {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const cookies = headers.getSetCookie?.() ?? []
  const allowlisted = cookies.filter((value) => isAllowedSessionCookie(value, context))
  if (allowlisted.length > 0) setResponseHeader('set-cookie', allowlisted)
}

export function isAllowedSessionCookie(
  value: string,
  context: SessionCookieValidationContext,
): boolean {
  const parts = value.split(';').map((part) => part.trim())
  const [nameValue, ...attributeParts] = parts
  const separator = nameValue?.indexOf('=') ?? -1
  if (separator <= 0 || nameValue.slice(0, separator) !== SESSION_COOKIE_NAME) {
    return false
  }
  const cookieValue = nameValue.slice(separator + 1)

  const attributes = new Map<string, string | true>()
  for (const part of attributeParts) {
    if (!part) return false
    const attributeSeparator = part.indexOf('=')
    const name = (
      attributeSeparator === -1 ? part : part.slice(0, attributeSeparator)
    ).toLowerCase()
    const attributeValue =
      attributeSeparator === -1 ? true : part.slice(attributeSeparator + 1)

    if (
      attributes.has(name) ||
      ![
        'domain',
        'expires',
        'httponly',
        'max-age',
        'path',
        'samesite',
        'secure',
      ].includes(name)
    ) {
      return false
    }
    attributes.set(name, attributeValue)
  }

  if (
    attributes.get('path') !== '/' ||
    attributes.get('httponly') !== true ||
    attributes.get('samesite') !== 'Lax'
  ) {
    return false
  }

  const apiUrl = new URL(context.apiOrigin)
  const loopback = isLoopbackHostname(apiUrl.hostname)
  const domain = attributes.get('domain')
  const isSecure = attributes.get('secure') === true

  const expires = attributes.get('expires')
  const maxAge = attributes.get('max-age')
  if (
    (expires !== undefined &&
      (typeof expires !== 'string' || Number.isNaN(Date.parse(expires)))) ||
    (maxAge !== undefined && (typeof maxAge !== 'string' || !/^-?\d+$/.test(maxAge)))
  ) {
    return false
  }

  const isExpired =
    maxAge === '0' || (typeof expires === 'string' && Date.parse(expires) <= Date.now())
  if (!cookieValue && !isExpired) return false

  if (loopback) {
    return domain === undefined && !isSecure
  }

  if (!isSecure || !context.requestHost) return false

  const requestHostname = getHostname(context.requestHost)
  if (!requestHostname) return false

  return domain === undefined && requestHostname === apiUrl.hostname
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
}

function getHostname(host: string): string | null {
  try {
    return new URL(`http://${host}`).hostname.toLowerCase()
  } catch {
    return null
  }
}

export function normalizeAuthSessionResolution(payload: unknown): AuthSessionResolution {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Authentication session response is invalid')
  }

  const record = payload as Record<string, unknown>
  const account = isAccount(record.account)
    ? record.account
    : isAccount(record)
      ? record
      : null
  const session = normalizeSession(record.session)

  return { account, session }
}

export function normalizeBetterAuthSession(payload: unknown): AuthSession | null {
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  if (!record.session || typeof record.session !== 'object') return null

  const session = record.session as Record<string, unknown>
  const user = isAuthUser(record.user) ? record.user : session.user
  if (!isAuthUser(user)) return null

  const currentSession = normalizeSession({ ...session, user })
  if (currentSession) return currentSession

  return normalizeLegacyBetterAuthSession(session, user)
}

function normalizeLegacyBetterAuthSession(
  session: Record<string, unknown>,
  user: AuthUser,
): AuthSession | null {
  if (
    typeof session.id !== 'string' ||
    !isDate(session.createdAt) ||
    !isDate(session.expiresAt)
  ) {
    return null
  }

  const createdAt = toDate(session.createdAt)
  return {
    sessionId: session.id,
    user,
    createdAt,
    expiresAt: toDate(session.expiresAt),
    absoluteExpiresAt: new Date(createdAt.getTime() + ABSOLUTE_SESSION_MS),
  }
}

function isAccount(value: unknown): value is Account {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    typeof record.establishmentId === 'string' &&
    typeof record.establishmentName === 'string' &&
    typeof record.name === 'string' &&
    typeof record.email === 'string' &&
    (record.profile === 'manager' || record.profile === 'operator')
  )
}

function normalizeSession(value: unknown): AuthSession | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (
    typeof record.sessionId === 'string' &&
    isDate(record.createdAt) &&
    isDate(record.expiresAt) &&
    isDate(record.absoluteExpiresAt) &&
    isAuthUser(record.user)
  ) {
    return {
      sessionId: record.sessionId,
      user: record.user,
      createdAt: toDate(record.createdAt),
      expiresAt: toDate(record.expiresAt),
      absoluteExpiresAt: toDate(record.absoluteExpiresAt),
    }
  }

  return null
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.id === 'string' && typeof record.email === 'string'
}

function isDate(value: unknown): value is Date {
  return (
    value instanceof Date ||
    (typeof value === 'string' && !Number.isNaN(Date.parse(value)))
  )
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}
