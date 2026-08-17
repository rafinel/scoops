import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'

import type { AuthProvider, IdentityService } from '@scoops/core/identity/interfaces'
import type {
  AuthSession,
  AuthStateChangeListener,
} from '@scoops/core/identity/domain/structures'
import { InvalidCredentialsError } from '@scoops/core/identity/domain/errors'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { AuthContext } from '..'
import { useAuthContextProvider } from '../use-auth-context-provider'

describe('AuthContext', () => {
  afterEach(cleanup)

  it('restores a provider session only after local access succeeds', async () => {
    const session = createSession('restored-token')
    const authProvider = createAuthProvider(session)
    const identityService = createIdentityService()

    renderWithDependencies(authProvider, identityService)

    expect(screen.getByRole('status').textContent).toBe('resolving')
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('authenticated'),
    )
    expect(screen.getByText('Manager account').textContent).toBe('Manager account')
  })

  it('preserves an initial recovery redirect while restoring the session', async () => {
    const authProvider = createAuthProvider(createSession('recovery-token'))
    const identityService = createIdentityService()

    renderWithDependencies(authProvider, identityService, true)

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('authenticated'),
    )
    expect(screen.getByText('Recovery session').textContent).toBe('Recovery session')
  })

  it('signs out locally and publishes denied when local access returns 401', async () => {
    const authProvider = createAuthProvider(createSession('candidate-token'))
    const identityService = createIdentityService(new RestResponse({ statusCode: 401 }))

    renderWithDependencies(authProvider, identityService)

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('denied'))
    expect(authProvider.signOut).toHaveBeenCalledWith('local')
    expect(screen.getByText('No session').textContent).toBe('No session')
  })

  it('rejects sign-in with invalid credentials when local access is inactive', async () => {
    const authProvider = createAuthProvider(null, createSession('candidate-token'))
    const identityService = createIdentityService(new RestResponse({ statusCode: 401 }))
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContextTestProvider
        authProvider={authProvider}
        identityService={identityService}
        initialRedirect={false}
      >
        {children}
      </AuthContextTestProvider>
    )
    const { result } = renderHook(() => useAuthContext(), { wrapper })

    await act(async () => {
      await expect(
        result.current.signIn({ identifier: 'user@example.com', password: 'password' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    await waitFor(() => expect(result.current.status).toBe('denied'))
    expect(authProvider.signOut).toHaveBeenCalledWith('local')
  })

  it('does not let a provider sign-in event bypass local access rejection', async () => {
    const authProvider = createAuthProvider(null, createSession('candidate-token'))
    let providerListener: AuthStateChangeListener | undefined
    vi.spyOn(authProvider, 'onAuthStateChange').mockImplementation(
      (listener: AuthStateChangeListener) => {
        providerListener = listener
        return authProvider.unsubscribe
      },
    )
    vi.spyOn(authProvider, 'signIn').mockImplementation(async () => {
      providerListener?.('SIGNED_IN', createSession('candidate-token'))
      return createSession('candidate-token')
    })
    const identityService = createIdentityService(new RestResponse({ statusCode: 401 }))
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContextTestProvider
        authProvider={authProvider}
        identityService={identityService}
        initialRedirect={false}
      >
        {children}
      </AuthContextTestProvider>
    )
    const { result } = renderHook(() => useAuthContext(), { wrapper })

    await act(async () => {
      await expect(
        result.current.signIn({ identifier: 'user@example.com', password: 'password' }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError)
    })

    expect(authProvider.signOut).toHaveBeenCalledWith('local')
  })

  it('preserves the provider session for 503 and retries local access', async () => {
    const authProvider = createAuthProvider(createSession('retry-token'))
    const identityService = createIdentityService(
      new RestResponse({ statusCode: 503 }),
      new RestResponse({ body: createAccount() }),
    )

    renderWithDependencies(authProvider, identityService)

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('unavailable'),
    )
    expect(screen.getByText('Session preserved').textContent).toBe('Session preserved')

    fireEvent.click(screen.getByRole('button', { name: 'Retry local access' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('authenticated'),
    )
  })

  it('promotes the pending confirmation session after local activation succeeds', async () => {
    const authProvider = createAuthProvider(createSession('confirmation-token'))
    const identityService = createIdentityService()

    renderWithDependencies(authProvider, identityService, () => 'onboarding-confirmation')

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('anonymous'))
    fireEvent.click(screen.getByRole('button', { name: 'Activate onboarding' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('authenticated'),
    )
    expect(authProvider.signOut).not.toHaveBeenCalled()
    expect(screen.getByText('Manager account').textContent).toBe('Manager account')
  })

  it('keeps invitation acceptance separate until password and local confirmation succeed', async () => {
    const authProvider = createAuthProvider(createSession('invitation-token'))
    const identityService = createIdentityService()

    renderWithDependencies(authProvider, identityService, () => 'invitation-acceptance')

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('anonymous'))
    expect(screen.getByText('Invitation session').textContent).toBe('Invitation session')

    fireEvent.click(screen.getByRole('button', { name: 'Set invitation password' }))
    await waitFor(() =>
      expect(authProvider.updatePassword).toHaveBeenCalledWith('password'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Activate invitation' }))

    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('authenticated'),
    )
    expect(authProvider.signOut).not.toHaveBeenCalled()
  })

  it('clears the invitation session when setting the password fails', async () => {
    const authProvider = createAuthProvider(createSession('invitation-token'))
    vi.spyOn(authProvider, 'updatePassword').mockRejectedValueOnce(
      new Error('password rejected'),
    )
    const identityService = createIdentityService()

    renderWithDependencies(authProvider, identityService, () => 'invitation-acceptance')

    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('anonymous'))
    fireEvent.click(screen.getByRole('button', { name: 'Set invitation password' }))

    await waitFor(() => expect(authProvider.signOut).toHaveBeenCalledWith('global'))
    expect(screen.getByRole('status').textContent).toBe('anonymous')
  })

  it('does not republish authenticated state when validation resolves after sign-out', async () => {
    const session = createSession('stale-token')
    const authProvider = createAuthProvider(null, session)
    let resolveValidation:
      | ((response: RestResponse<ReturnType<typeof createAccount>>) => void)
      | undefined
    const identityService = createIdentityService()
    identityService.getAccount = vi.fn(
      () =>
        new Promise<RestResponse<ReturnType<typeof createAccount>>>((resolve) => {
          resolveValidation = resolve
        }),
    )

    renderWithDependencies(authProvider, identityService)
    await waitFor(() => expect(authProvider.signIn).not.toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(authProvider.signIn).toHaveBeenCalled())
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toBe('anonymous'))

    await act(async () => {
      resolveValidation?.(new RestResponse({ body: createAccount() }))
    })

    expect(screen.getByRole('status').textContent).toBe('anonymous')
  })

  it('unsubscribes from provider events when it unmounts', async () => {
    const authProvider = createAuthProvider(null)
    const identityService = createIdentityService()
    const { unmount } = renderWithDependencies(authProvider, identityService)

    await waitFor(() => expect(authProvider.getSession).toHaveBeenCalled())
    unmount()

    expect(authProvider.unsubscribe).toHaveBeenCalledOnce()
  })

  it('refreshes the server-authoritative account projection', async () => {
    const authProvider = createAuthProvider(createSession('refresh-token'))
    const identityService = createIdentityService(
      new RestResponse({ body: createAccount() }),
      new RestResponse({ body: { ...createAccount(), name: 'Updated Manager' } }),
    )
    const { result } = renderHook(() => useAuthContext(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <AuthContextTestProvider
          authProvider={authProvider}
          identityService={identityService}
          initialRedirect={false}
        >
          {children}
        </AuthContextTestProvider>
      ),
    })

    await waitFor(() => expect(result.current.status).toBe('authenticated'))
    await act(async () => {
      await result.current.refreshAccount()
    })

    expect(result.current.account?.name).toBe('Updated Manager')
  })
})

const AuthContextProbe = () => {
  const auth = useAuthContext()

  return (
    <>
      <div role='status'>{auth.status}</div>
      <div>{auth.account ? `${auth.account.name} account` : 'No session'}</div>
      <div>{auth.isPasswordRecovery ? 'Recovery session' : 'Regular session'}</div>
      {auth.isInvitationAcceptance && <div>Invitation session</div>}
      {auth.session && <div>Session preserved</div>}
      <button
        type='button'
        onClick={() =>
          void auth.signIn({ identifier: 'user@example.com', password: 'password' })
        }
      >
        Sign in
      </button>
      <button type='button' onClick={() => void auth.signOut()}>
        Sign out
      </button>
      <button type='button' onClick={() => void auth.retryLocalAccess()}>
        Retry local access
      </button>
      <button type='button' onClick={() => void auth.activateOnboardingConfirmation()}>
        Activate onboarding
      </button>
      <button
        type='button'
        onClick={() => void auth.setInvitationPassword('password').catch(() => undefined)}
      >
        Set invitation password
      </button>
      <button type='button' onClick={() => void auth.activateInvitationAcceptance()}>
        Activate invitation
      </button>
    </>
  )
}

function renderWithDependencies(
  authProvider: AuthProvider,
  identityService: Pick<IdentityService, 'getAccount'>,
  initialRedirect:
    | boolean
    | (() =>
        | 'none'
        | 'password-recovery'
        | 'onboarding-confirmation'
        | 'invitation-acceptance') = false,
) {
  return render(
    <AuthContextTestProvider
      authProvider={authProvider}
      identityService={identityService}
      initialRedirect={initialRedirect}
    >
      <AuthContextProbe />
    </AuthContextTestProvider>,
  )
}

const AuthContextTestProvider = ({
  authProvider,
  identityService,
  initialRedirect,
  children,
}: {
  authProvider: AuthProvider
  identityService: Pick<IdentityService, 'getAccount'>
  initialRedirect:
    | boolean
    | (() =>
        | 'none'
        | 'password-recovery'
        | 'onboarding-confirmation'
        | 'invitation-acceptance')
  children: React.ReactNode
}) => {
  const value = useAuthContextProvider(authProvider, identityService, initialRedirect)
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function createAuthProvider(
  restoredSession: AuthSession | null,
  signedInSession: AuthSession | null = restoredSession,
) {
  const unsubscribeMock = vi.fn<() => void>()
  const authProvider: AuthProvider & { unsubscribe: typeof unsubscribeMock } = {
    getSession: vi.fn().mockResolvedValue(restoredSession),
    signIn: vi.fn().mockResolvedValue(signedInSession),
    getUser: vi.fn().mockResolvedValue(null),
    onAuthStateChange: vi.fn((nextListener: AuthStateChangeListener) => {
      void nextListener
      return authProvider.unsubscribe
    }),
    signOut: vi.fn().mockResolvedValue(undefined),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    unsubscribe: unsubscribeMock,
  }

  return authProvider
}

function createIdentityService(
  ...responses: RestResponse<ReturnType<typeof createAccount>>[]
) {
  let responseIndex = 0
  return {
    getAccount: vi.fn(
      async () =>
        responses[responseIndex++] ?? new RestResponse({ body: createAccount() }),
    ),
  } satisfies Pick<IdentityService, 'getAccount'>
}

function createSession(accessToken: string): AuthSession {
  return {
    accessToken,
    user: { id: 'user-id', email: 'manager@example.com' },
  }
}

function createAccount() {
  return {
    id: 'user-id',
    establishmentId: 'establishment-id',
    establishmentName: 'Scoops',
    name: 'Manager',
    email: 'manager@example.com',
    profile: 'manager' as const,
  }
}
