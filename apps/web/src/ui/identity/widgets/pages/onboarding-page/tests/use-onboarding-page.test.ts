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
})
