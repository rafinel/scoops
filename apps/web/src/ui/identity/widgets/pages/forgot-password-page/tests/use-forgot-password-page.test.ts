import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import { useForgotPasswordPage } from '../use-forgot-password-page'

const { actionState, requestRecoveryMock } = vi.hoisted(() => ({
  actionState: {
    error: null as Error | null,
    isPending: false,
  },
  requestRecoveryMock: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-request-password-recovery-action', () => ({
  useRequestPasswordRecoveryAction: () => ({
    error: actionState.error,
    isPending: actionState.isPending,
    requestRecovery: requestRecoveryMock,
  }),
}))

describe('useForgotPasswordPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    actionState.error = null
    actionState.isPending = false
  })

  it('keeps invalid email input local and does not call the recovery action', async () => {
    const { result } = renderHook(() => useForgotPasswordPage())
    const preventDefault = vi.fn()

    act(() => result.current.handleEmailChange('invalid-email'))
    await act(async () => {
      await result.current.handleSubmit({ preventDefault } as never)
    })

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(requestRecoveryMock).not.toHaveBeenCalled()
    expect(result.current.validationError).toBe('Informe um email válido para continuar.')
    expect(result.current.isSubmitted).toBe(false)
  })

  it('trims valid email input and enters the neutral submitted state', async () => {
    requestRecoveryMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useForgotPasswordPage())

    act(() => result.current.handleEmailChange('  manager@example.com  '))
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(requestRecoveryMock).toHaveBeenCalledWith('manager@example.com')
    expect(result.current.isSubmitted).toBe(true)
    expect(result.current.validationError).toBeNull()
  })

  it('keeps the same submitted state when the provider rejects the request', async () => {
    requestRecoveryMock.mockRejectedValue(new Error('provider unavailable'))
    const { result } = renderHook(() => useForgotPasswordPage())

    act(() => result.current.handleEmailChange('manager@example.com'))
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.isSubmitted).toBe(true)
    expect(result.current.error).toBeNull()
  })
})
