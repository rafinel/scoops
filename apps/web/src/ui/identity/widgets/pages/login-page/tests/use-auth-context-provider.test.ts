import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Account } from '@scoops/core/identity/domain/entities'
import type { AuthProvider } from '@scoops/core/identity/interfaces'
import type {
  AuthSession,
  AuthStateChangeListener,
} from '@scoops/core/identity/domain/structures'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'
import { HTTP_STATUS_CODE } from '@scoops/core/shared/constants'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useAuthContextProvider } from '@/ui/shared/contexts/auth-context/use-auth-context-provider'

const session: AuthSession = {
  sessionId: 'session-id',
  user: { id: 'user-id', email: 'manager@example.com' },
  createdAt: new Date('2026-08-01T12:00:00.000Z'),
  expiresAt: new Date('2026-08-02T12:00:00.000Z'),
  absoluteExpiresAt: new Date('2026-08-08T12:00:00.000Z'),
}

const account: Account = {
  id: 'user-id',
  establishmentId: 'establishment-id',
  establishmentName: 'Scoops',
  name: 'Manager',
  email: 'manager@example.com',
  profile: 'manager',
}

function createAuthProvider(
  restoredSession: AuthSession | null,
  signedInSession: AuthSession | null = restoredSession,
) {
  let listener: AuthStateChangeListener | undefined
  const provider: AuthProvider & { listener: () => AuthStateChangeListener | undefined } =
    {
      getSession: vi.fn().mockResolvedValue(restoredSession),
      signIn: vi.fn().mockResolvedValue(signedInSession),
      signOut: vi.fn().mockResolvedValue(undefined),
      onAuthStateChange: vi.fn((nextListener: AuthStateChangeListener) => {
        listener = nextListener
        return vi.fn()
      }),
      listener: () => listener,
    }
  return provider
}

function createIdentityService(...responses: RestResponse<Account>[]) {
  let responseIndex = 0
  return {
    getAccount: vi.fn(
      async () => responses[responseIndex++] ?? new RestResponse({ body: account }),
    ),
    requestPasswordRecovery: vi.fn().mockResolvedValue(new RestResponse()),
    resetPassword: vi.fn().mockResolvedValue(new RestResponse()),
  }
}

function renderAuth(
  authProvider: AuthProvider,
  identityService: ReturnType<typeof createIdentityService>,
  initialRedirect: Parameters<typeof useAuthContextProvider>[2] = false,
) {
  return renderHook(() =>
    useAuthContextProvider(authProvider, identityService, initialRedirect),
  )
}

describe('useAuthContextProvider', () => {
  afterEach(() => {
    cleanup()
    window.history.replaceState(null, '', '/')
    vi.restoreAllMocks()
  })

  it('restores an active session after local access succeeds and refreshes the account', async () => {
    const authProvider = createAuthProvider(session)
    const identityService = createIdentityService(
      new RestResponse({ body: account }),
      new RestResponse({ body: { ...account, name: 'Updated Manager' } }),
    )
    const { result } = renderAuth(authProvider, identityService)

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    expect(result.current.session).toEqual(session)
    await act(async () => {
      await expect(result.current.refreshAccount()).resolves.toMatchObject({
        name: 'Updated Manager',
      })
    })
    expect(result.current.account?.name).toBe('Updated Manager')
    await expect(result.current.getSession()).resolves.toEqual(session)
  })

  it('restores anonymous and unavailable states, then retries local access', async () => {
    const anonymousProvider = createAuthProvider(null)
    const anonymous = renderAuth(anonymousProvider, createIdentityService())
    await waitFor(() => expect(anonymous.result.current.status).toBe('anonymous'))

    const retryProvider = createAuthProvider(session)
    const retry = renderAuth(
      retryProvider,
      createIdentityService(
        new RestResponse({ statusCode: HTTP_STATUS_CODE.serviceUnavailable }),
        new RestResponse({ body: account }),
      ),
    )
    await waitFor(() => expect(retry.result.current.status).toBe('unavailable'))
    await act(async () => {
      await retry.result.current.retryLocalAccess()
    })
    expect(retry.result.current.status).toBe('authenticated')
  })

  it('denies local access and signs out when the account endpoint returns unauthorized', async () => {
    const authProvider = createAuthProvider(session)
    const identityService = createIdentityService(
      new RestResponse({ statusCode: HTTP_STATUS_CODE.unauthorized }),
    )
    const { result } = renderAuth(authProvider, identityService)

    await waitFor(() => expect(result.current.status).toBe('denied'))
    expect(authProvider.signOut).toHaveBeenCalledOnce()
    expect(result.current.session).toBeNull()
  })

  it('signs in, rejects invalid local access, and resets to anonymous on provider errors', async () => {
    const authProvider = createAuthProvider(null, session)
    const identityService = createIdentityService(new RestResponse({ body: account }))
    const { result } = renderAuth(authProvider, identityService)
    await waitFor(() => expect(result.current.status).toBe('anonymous'))

    await act(async () => {
      await result.current.signIn({ email: 'manager@example.com', password: 'password' })
    })
    expect(result.current.status).toBe('authenticated')

    const deniedProvider = createAuthProvider(null, session)
    const denied = renderAuth(
      deniedProvider,
      createIdentityService(
        new RestResponse({ statusCode: HTTP_STATUS_CODE.unauthorized }),
      ),
    )
    await waitFor(() => expect(denied.result.current.status).toBe('anonymous'))
    await expect(
      act(async () =>
        denied.result.current.signIn({ email: 'manager@example.com', password: 'wrong' }),
      ),
    ).rejects.toBeInstanceOf(InvalidCredentialsError)
    expect(denied.result.current.status).toBe('anonymous')

    const failingProvider = createAuthProvider(null)
    vi.mocked(failingProvider.signIn).mockRejectedValueOnce(
      new Error('provider unavailable'),
    )
    const failing = renderAuth(failingProvider, createIdentityService())
    await waitFor(() => expect(failing.result.current.status).toBe('anonymous'))
    await expect(
      act(async () =>
        failing.result.current.signIn({
          email: 'manager@example.com',
          password: 'wrong',
        }),
      ),
    ).rejects.toThrow('provider unavailable')
    expect(failing.result.current.status).toBe('anonymous')
  })

  it('handles provider events, including expiration and stale signed-out updates', async () => {
    const authProvider = createAuthProvider(null)
    const identityService = createIdentityService(new RestResponse({ body: account }))
    const { result } = renderAuth(authProvider, identityService)
    await waitFor(() => expect(result.current.status).toBe('anonymous'))
    const listener = authProvider.listener()
    if (!listener) throw new Error('Provider listener was not registered')

    await act(async () => listener('SESSION_EXPIRED', null))
    expect(result.current.status).toBe('expired')
    await act(async () => listener('SIGNED_IN', session))
    expect(result.current.status).toBe('authenticated')
    await act(async () => listener('SIGNED_OUT', null))
    expect(result.current.status).toBe('anonymous')
  })

  it('keeps onboarding and invitation sessions anonymous until activation', async () => {
    const onboardingProvider = createAuthProvider(session)
    const onboarding = renderAuth(
      onboardingProvider,
      createIdentityService(new RestResponse({ body: account })),
      () => 'onboarding-confirmation',
    )
    await waitFor(() => expect(onboarding.result.current.status).toBe('anonymous'))
    expect(onboarding.result.current.isOnboardingConfirmation).toBe(true)
    await act(async () => {
      await expect(
        onboarding.result.current.activateOnboardingConfirmation(),
      ).resolves.toBe(true)
    })
    expect(onboarding.result.current.status).toBe('authenticated')
    await act(async () => onboarding.result.current.completeOnboardingConfirmation())
    expect(onboardingProvider.signOut).toHaveBeenCalledOnce()

    const invitationProvider = createAuthProvider(session)
    const invitation = renderAuth(
      invitationProvider,
      createIdentityService(new RestResponse({ body: account })),
      () => 'invitation-acceptance',
    )
    await waitFor(() => expect(invitation.result.current.status).toBe('anonymous'))
    expect(invitation.result.current.isInvitationAcceptance).toBe(true)
    await act(async () => {
      await expect(
        invitation.result.current.activateInvitationAcceptance(),
      ).resolves.toBe(true)
    })
    expect(invitation.result.current.status).toBe('authenticated')
    await act(async () => invitation.result.current.clearInvitationAcceptance())
    expect(invitationProvider.signOut).toHaveBeenCalledOnce()
  })

  it('handles empty continuation sessions and password recovery through the identity service', async () => {
    const onboardingProvider = createAuthProvider(null)
    const onboarding = renderAuth(
      onboardingProvider,
      createIdentityService(),
      () => 'onboarding-confirmation',
    )
    await waitFor(() => expect(onboarding.result.current.status).toBe('anonymous'))
    await expect(
      onboarding.result.current.activateOnboardingConfirmation(),
    ).resolves.toBe(false)
    await expect(onboarding.result.current.activateInvitationAcceptance()).resolves.toBe(
      false,
    )

    const identityService = createIdentityService()
    const provider = createAuthProvider(null)
    const { result } = renderAuth(provider, identityService, true)
    await waitFor(() => expect(result.current.status).toBe('anonymous'))
    await expect(
      result.current.requestPasswordReset('manager@example.com'),
    ).resolves.toBeUndefined()
    expect(identityService.requestPasswordRecovery).toHaveBeenCalledWith({
      email: 'manager@example.com',
    })

    await expect(result.current.resetPassword('new-password')).rejects.toThrow(
      'O token de recuperação não foi informado.',
    )
    window.history.replaceState(null, '', '/reset-password?token=token-1')
    await act(async () => result.current.resetPassword('new-password'))
    expect(identityService.resetPassword).toHaveBeenCalledWith({
      token: 'token-1',
      password: 'new-password',
    })
    expect(provider.signOut).toHaveBeenCalledOnce()
  })

  it('unsubscribes on unmount and returns null when there is no session to refresh', async () => {
    const authProvider = createAuthProvider(null)
    const { result, unmount } = renderAuth(authProvider, createIdentityService())
    await waitFor(() => expect(result.current.status).toBe('anonymous'))
    await expect(result.current.refreshAccount()).resolves.toBeNull()
    unmount()
    expect(authProvider.onAuthStateChange).toHaveBeenCalledOnce()
  })
})
