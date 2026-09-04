import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

import { useOnboardingConfirmationPage } from '../use-onboarding-confirmation-page'

const {
  actionState,
  authMock,
  confirmMock,
  loadSessionMock,
  clearSessionMock,
  navigateToMock,
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
        expiresAt: new Date('2026-08-20T12:00:00.000Z'),
      },
    })

    const { result } = renderHook(() => useOnboardingConfirmationPage('a'.repeat(43)))

    await waitFor(() => expect(result.current.state).toBe('success'))

    expect(confirmMock).toHaveBeenCalledWith('a'.repeat(43))
    expect(authMock.activateOnboardingConfirmation).toHaveBeenCalledOnce()
    expect(clearSessionMock).toHaveBeenCalledOnce()
    expect(navigateToMock).toHaveBeenCalledWith('app')
    expect(result.current.onboarding?.email).toBe('ana@example.com')
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
