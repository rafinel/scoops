import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import { useResetPasswordPage } from '../use-reset-password-page'

const { authState, navigateToMock, resetMock } = vi.hoisted(() => ({
  authState: {
    status: 'authenticated' as 'authenticated' | 'anonymous' | 'resolving',
  },
  navigateToMock: vi.fn(),
  resetMock: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: () => ({ navigateTo: navigateToMock }),
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => ({
    resetPassword: resetMock,
    status: authState.status,
  }),
}))

describe('useResetPasswordPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    authState.status = 'authenticated'
  })

  it('rejects short passwords before calling the reset action', async () => {
    const { result } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

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
    const { result } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

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

  it('exposes auth resolution while checking a recovery session', () => {
    authState.status = 'resolving'
    const { result, rerender } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

    expect(result.current.isResolving).toBe(true)
    expect(result.current.isPasswordRecovery).toBe(false)

    authState.status = 'anonymous'
    rerender()

    expect(result.current.isResolving).toBe(false)
    expect(result.current.isPasswordRecovery).toBe(false)
  })

  it('resets a valid password through AuthContext and navigates to login', async () => {
    resetMock.mockResolvedValue(undefined)
    navigateToMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

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

  it('exposes reset failures and keeps the form available', async () => {
    resetMock.mockRejectedValue(new Error('Password reset failed'))
    const { result } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

    act(() => {
      result.current.handlePasswordChange('password123')
      result.current.handleConfirmationChange('password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.actionError).toEqual(new Error('Password reset failed'))
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(false)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('normalizes non-Error reset failures', async () => {
    resetMock.mockRejectedValue('provider failure')
    const { result } = renderHook(() => useResetPasswordPage('r'.repeat(43)))

    act(() => {
      result.current.handlePasswordChange('password123')
      result.current.handleConfirmationChange('password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.actionError?.message).toBe(
      'Não foi possível atualizar sua senha.',
    )
    expect(result.current.isPending).toBe(false)
  })

  it('reports a missing recovery token without calling AuthContext', async () => {
    const { result } = renderHook(() => useResetPasswordPage())

    act(() => {
      result.current.handlePasswordChange('password123')
      result.current.handleConfirmationChange('password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(resetMock).not.toHaveBeenCalled()
    expect(result.current.actionError?.message).toBe(
      'O token de recuperação não foi informado.',
    )
    expect(result.current.isPending).toBe(false)
  })

  it('exposes an invalid state when the route token is absent', () => {
    const { result } = renderHook(() => useResetPasswordPage())

    expect(result.current.isResolving).toBe(false)
    expect(result.current.isPasswordRecovery).toBe(false)
  })
})
