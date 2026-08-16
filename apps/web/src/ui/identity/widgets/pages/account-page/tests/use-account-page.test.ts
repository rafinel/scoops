import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import type { Account } from '@scoops/core/identity/domain/entities'

import { useAccountPage } from '../use-account-page'

const { actionState, authState, logoutState, navigateToMock, showErrorToastMock } =
  vi.hoisted(() => ({
    actionState: {
      changeOwnUserName: vi.fn(),
      error: null as Error | null,
      isPending: false,
    },
    authState: { account: null as Account | null },
    logoutState: {
      error: null as Error | null,
      isPending: false,
      logout: vi.fn(),
    },
    navigateToMock: vi.fn(),
    showErrorToastMock: vi.fn(),
  }))

vi.mock('@/ui/identity/hooks/use-change-own-user-name-action', () => ({
  useChangeOwnUserNameAction: () => actionState,
}))
vi.mock('@/ui/identity/hooks/use-logout-action', () => ({
  useLogoutAction: () => logoutState,
}))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => authState,
}))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))
vi.mock('@/ui/shared/notifications', () => ({
  showErrorToast: showErrorToastMock,
}))

describe('useAccountPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    authState.account = {
      id: 'account-id',
      establishmentId: 'establishment-id',
      establishmentName: 'Scoops Central',
      name: 'Ana Manager',
      email: 'ana@example.com',
      profile: 'manager',
    } as Account
    actionState.error = null
    actionState.isPending = false
    logoutState.error = null
    logoutState.isPending = false
  })

  it('trims a valid name and keeps the success announcement after closing the dialog', async () => {
    actionState.changeOwnUserName.mockResolvedValue(authState.account)
    const { result } = renderHook(() => useAccountPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('  Ana Atualizada  '))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(actionState.changeOwnUserName).toHaveBeenCalledWith('Ana Atualizada')
    expect(result.current.isNameDialogOpen).toBe(false)
    expect(result.current.announcement).toBe('Nome atualizado com sucesso.')
  })

  it('rejects an empty name without calling the mutation', async () => {
    const { result } = renderHook(() => useAccountPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('   '))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(actionState.changeOwnUserName).not.toHaveBeenCalled()
    expect(result.current.error).toBe('Informe seu nome completo.')
    expect(result.current.isNameDialogOpen).toBe(true)
  })

  it('retains failed input and keeps the dialog open for retry', async () => {
    actionState.changeOwnUserName.mockRejectedValue(new Error('request failed'))
    const { result } = renderHook(() => useAccountPage())

    act(() => result.current.handleOpenNameDialog())
    act(() => result.current.handleNameChange('Name to retry'))
    await act(async () => {
      await result.current.handleNameSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.name).toBe('Name to retry')
    expect(result.current.isNameDialogOpen).toBe(true)
    expect(showErrorToastMock).toHaveBeenCalledWith('request failed')
  })
})
