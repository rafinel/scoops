import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderHook, waitFor } from '@testing-library/react'

import { useLandingPage } from '../use-landing-page'

const { navigateMock, hasRecoveryErrorMock, hasRecoveryMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  hasRecoveryErrorMock: vi.fn(),
  hasRecoveryMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/provision/auth/supabase/supabase-client', () => ({
  hasPasswordRecoveryErrorRedirect: hasRecoveryErrorMock,
  hasPasswordRecoveryRedirect: hasRecoveryMock,
}))

describe('useLandingPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    hasRecoveryErrorMock.mockReturnValue(false)
    hasRecoveryMock.mockReturnValue(false)
  })

  it('does not navigate for a normal landing visit', async () => {
    renderHook(() => useLandingPage())

    await waitFor(() => expect(navigateMock).not.toHaveBeenCalled())
  })

  it('redirects provider error recovery links to reset password', async () => {
    hasRecoveryErrorMock.mockReturnValue(true)

    renderHook(() => useLandingPage())

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({ to: '/reset-password' }),
    )
    expect(hasRecoveryMock).not.toHaveBeenCalled()
  })

  it('preserves the recovery hash when redirecting a valid recovery link', async () => {
    window.history.replaceState(null, '', '/#type=recovery&access_token=token')
    hasRecoveryMock.mockReturnValue(true)

    renderHook(() => useLandingPage())

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith({
        to: '/reset-password',
        hash: '#type=recovery&access_token=token',
      }),
    )
  })
})
