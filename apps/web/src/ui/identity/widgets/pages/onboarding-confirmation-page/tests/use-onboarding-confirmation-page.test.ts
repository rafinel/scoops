import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'

import { useOnboardingConfirmationPage } from '../use-onboarding-confirmation-page'

const {
  actionState,
  authMock,
  confirmMock,
  loadSessionMock,
  clearSessionMock,
  navigateToMock,
  analyticsMock,
} = vi.hoisted(() => ({
  actionState: {
    error: null as Error | null,
    isPending: false,
  },
  authMock: {
    activateOnboardingConfirmation: vi.fn(),
    completeOnboardingConfirmation: vi.fn(),
  },
  confirmMock: vi.fn(),
  loadSessionMock: vi.fn(),
  clearSessionMock: vi.fn(),
  navigateToMock: vi.fn(),
  analyticsMock: {
    startWorkflow: vi.fn(
      (input: {
        workflow: 'onboarding'
        entryKey: string
        restoredOccurrenceId?: string
      }) => ({
        occurrenceId: input.restoredOccurrenceId ?? 'confirmation-occurrence-1',
      }),
    ),
    recordEmailConfirmation: vi.fn(),
    recordAccountActivationFailure: vi.fn(),
    endWorkflow: vi.fn(),
  },
}))

vi.mock('@/ui/identity/hooks/use-confirm-ice-cream-shop-onboarding-action', () => ({
  useConfirmIceCreamShopOnboardingAction: () => ({
    confirmIceCreamShopOnboarding: confirmMock,
    error: actionState.error,
    isPending: actionState.isPending,
  }),
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => authMock,
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

vi.mock('@/ui/identity/storage/onboarding-session-storage', () => ({
  clearOnboardingSession: clearSessionMock,
  loadOnboardingSession: loadSessionMock,
}))

vi.mock('@/ui/shared/hooks/use-analytics-context', () => ({
  useAnalyticsContext: () => analyticsMock,
}))

describe('useOnboardingConfirmationPage', () => {
  // Confirmation is one-time and never retains a browser-readable auth token.
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    actionState.error = null
    actionState.isPending = false
    loadSessionMock.mockReturnValue(null)
  })

  it('rejects malformed confirmation tokens before calling the action', async () => {
    const { result } = renderHook(() => useOnboardingConfirmationPage('invalid-token'))

    await waitFor(() => expect(result.current.state).toBe('unavailable'))

    expect(confirmMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('clears the local continuation after successful confirmation', async () => {
    confirmMock.mockResolvedValue(undefined)
    authMock.activateOnboardingConfirmation.mockResolvedValue(true)
    navigateToMock.mockResolvedValue(undefined)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken: 'a'.repeat(43),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2099-08-20T12:00:00.000Z'),
      },
      analyticsOccurrenceId: 'confirmation-occurrence-1',
    })

    const { result } = renderHook(() => useOnboardingConfirmationPage('a'.repeat(43)))

    await waitFor(() => expect(result.current.state).toBe('success'))

    expect(confirmMock).toHaveBeenCalledWith('a'.repeat(43))
    expect(authMock.activateOnboardingConfirmation).toHaveBeenCalledOnce()
    expect(clearSessionMock).toHaveBeenCalledOnce()
    expect(navigateToMock).toHaveBeenCalledWith('app')
    expect(result.current.onboarding?.email).toBe('ana@example.com')
    expect(analyticsMock.startWorkflow).toHaveBeenCalledWith({
      workflow: 'onboarding',
      entryKey: expect.any(String),
      restoredOccurrenceId: 'confirmation-occurrence-1',
    })
    expect(analyticsMock.recordEmailConfirmation).toHaveBeenCalledWith({
      observationKey: expect.any(String),
      workflow: expect.objectContaining({ occurrenceId: 'confirmation-occurrence-1' }),
      outcome: 'success',
    })
    expect(
      analyticsMock.recordEmailConfirmation.mock.calls[0]?.[0].observationKey,
    ).not.toBe('a'.repeat(43))
    expect(
      analyticsMock.recordEmailConfirmation.mock.invocationCallOrder[0],
    ).toBeLessThan(authMock.activateOnboardingConfirmation.mock.invocationCallOrder[0])
  })

  it('records failed email confirmation without exposing the token or inventing an attempt', async () => {
    confirmMock.mockRejectedValue(new Error('private confirmation details'))
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken: 'b'.repeat(43),
      analyticsOccurrenceId: 'confirmation-occurrence-2',
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2099-08-20T12:00:00.000Z'),
      },
    })

    const { result } = renderHook(() => useOnboardingConfirmationPage('b'.repeat(43)))

    await waitFor(() => expect(result.current.state).toBe('provider-error'))

    expect(analyticsMock.recordEmailConfirmation).toHaveBeenCalledWith({
      observationKey: expect.any(String),
      workflow: expect.objectContaining({ occurrenceId: 'confirmation-occurrence-2' }),
      outcome: 'failure',
      failureCode: 'unknown',
    })
    expect(
      analyticsMock.recordEmailConfirmation.mock.calls[0]?.[0].observationKey,
    ).not.toBe('b'.repeat(43))
    expect(authMock.activateOnboardingConfirmation).not.toHaveBeenCalled()
    expect(clearSessionMock).not.toHaveBeenCalled()
  })

  it('records account activation failure as a separate phase after confirmation succeeds', async () => {
    confirmMock.mockResolvedValue(undefined)
    authMock.activateOnboardingConfirmation.mockResolvedValue(false)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken: 'c'.repeat(43),
      analyticsOccurrenceId: 'confirmation-occurrence-3',
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2099-08-20T12:00:00.000Z'),
      },
    })

    const { result } = renderHook(() => useOnboardingConfirmationPage('c'.repeat(43)))

    await waitFor(() => expect(result.current.state).toBe('provider-error'))

    expect(analyticsMock.recordEmailConfirmation).toHaveBeenCalledWith({
      observationKey: expect.any(String),
      workflow: expect.objectContaining({ occurrenceId: 'confirmation-occurrence-3' }),
      outcome: 'success',
    })
    expect(analyticsMock.recordAccountActivationFailure).toHaveBeenCalledWith({
      observationKey:
        analyticsMock.recordEmailConfirmation.mock.calls[0]?.[0].observationKey,
      workflow: expect.objectContaining({ occurrenceId: 'confirmation-occurrence-3' }),
      failureCode: 'unknown',
    })
    expect(
      analyticsMock.recordEmailConfirmation.mock.invocationCallOrder[0],
    ).toBeLessThan(
      analyticsMock.recordAccountActivationFailure.mock.invocationCallOrder[0],
    )
  })

  it('keeps a legacy confirmation envelope valid without occurrence correlation', async () => {
    confirmMock.mockResolvedValue(undefined)
    authMock.activateOnboardingConfirmation.mockResolvedValue(true)
    navigateToMock.mockResolvedValue(undefined)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken: 'd'.repeat(43),
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2099-08-20T12:00:00.000Z'),
      },
    })

    renderHook(() => useOnboardingConfirmationPage('d'.repeat(43)))

    await waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('app'))

    expect(analyticsMock.startWorkflow).not.toHaveBeenCalled()
    expect(analyticsMock.recordEmailConfirmation).toHaveBeenCalledWith({
      observationKey: expect.any(String),
      outcome: 'success',
    })
  })

  it('reuses confirmation request and observation keys across StrictMode effect replay', async () => {
    let resolveConfirmation: (() => void) | undefined
    const confirmation = new Promise<void>((resolve) => {
      resolveConfirmation = resolve
    })
    confirmMock.mockReturnValue(confirmation)
    authMock.activateOnboardingConfirmation.mockResolvedValue(true)
    navigateToMock.mockResolvedValue(undefined)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken: 'e'.repeat(43),
      analyticsOccurrenceId: 'confirmation-occurrence-5',
      onboarding: {
        establishmentName: 'Gelato Central',
        managerName: 'Ana',
        email: 'ana@example.com',
        expiresAt: new Date('2099-08-20T12:00:00.000Z'),
      },
    })

    renderHook(() => useOnboardingConfirmationPage('e'.repeat(43)), {
      wrapper: StrictMode,
    })

    expect(confirmMock).toHaveBeenCalledOnce()
    expect(analyticsMock.startWorkflow).toHaveBeenCalledTimes(2)
    expect(analyticsMock.startWorkflow.mock.calls[0]?.[0].entryKey).toBe(
      analyticsMock.startWorkflow.mock.calls[1]?.[0].entryKey,
    )

    resolveConfirmation?.()
    await waitFor(() => expect(navigateToMock).toHaveBeenCalledWith('app'))

    expect(analyticsMock.recordEmailConfirmation).toHaveBeenCalledTimes(2)
    expect(analyticsMock.recordEmailConfirmation.mock.calls[0]?.[0].observationKey).toBe(
      analyticsMock.recordEmailConfirmation.mock.calls[1]?.[0].observationKey,
    )
  })

  it('completes the auth boundary before restarting onboarding', async () => {
    authMock.completeOnboardingConfirmation.mockResolvedValue(undefined)
    navigateToMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOnboardingConfirmationPage())

    await act(async () => {
      await result.current.handleRestart()
    })

    expect(authMock.completeOnboardingConfirmation).toHaveBeenCalledOnce()
    expect(clearSessionMock).toHaveBeenCalledOnce()
    expect(navigateToMock).toHaveBeenCalledWith('onboarding')
  })

  it('uses the authenticated provider session when the success action is invoked', async () => {
    authMock.activateOnboardingConfirmation.mockResolvedValue(true)
    navigateToMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useOnboardingConfirmationPage())

    await act(async () => {
      await result.current.handleEnterApp()
    })

    expect(authMock.activateOnboardingConfirmation).toHaveBeenCalledOnce()
    expect(navigateToMock).toHaveBeenCalledWith('app')
  })
})
