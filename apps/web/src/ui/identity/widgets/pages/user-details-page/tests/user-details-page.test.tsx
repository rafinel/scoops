import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className} href='/users'>
      {children}
    </a>
  ),
}))

vi.mock('../use-user-details-page', () => ({
  useUserDetailsPage: vi.fn(),
}))

import { UserDetailsPage } from '../index'
import { useUserDetailsPage } from '../use-user-details-page'

const useUserDetailsPageMock = vi.mocked(useUserDetailsPage)

function createPageState() {
  const user = {
    id: 'user-id',
    establishmentId: 'establishment-id',
    name: 'Ana Operator',
    email: 'ana@example.com',
    profile: UserProfile.Operator,
    status: UserStatus.Active,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  }

  return {
    correctError: null,
    correctPending: false,
    dialog: null,
    error: null,
    handleCloseDialog: vi.fn(),
    handleConfirmAction: vi.fn(),
    handleCorrectInvitation: vi.fn(),
    handleCorrectName: vi.fn(),
    handleOpenDialog: vi.fn(),
    historyPage: 1,
    historyPageSize: 5,
    historyRecords: [],
    historyTotal: 0,
    isError: false,
    isLoading: false,
    isRefreshing: false,
    isSelf: false,
    invitationRemainingDays: undefined,
    invitationSentAt: undefined,
    nameError: null,
    namePending: false,
    pending: false,
    refetch: vi.fn(),
    setHistoryPage: vi.fn(),
    user,
    userDetails: { auditRecords: [], user },
  }
}

describe('UserDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUserDetailsPageMock.mockReturnValue(createPageState() as never)
  })

  afterEach(cleanup)

  it('keeps user details visible while announcing a refresh', () => {
    useUserDetailsPageMock.mockReturnValueOnce({
      ...createPageState(),
      isRefreshing: true,
    } as never)

    render(<UserDetailsPage userId='user-id' />)

    expect(screen.getByRole('status', { name: 'Atualizando…' })).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Ana Operator' })).not.toBeNull()
  })

  it('passes normalized invitation corrections from the dialog to the page handler', async () => {
    const pageState = createPageState()
    const user = { ...pageState.user, status: UserStatus.Pending }
    const handleCorrectInvitation = vi.fn().mockResolvedValue(undefined)
    useUserDetailsPageMock.mockReturnValueOnce({
      ...pageState,
      dialog: 'correctInvitation',
      handleCorrectInvitation,
      user,
      userDetails: { ...pageState.userDetails, user },
    } as never)

    render(<UserDetailsPage userId='user-id' />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome' }), {
      target: { value: '  Beatriz Lima  ' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'E-mail' }), {
      target: { value: '  beatriz@example.com  ' },
    })
    fireEvent.submit(screen.getByRole('dialog').querySelector('form') as HTMLFormElement)

    await waitFor(() =>
      expect(handleCorrectInvitation).toHaveBeenCalledWith({
        email: 'beatriz@example.com',
        name: 'Beatriz Lima',
      }),
    )
  })
})
