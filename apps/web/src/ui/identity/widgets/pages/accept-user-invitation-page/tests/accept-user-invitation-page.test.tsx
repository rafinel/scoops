import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AcceptUserInvitationPage } from '..'

import { useAcceptUserInvitationPage } from '../use-accept-user-invitation-page'

vi.mock('../use-accept-user-invitation-page', () => ({
  useAcceptUserInvitationPage: vi.fn(),
}))

const useAcceptUserInvitationPageMock = vi.mocked(useAcceptUserInvitationPage)
const handleGoToAppMock = vi.fn()

describe('AcceptUserInvitationPage', () => {
  // Acceptance receives its session through the server response cookie.
  beforeEach(() => {
    vi.clearAllMocks()
    useAcceptUserInvitationPageMock.mockReturnValue(fakeAcceptUserInvitationPage())
  })

  afterEach(() => {
    cleanup()
  })

  it('offers navigation to the app after the invitation is accepted', () => {
    render(<AcceptUserInvitationPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o Scoops' }))

    expect(handleGoToAppMock).toHaveBeenCalledOnce()
  })
})

function fakeAcceptUserInvitationPage(): ReturnType<typeof useAcceptUserInvitationPage> {
  return {
    acceptanceError: null,
    error: null,
    handleGoToApp: handleGoToAppMock,
    password: '',
    register: vi.fn(() => ({})) as never,
    setPassword: vi.fn(),
    state: 'accepted',
    submit: vi.fn(),
  }
}
