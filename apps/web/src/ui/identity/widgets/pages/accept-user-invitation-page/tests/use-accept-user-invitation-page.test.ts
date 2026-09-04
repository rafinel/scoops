import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

const { acceptMock, navigateToMock } = vi.hoisted(() => ({
  acceptMock: vi.fn(),
  navigateToMock: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-accept-user-invitation-action', () => ({
  useAcceptUserInvitationAction: () => ({
    acceptUserInvitation: acceptMock,
    error: null,
  }),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

import { useAcceptUserInvitationPage } from '../use-accept-user-invitation-page'

describe('useAcceptUserInvitationPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
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
    acceptMock.mockRejectedValue(new Error('Convite expirado.'))
    const { result } = renderHook(() => useAcceptUserInvitationPage('c'.repeat(43)))
    act(() => result.current.setPassword('12345678'))

    await act(async () => {
      await result.current.submit({ preventDefault: vi.fn() } as never)
    })

    expect(acceptMock).toHaveBeenCalledWith({
      confirmationToken: 'c'.repeat(43),
      password: '12345678',
    })
    expect(result.current.state).toBe('error')
  })
})
