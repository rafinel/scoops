import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

const { acceptMock, authState, navigateToMock, searchState } = vi.hoisted(() => ({
  acceptMock: vi.fn(),
  authState: {
    activateInvitationAcceptance: vi.fn(),
    clearInvitationAcceptance: vi.fn(),
    setInvitationPassword: vi.fn(),
  },
  navigateToMock: vi.fn(),
  searchState: { confirmationToken: 'confirmation-token' as string | undefined },
}))

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => searchState,
}))

vi.mock('@/ui/identity/hooks/use-accept-user-invitation-action', () => ({
  useAcceptUserInvitationAction: () => ({
    acceptUserInvitation: acceptMock,
    error: null,
  }),
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => authState,
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

import { useAcceptUserInvitationPage } from '../use-accept-user-invitation-page'

describe('useAcceptUserInvitationPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    searchState.confirmationToken = 'confirmation-token'
  })

  it('redirects the accepted account to the app root', async () => {
    navigateToMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAcceptUserInvitationPage())

    await act(async () => {
      await result.current.handleGoToApp()
    })

    expect(navigateToMock).toHaveBeenCalledWith('app')
  })

  it('clears the invitation session when server confirmation fails', async () => {
    authState.setInvitationPassword.mockResolvedValue(undefined)
    authState.clearInvitationAcceptance.mockResolvedValue(undefined)
    acceptMock.mockRejectedValue(new Error('Convite expirado.'))
    const { result } = renderHook(() => useAcceptUserInvitationPage())
    act(() => result.current.setPassword('12345678'))

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as never)
    })

    expect(authState.clearInvitationAcceptance).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('error')
  })
})
