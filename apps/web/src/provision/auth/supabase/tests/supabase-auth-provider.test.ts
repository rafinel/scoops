import { afterEach, describe, expect, it, vi } from 'vitest'

import type { AuthChangeEvent, SupabaseClient } from '@supabase/supabase-js'
import { AuthApiError } from '@supabase/supabase-js'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'

import { SupabaseAuthProvider } from '../supabase-auth-provider'

describe('SupabaseAuthProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps a provider session to the core session structure', async () => {
    const session = createSession()
    const client = createClient()
    client.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { session },
      error: null,
    })

    const authProvider = SupabaseAuthProvider(client)
    const result = await authProvider.signIn({
      identifier: 'manager@example.com',
      password: 'password',
    })

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: 1_800_000_000,
      user: { id: 'user-id', email: 'manager@example.com' },
    })
  })

  it('returns null when the provider has no current session or user', async () => {
    const client = createClient()
    client.auth.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    })
    client.auth.getUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const authProvider = SupabaseAuthProvider(client)

    await expect(authProvider.getSession()).resolves.toBeNull()
    await expect(authProvider.getUser()).resolves.toBeNull()
  })

  it('translates invalid credentials without exposing the SDK error', async () => {
    const client = createClient()
    client.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: { session: null },
      error: new AuthApiError('provider detail', 400, 'invalid_credentials'),
    })

    const authProvider = SupabaseAuthProvider(client)

    await expect(
      authProvider.signIn({ identifier: 'unknown@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
  })

  it('passes local and global sign-out scopes to Supabase', async () => {
    const client = createClient()
    client.auth.signOut = vi.fn().mockResolvedValue({ error: null })
    const authProvider = SupabaseAuthProvider(client)

    await authProvider.signOut('local')
    await authProvider.signOut('global')

    expect(client.auth.signOut).toHaveBeenNthCalledWith(1, { scope: 'local' })
    expect(client.auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'global' })
  })

  it('forwards mapped auth events and unsubscribes the provider subscription', () => {
    const unsubscribeMock = vi.fn()
    let listener:
      | ((event: AuthChangeEvent, session: ReturnType<typeof createSession>) => void)
      | undefined
    const client = createClient()
    client.auth.onAuthStateChange = vi.fn((callback) => {
      listener = callback as typeof listener
      return { data: { subscription: { unsubscribe: unsubscribeMock } } }
    }) as unknown as typeof client.auth.onAuthStateChange
    const authProvider = SupabaseAuthProvider(client)
    const authListenerMock = vi.fn()
    const unsubscribe = authProvider.onAuthStateChange(authListenerMock)

    listener?.('TOKEN_REFRESHED', createSession())
    unsubscribe()

    expect(authListenerMock).toHaveBeenCalledWith(
      'TOKEN_REFRESHED',
      expect.objectContaining({ accessToken: 'access-token' }),
    )
    expect(unsubscribeMock).toHaveBeenCalledOnce()
  })
})

function createSession(): {
  access_token: string
  refresh_token: string
  expires_at: number
  user: { id: string; email: string }
} {
  return {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
    expires_at: 1_800_000_000,
    user: { id: 'user-id', email: 'manager@example.com' },
  }
}

function createClient(): SupabaseClient {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
  } as unknown as SupabaseClient
}
