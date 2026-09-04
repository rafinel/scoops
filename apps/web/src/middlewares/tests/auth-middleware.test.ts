import { isRedirect } from '@tanstack/react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ROUTES } from '@/constants/routes'
import {
  resolveAuthSession,
  type AuthSessionResolution,
} from '@/server/auth/resolve-auth-session'

import { AuthRouteUnavailableError } from '../auth-route-unavailable-error'
import { requireAuthMiddleware } from '../require-auth-middleware'
import { requireManagerMiddleware } from '../require-manager-middleware'

vi.mock('@/server/auth/resolve-auth-session', () => ({
  resolveAuthSession: vi.fn(),
}))

const resolveAuthSessionMock = vi.mocked(resolveAuthSession)

const location = { pathname: '/users/', searchStr: '?page=2' }
const session = {
  sessionId: 'session-id',
  user: { id: 'user-id', email: 'manager@example.com' },
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  expiresAt: new Date('2026-01-02T00:00:00.000Z'),
  absoluteExpiresAt: new Date('2026-01-08T00:00:00.000Z'),
}

function resolution(profile: 'manager' | 'operator' = 'manager'): AuthSessionResolution {
  return {
    account: {
      id: 'user-id',
      establishmentId: 'establishment-id',
      establishmentName: 'Scoops',
      name: 'Manager',
      email: 'manager@example.com',
      profile,
    },
    session,
  }
}

describe('requireAuthMiddleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows an authenticated account to enter the protected route', async () => {
    resolveAuthSessionMock.mockResolvedValue(resolution())

    await expect(requireAuthMiddleware({ location })).resolves.toBeUndefined()
  })

  it('redirects missing session or account to login with the sanitized return path', async () => {
    resolveAuthSessionMock.mockResolvedValue({ account: null, session: null })

    const failure = await requireAuthMiddleware({ location }).catch((error) => error)

    expect(isRedirect(failure)).toBe(true)
    expect(failure.options.to).toBe(ROUTES.login)
    expect(failure.options.search).toEqual({ returnTo: '/users/?page=2' })
  })

  it('turns an unexpected session-resolution failure into the unavailable error', async () => {
    resolveAuthSessionMock.mockRejectedValue(new Error('network down'))

    await expect(requireAuthMiddleware({ location })).rejects.toBeInstanceOf(
      AuthRouteUnavailableError,
    )
  })

  it('preserves redirects and an existing unavailable error from the resolver', async () => {
    const existingError = new AuthRouteUnavailableError()
    resolveAuthSessionMock.mockRejectedValueOnce(existingError)
    await expect(requireAuthMiddleware({ location })).rejects.toBe(existingError)

    resolveAuthSessionMock.mockResolvedValue({ account: null, session: session })
    const redirectFailure = await requireAuthMiddleware({ location }).catch(
      (error) => error,
    )
    expect(isRedirect(redirectFailure)).toBe(true)
  })
})

describe('requireManagerMiddleware', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows a manager account and redirects an operator to access denied', async () => {
    resolveAuthSessionMock.mockResolvedValue(resolution('manager'))
    await expect(requireManagerMiddleware({ location })).resolves.toBeUndefined()

    resolveAuthSessionMock.mockResolvedValue(resolution('operator'))
    const failure = await requireManagerMiddleware({ location }).catch((error) => error)
    expect(isRedirect(failure)).toBe(true)
    expect(failure.options.to).toBe(ROUTES.accessDenied)
  })

  it('redirects an anonymous user to login and wraps resolver failures', async () => {
    resolveAuthSessionMock.mockResolvedValue({ account: null, session: null })
    const redirectFailure = await requireManagerMiddleware({ location }).catch(
      (error) => error,
    )
    expect(isRedirect(redirectFailure)).toBe(true)
    expect(redirectFailure.options.to).toBe(ROUTES.login)

    resolveAuthSessionMock.mockRejectedValue(new Error('network down'))
    await expect(requireManagerMiddleware({ location })).rejects.toBeInstanceOf(
      AuthRouteUnavailableError,
    )
  })
})
