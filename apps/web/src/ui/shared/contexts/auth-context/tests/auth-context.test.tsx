import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import type { AuthProvider, IdentityService } from '@scoops/core/identity/interfaces'
import type {
  AuthSession,
  AuthStateChangeListener,
} from '@scoops/core/identity/domain/structures'
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
})

const AuthContextProbe = () => {
  const auth = useAuthContext()

  return (
    <>
      <div role='status'>{auth.status}</div>
      <div>{auth.account ? `${auth.account.name} account` : 'No session'}</div>
      <div>{auth.isPasswordRecovery ? 'Recovery session' : 'Regular session'}</div>
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
    </>
  )
}

function renderWithDependencies(
  authProvider: AuthProvider,
  identityService: IdentityService,
  initialRecovery = false,
) {
  return render(
    <AuthContextTestProvider
      authProvider={authProvider}
      identityService={identityService}
      initialRecovery={initialRecovery}
    >
      <AuthContextProbe />
    </AuthContextTestProvider>,
  )
}

const AuthContextTestProvider = ({
  authProvider,
  identityService,
  initialRecovery,
  children,
}: {
  authProvider: AuthProvider
  identityService: IdentityService
  initialRecovery: boolean
  children: React.ReactNode
}) => {
  const value = useAuthContextProvider(authProvider, identityService, initialRecovery)
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
  } satisfies IdentityService
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
    name: 'Manager',
    email: 'manager@example.com',
    profile: 'manager' as const,
  }
}
