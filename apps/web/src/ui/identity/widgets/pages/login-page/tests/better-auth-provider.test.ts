import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  AppError,
  BadRequestError,
  ConflictError,
} from '@scoops/core/shared/domain/errors'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'
import type { AuthStateChangeListener } from '@scoops/core/identity/domain/structures'

import { BetterAuthProvider } from '@/provision/auth/better-auth/better-auth-provider'

const session = {
  sessionId: 'session-id',
  user: { id: 'user-id', email: 'manager@example.com' },
  createdAt: new Date('2026-08-01T12:00:00.000Z'),
  expiresAt: new Date('2026-08-02T12:00:00.000Z'),
  absoluteExpiresAt: new Date('2026-08-08T12:00:00.000Z'),
}

function createClient() {
  return {
    signIn: { email: vi.fn() },
    signOut: vi.fn(),
  }
}

function createProvider(
  client: ReturnType<typeof createClient>,
  resolvedSession: typeof session | null = session,
) {
  return BetterAuthProvider(
    client,
    vi.fn().mockResolvedValue({ account: null, session: resolvedSession }),
    vi.fn().mockResolvedValue({ account: null, session: resolvedSession }),
  )
}

describe('BetterAuthProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps sign-in, session restoration and sign-out events through the provider contract', async () => {
    const client = createClient()
    client.signIn.email.mockResolvedValue({ data: {} })
    client.signOut.mockResolvedValue({ data: {} })
    const provider = createProvider(client)
    const listenerMock = vi.fn<AuthStateChangeListener>()
    const unsubscribe = provider.onAuthStateChange(listenerMock)

    await expect(
      provider.signIn({ email: 'manager@example.com', password: 'password' }),
    ).resolves.toEqual(session)
    await expect(provider.getSession()).resolves.toEqual(session)
    await expect(provider.signOut()).resolves.toBeUndefined()
    expect(listenerMock).toHaveBeenNthCalledWith(1, 'SIGNED_IN', session)
    expect(listenerMock).toHaveBeenNthCalledWith(2, 'INITIAL_SESSION', session)
    expect(listenerMock).toHaveBeenNthCalledWith(3, 'SIGNED_OUT', null)

    expect(unsubscribe()).toBe(true)
    await provider.getSession()
    expect(listenerMock).toHaveBeenCalledTimes(3)
  })

  it('rejects a successful provider response when no session can be resolved', async () => {
    const client = createClient()
    client.signIn.email.mockResolvedValue({ data: {} })
    const provider = createProvider(client, null)

    await expect(
      provider.signIn({ email: 'manager@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(AppError)
  })

  it.each([
    ['INVALID_EMAIL_OR_PASSWORD', InvalidCredentialsError],
    ['invalid_credentials', InvalidCredentialsError],
    ['USER_ALREADY_EXISTS', ConflictError],
    ['email_exists', ConflictError],
  ] as const)('maps Better Auth code %s to the domain error', async (code, ErrorType) => {
    const client = createClient()
    client.signIn.email.mockResolvedValue({ error: { code } })
    const provider = createProvider(client)

    await expect(
      provider.signIn({ email: 'manager@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(ErrorType)
  })

  it('maps client status failures and generic provider failures', async () => {
    const client = createClient()
    const provider = createProvider(client)

    client.signIn.email.mockResolvedValue({
      error: { status: 422, message: 'Dados inválidos.' },
    })
    await expect(
      provider.signIn({ email: 'manager@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(BadRequestError)

    client.signIn.email.mockResolvedValue({ error: { status: 500 } })
    await expect(
      provider.signIn({ email: 'manager@example.com', password: 'password' }),
    ).rejects.toBeInstanceOf(AppError)

    client.signOut.mockResolvedValue({ error: { status: 500, message: 'Unavailable' } })
    await expect(provider.signOut()).rejects.toBeInstanceOf(AppError)
  })

  it('uses the browser session resolver and sends credentialed requests', async () => {
    const client = createClient()
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            account: {
              id: 'user-id',
              establishmentId: 'establishment-id',
              establishmentName: 'Scoops',
              name: 'Manager',
              email: 'manager@example.com',
              profile: 'manager',
            },
          }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            session: {
              id: session.sessionId,
              createdAt: session.createdAt.toISOString(),
              expiresAt: session.expiresAt.toISOString(),
            },
            user: session.user,
          }),
          { status: 200 },
        ),
      )
    const provider = BetterAuthProvider(client)

    await expect(provider.getSession()).resolves.toMatchObject({
      sessionId: session.sessionId,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('/auth/session'),
      {
        credentials: 'include',
      },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/api/auth/get-session'),
      { credentials: 'include' },
    )
  })

  it('returns an anonymous session when either browser endpoint returns unauthorized', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }))
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 200 }))
    const provider = BetterAuthProvider(createClient())

    await expect(provider.getSession()).resolves.toBeNull()
  })
})
