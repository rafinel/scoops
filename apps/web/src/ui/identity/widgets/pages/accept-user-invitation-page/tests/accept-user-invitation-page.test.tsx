import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

const { handleGoToAppMock } = vi.hoisted(() => ({
  handleGoToAppMock: vi.fn(),
}))

vi.mock('../use-accept-user-invitation-page', () => ({
  useAcceptUserInvitationPage: () => ({
    acceptanceError: null,
    error: null,
    handleGoToApp: handleGoToAppMock,
    password: '',
    setPassword: vi.fn(),
    state: 'accepted',
    submit: vi.fn(),
  }),
}))

import { AcceptUserInvitationPage } from '..'

describe('AcceptUserInvitationPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('offers navigation to the app after the invitation is accepted', () => {
    render(<AcceptUserInvitationPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ir para o Scoops' }))

    expect(handleGoToAppMock).toHaveBeenCalledOnce()
  })
})
