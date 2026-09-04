import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'

import { useOnboardingPage } from '../use-onboarding-page'

const {
  actionStates,
  correctMock,
  getMock,
  loadSessionMock,
  registerMock,
  resendMock,
  saveSessionMock,
  clearSessionMock,
} = vi.hoisted(() => ({
  actionStates: {
    correct: { error: null as Error | null, isPending: false },
    get: { error: null as Error | null, isPending: false },
    register: { error: null as Error | null, isPending: false },
    resend: { error: null as Error | null, isPending: false },
  },
  correctMock: vi.fn(),
  getMock: vi.fn(),
  loadSessionMock: vi.fn(),
  registerMock: vi.fn(),
  resendMock: vi.fn(),
  saveSessionMock: vi.fn(),
  clearSessionMock: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-correct-ice-cream-shop-onboarding-email-action', () => ({
  useCorrectIceCreamShopOnboardingEmailAction: () => ({
    correctIceCreamShopOnboardingEmail: correctMock,
    ...actionStates.correct,
  }),
}))

vi.mock('@/ui/identity/hooks/use-get-ice-cream-shop-onboarding-action', () => ({
  useGetIceCreamShopOnboardingAction: () => ({
    getIceCreamShopOnboarding: getMock,
    ...actionStates.get,
  }),
}))

vi.mock('@/ui/identity/hooks/use-register-ice-cream-shop-action', () => ({
  useRegisterIceCreamShopAction: () => ({
    registerIceCreamShop: registerMock,
    ...actionStates.register,
  }),
}))

vi.mock('@/ui/identity/hooks/use-resend-ice-cream-shop-confirmation-action', () => ({
  useResendIceCreamShopConfirmationAction: () => ({
    resendIceCreamShopConfirmation: resendMock,
    ...actionStates.resend,
  }),
}))

vi.mock('@/ui/identity/storage/onboarding-session-storage', () => ({
  clearOnboardingSession: clearSessionMock,
  loadOnboardingSession: loadSessionMock,
  saveOnboardingSession: saveSessionMock,
}))

const onboarding = {
  establishmentName: 'Gelato Central',
  managerName: 'Ana',
  email: 'ana@example.com',
  expiresAt: new Date('2099-01-01T12:00:00.000Z'),
}

describe('useOnboardingPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    loadSessionMock.mockReturnValue(null)
    for (const state of Object.values(actionStates)) {
      state.error = null
      state.isPending = false
    }
  })

  it('reports missing required registration data without transport', async () => {
    const { result } = renderHook(() => useOnboardingPage())

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(registerMock).not.toHaveBeenCalled()
    expect(result.current.state).toBe('form')
    expect(result.current.error).toBe('Preencha os dados obrigatórios para continuar.')
  })

  it('registers valid data, stores the continuation, and enters pending state', async () => {
    registerMock.mockResolvedValue({ continuationToken: 'a'.repeat(43), onboarding })
    const { result } = renderHook(() => useOnboardingPage())

    act(() => {
      result.current.updateForm('establishmentName', 'Gelato Central')
      result.current.updateForm('managerName', 'Ana')
      result.current.updateForm('email', 'ana@example.com')
      result.current.updateForm('password', 'password123')
      result.current.updateForm('confirmation', 'password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(registerMock).toHaveBeenCalledWith({
      establishmentName: 'Gelato Central',
      managerName: 'Ana',
      email: 'ana@example.com',
      password: 'password123',
    })
    expect(result.current.state).toBe('pending')
    expect(result.current.onboarding).toEqual(onboarding)
    expect(result.current.form.email).toBe('')
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken: 'a'.repeat(43),
      onboarding,
    })
  })

  it('restores a saved continuation and refreshes its onboarding state', async () => {
    const continuationToken = 'b'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockResolvedValue(onboarding)

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => expect(result.current.state).toBe('pending'))

    expect(getMock).toHaveBeenCalledWith(continuationToken)
    expect(result.current.onboarding).toEqual(onboarding)
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken,
      onboarding,
    })
  })

  it('clears a failed restoration error when restarting and registering again', async () => {
    const continuationToken = 'c'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockImplementation(async () => {
      actionStates.get.error = new Error('Onboarding not found')
      throw new Error('Onboarding not found')
    })
    registerMock.mockResolvedValue({ continuationToken: 'd'.repeat(43), onboarding })

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => {
      expect(result.current.state).toBe('expired')
      expect(result.current.error).toBe('Onboarding not found')
    })

    act(() => result.current.handleRestart())

    expect(result.current.state).toBe('form')
    expect(result.current.error).toBeNull()

    act(() => {
      result.current.updateForm('establishmentName', 'Gelato Central')
      result.current.updateForm('managerName', 'Ana')
      result.current.updateForm('email', 'ana@example.com')
      result.current.updateForm('password', 'password123')
      result.current.updateForm('confirmation', 'password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(result.current.state).toBe('pending')
    expect(result.current.error).toBeNull()
  })

  it('reports password confirmation validation without registering', async () => {
    const { result } = renderHook(() => useOnboardingPage())
    act(() => {
      result.current.updateForm('establishmentName', 'Gelato Central')
      result.current.updateForm('managerName', 'Ana')
      result.current.updateForm('email', 'ana@example.com')
      result.current.updateForm('password', 'password123')
      result.current.updateForm('confirmation', 'different-password')
    })

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })

    expect(registerMock).not.toHaveBeenCalled()
    expect(result.current.error).toBe('As senhas precisam ser iguais.')
  })

  it('resends a pending confirmation and exposes a recoverable resend error', async () => {
    const continuationToken = 'e'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockResolvedValue(onboarding)
    resendMock.mockResolvedValue({ ...onboarding, email: 'new@example.com' })
    const { result } = renderHook(() => useOnboardingPage())
    await waitFor(() => expect(result.current.state).toBe('pending'))

    await act(async () => result.current.handleResend())
    expect(resendMock).toHaveBeenCalledWith(continuationToken)
    expect(result.current.feedbackMessage).toBe(
      'Uma nova confirmação foi enviada para seu e-mail.',
    )
    expect(result.current.onboarding?.email).toBe('new@example.com')

    resendMock.mockRejectedValueOnce(new Error('quota'))
    await act(async () => result.current.handleResend())
    expect(result.current.state).toBe('pending')
    expect(result.current.error).toBe('Não foi possível reenviar agora.')
  })

  it('corrects the confirmation email and returns to pending after canceling correction', async () => {
    const continuationToken = 'f'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockResolvedValue(onboarding)
    correctMock.mockResolvedValue({ ...onboarding, email: 'corrected@example.com' })
    const { result } = renderHook(() => useOnboardingPage())
    await waitFor(() => expect(result.current.state).toBe('pending'))

    act(() => result.current.handleStartCorrection())
    expect(result.current.state).toBe('correcting')
    act(() => result.current.updateForm('email', 'ignored@example.com'))
    act(() => result.current.toggleCorrectionPasswordVisibility())
    expect(result.current.isCorrectionPasswordVisible).toBe(true)
    act(() => result.current.handleCancelCorrection())
    expect(result.current.state).toBe('pending')
    expect(result.current.isCorrectionPasswordVisible).toBe(false)

    act(() => result.current.handleStartCorrection())
    const emailField = result.current.correctionRegister('email')
    const passwordField = result.current.correctionRegister('password')
    act(() => {
      emailField.onChange({
        target: { name: 'email', value: 'corrected@example.com' },
        type: 'change',
      })
      passwordField.onChange({
        target: { name: 'password', value: 'password123' },
        type: 'change',
      })
    })
    await act(async () => result.current.handleCorrectionSubmit())
    expect(correctMock).toHaveBeenCalledWith({
      continuationToken,
      email: 'corrected@example.com',
      password: 'password123',
    })
    expect(result.current.state).toBe('pending')
  })

  it('keeps correction and registration failures at their owning recovery states', async () => {
    const continuationToken = 'g'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockResolvedValue(onboarding)
    correctMock.mockRejectedValue(new Error('correction failed'))
    const { result } = renderHook(() => useOnboardingPage())
    await waitFor(() => expect(result.current.state).toBe('pending'))

    act(() => result.current.handleStartCorrection())
    const emailField = result.current.correctionRegister('email')
    const passwordField = result.current.correctionRegister('password')
    act(() => {
      emailField.onChange({
        target: { name: 'email', value: 'corrected@example.com' },
        type: 'change',
      })
      passwordField.onChange({
        target: { name: 'password', value: 'password123' },
        type: 'change',
      })
    })
    await act(async () => result.current.handleCorrectionSubmit())
    expect(result.current.state).toBe('correcting')
    expect(result.current.error).toBe('Não foi possível atualizar o e-mail.')

    registerMock.mockRejectedValueOnce(new Error('registration failed'))
    act(() => result.current.handleRestart())
    act(() => {
      result.current.updateForm('establishmentName', 'Gelato Central')
      result.current.updateForm('managerName', 'Ana')
      result.current.updateForm('email', 'ana@example.com')
      result.current.updateForm('password', 'password123')
      result.current.updateForm('confirmation', 'password123')
    })
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never)
    })
    expect(result.current.state).toBe('error')
  })
})
