import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import { useResetPasswordPage } from '../use-reset-password-page'

const { authState, actionState, navigateToMock, resetMock } = vi.hoisted(() => ({
  authState: {
    isPasswordRecovery: true,
    status: 'ready' as 'ready' | 'resolving',
  },
  actionState: {
    error: null as Error | null,
    isPending: false,
  },
  navigateToMock: vi.fn(),
  resetMock: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => authState,
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

vi.mock('@/ui/identity/hooks/use-reset-password-action', () => ({
  useResetPasswordAction: () => ({
    error: actionState.error,
    isPending: actionState.isPending,
    reset: resetMock,
  }),
}))

describe('useResetPasswordPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    authState.isPasswordRecovery = true
    authState.status = 'ready'
    actionState.error = null
    actionState.isPending = false
  })

  it('rejects short passwords before calling the reset action', async () => {
    const { result } = renderHook(() => useResetPasswordPage())

    act(() => {
      result.current.handlePasswordChange('short')
      result.current.handleConfirmationChange('short')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(resetMock).not.toHaveBeenCalled()
    expect(result.current.validationError).toBe(
      'A senha deve ter entre 8 e 64 caracteres.',
    )
  })

  it('rejects mismatched confirmation before calling the reset action', async () => {
    const { result } = renderHook(() => useResetPasswordPage())

    act(() => {
      result.current.handlePasswordChange('password123')
      result.current.handleConfirmationChange('password456')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(resetMock).not.toHaveBeenCalled()
    expect(result.current.validationError).toBe('As senhas precisam ser iguais.')
  })

  it('resets a valid password and navigates to login', async () => {
    resetMock.mockResolvedValue(undefined)
    navigateToMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useResetPasswordPage())

    act(() => {
      result.current.handlePasswordChange('password123')
      result.current.handleConfirmationChange('password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(resetMock).toHaveBeenCalledWith('password123')
    expect(result.current.isSuccess).toBe(true)
    expect(navigateToMock).toHaveBeenCalledWith('login')
  })

  it('exposes recovery resolution state from the auth context', () => {
    authState.status = 'resolving'
    authState.isPasswordRecovery = false

    const { result } = renderHook(() => useResetPasswordPage())

    expect(result.current.isResolving).toBe(true)
    expect(result.current.isPasswordRecovery).toBe(false)
  })
})
