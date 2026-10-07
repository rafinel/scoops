import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'

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
  analyticsMock,
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
  analyticsMock: {
    startWorkflow: vi.fn(
      (input: {
        workflow: 'onboarding'
        entryKey: string
        restoredOccurrenceId?: string
      }): { occurrenceId: string | undefined } => ({
        occurrenceId: input.restoredOccurrenceId ?? 'onboarding-occurrence-1',
      }),
    ),
    startAttempt: vi.fn(() => ({})),
    recordValidationFailure: vi.fn(),
    recordFailure: vi.fn(),
    completeWorkflow: vi.fn(),
    endWorkflow: vi.fn(),
  },
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

vi.mock('@/ui/shared/hooks/use-analytics-context', () => ({
  useAnalyticsContext: () => analyticsMock,
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
    expect(analyticsMock.startAttempt).toHaveBeenCalledOnce()
    expect(analyticsMock.recordValidationFailure).toHaveBeenCalledWith({
      attempt: expect.any(Object),
      fields: [
        'establishmentName',
        'managerName',
        'email',
        'password',
        'passwordConfirmation',
      ],
    })
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
    expect(analyticsMock.startWorkflow).toHaveBeenCalledWith({
      workflow: 'onboarding',
      entryKey: expect.any(String),
    })
    const attempt = analyticsMock.startAttempt.mock.results[0]?.value
    expect(analyticsMock.completeWorkflow).toHaveBeenCalledWith({
      attempt,
      onboardingExpiresAt: onboarding.expiresAt.getTime(),
    })
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken: 'a'.repeat(43),
      onboarding,
      analyticsOccurrenceId: 'onboarding-occurrence-1',
    })
  })

  it('reuses one caller-owned entry key across StrictMode effect replay', () => {
    renderHook(() => useOnboardingPage(), { wrapper: StrictMode })

    expect(analyticsMock.startWorkflow).toHaveBeenCalledTimes(2)
    expect(analyticsMock.startWorkflow.mock.calls[0]?.[0].entryKey).toBe(
      analyticsMock.startWorkflow.mock.calls[1]?.[0].entryKey,
    )
  })

  it('restores matching onboarding timing only after refreshing pending state', async () => {
    const continuationToken = 'b'.repeat(43)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken,
      onboarding,
      analyticsOccurrenceId: 'restored-occurrence-1',
    })
    getMock.mockResolvedValue(onboarding)

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => expect(result.current.state).toBe('pending'))

    expect(getMock).toHaveBeenCalledWith(continuationToken)
    expect(result.current.onboarding).toEqual(onboarding)
    expect(analyticsMock.startWorkflow).toHaveBeenCalledWith({
      workflow: 'onboarding',
      entryKey: expect.any(String),
      restoredOccurrenceId: 'restored-occurrence-1',
    })
    expect(getMock.mock.invocationCallOrder[0]).toBeLessThan(
      analyticsMock.startWorkflow.mock.invocationCallOrder[0],
    )
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken,
      onboarding,
      analyticsOccurrenceId: 'restored-occurrence-1',
    })
  })

  it('keeps legacy pending envelopes valid without inventing a timing occurrence', async () => {
    const continuationToken = 'z'.repeat(43)
    loadSessionMock.mockReturnValue({ version: 1, continuationToken, onboarding })
    getMock.mockResolvedValue(onboarding)

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => expect(result.current.state).toBe('pending'))

    expect(analyticsMock.startWorkflow).not.toHaveBeenCalled()
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken,
      onboarding,
    })
  })

  it('drops a mismatched occurrence marker after pending status has been refreshed', async () => {
    const continuationToken = 'm'.repeat(43)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken,
      onboarding,
      analyticsOccurrenceId: 'stale-occurrence-1',
    })
    getMock.mockResolvedValue(onboarding)
    analyticsMock.startWorkflow.mockReturnValueOnce({ occurrenceId: undefined })

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => expect(result.current.state).toBe('pending'))

    expect(analyticsMock.startWorkflow).toHaveBeenCalledWith({
      workflow: 'onboarding',
      entryKey: expect.any(String),
      restoredOccurrenceId: 'stale-occurrence-1',
    })
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
      actionStates.get.error = new Error('Cadastro não encontrado.')
      throw new Error('Cadastro não encontrado.')
    })
    registerMock.mockResolvedValue({ continuationToken: 'd'.repeat(43), onboarding })

    const { result } = renderHook(() => useOnboardingPage())

    await waitFor(() => {
      expect(result.current.state).toBe('expired')
      expect(result.current.error).toBe('Cadastro não encontrado.')
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

  it('ends the prior occurrence and starts a fresh occurrence on restart', () => {
    const { result } = renderHook(() => useOnboardingPage())

    act(() => result.current.handleRestart())

    expect(analyticsMock.endWorkflow).toHaveBeenCalledWith({
      workflow: expect.any(Object),
    })
    expect(analyticsMock.startWorkflow).toHaveBeenCalledTimes(2)
    expect(analyticsMock.startWorkflow.mock.calls[0]?.[0].entryKey).not.toBe(
      analyticsMock.startWorkflow.mock.calls[1]?.[0].entryKey,
    )
    expect(clearSessionMock).toHaveBeenCalledOnce()
    expect(result.current.state).toBe('form')
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
    expect(analyticsMock.recordValidationFailure).toHaveBeenCalledWith({
      attempt: expect.any(Object),
      fields: ['passwordConfirmation'],
    })
    expect(result.current.error).toBe('As senhas precisam ser iguais.')
  })

  it('records failed registration attempts without treating a retry as the same request', async () => {
    registerMock.mockRejectedValueOnce(new Error('private server detail'))
    registerMock.mockResolvedValueOnce({ continuationToken: 'r'.repeat(43), onboarding })
    const { result } = renderHook(() => useOnboardingPage())

    act(() => {
      result.current.updateForm('establishmentName', 'Gelato Central')
      result.current.updateForm('managerName', 'Ana')
      result.current.updateForm('email', 'ana@example.com')
      result.current.updateForm('password', 'password123')
      result.current.updateForm('confirmation', 'password123')
    })
    await act(async () =>
      result.current.handleSubmit({ preventDefault: vi.fn() } as never),
    )

    expect(result.current.state).toBe('error')
    expect(analyticsMock.recordFailure).toHaveBeenCalledWith({
      attempt: expect.any(Object),
      phase: 'submission',
      failureCode: 'unknown',
    })

    await act(async () =>
      result.current.handleSubmit({ preventDefault: vi.fn() } as never),
    )

    expect(analyticsMock.startAttempt).toHaveBeenCalledTimes(2)
    expect(analyticsMock.startAttempt.mock.results[0]?.value).not.toBe(
      analyticsMock.startAttempt.mock.results[1]?.value,
    )
    expect(analyticsMock.completeWorkflow).toHaveBeenCalledOnce()
    expect(JSON.stringify(analyticsMock.recordFailure.mock.calls)).not.toContain(
      'private server detail',
    )
  })

  it('resends a pending confirmation and exposes a recoverable resend error', async () => {
    const continuationToken = 'e'.repeat(43)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken,
      onboarding,
      analyticsOccurrenceId: 'resend-occurrence-1',
    })
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
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken,
      onboarding: { ...onboarding, email: 'new@example.com' },
      analyticsOccurrenceId: 'resend-occurrence-1',
    })

    resendMock.mockRejectedValueOnce(new Error('quota'))
    await act(async () => result.current.handleResend())
    expect(result.current.state).toBe('pending')
    expect(result.current.error).toBe('Não foi possível reenviar agora.')
  })

  it('corrects the confirmation email and returns to pending after canceling correction', async () => {
    const continuationToken = 'f'.repeat(43)
    loadSessionMock.mockReturnValue({
      version: 1,
      continuationToken,
      onboarding,
      analyticsOccurrenceId: 'correction-occurrence-1',
    })
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
    expect(saveSessionMock).toHaveBeenCalledWith({
      version: 1,
      continuationToken,
      onboarding: { ...onboarding, email: 'corrected@example.com' },
      analyticsOccurrenceId: 'correction-occurrence-1',
    })
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
