import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

const { pageState } = vi.hoisted(() => ({
  pageState: {
    actionDialogMessage: '',
    actionDialogTitle: '',
    actionError: null,
    actionPending: false,
    actionState: null,
    getUserActionItems: vi.fn(() => []),
    handleCloseAction: vi.fn(),
    handleConfirmAction: vi.fn(),
    handleOpenAction: vi.fn(),
    handleOpenUser: vi.fn(),
    inviteError: null,
    inviteUser: vi.fn(),
    isError: false,
    isInviting: false,
    isInviteOpen: false,
    isLoading: false,
    page: 1,
    pagination: { total: 1, totalPages: 1 },
    profile: undefined,
    refetch: vi.fn(),
    search: '',
    setInviteOpen: vi.fn(),
    setPage: vi.fn(),
    setProfile: vi.fn(),
    setSearch: vi.fn(),
    setStatus: vi.fn(),
    status: undefined,
    users: [
      {
        id: 'user-id',
        name: 'Marina Alves',
        email: 'marina@example.com',
        profile: 'operator',
        status: 'active',
        lastAccessAt: undefined,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ],
  },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className} href='/'>
      {children}
    </a>
  ),
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => ({ account: null }),
}))

vi.mock('../use-users-page', () => ({
  useUsersPage: () => pageState,
}))

vi.mock('../user-invite-dialog', () => ({
  UserInviteDialog: () => null,
}))

import { UsersPage } from '../index'

describe('UsersPage', () => {
  it('renders users as bounded cards for narrow layouts', () => {
    render(<UsersPage />)

    const card = screen.getByRole('article', { name: 'Usuário Marina Alves' })

    expect(card.className).toContain('min-w-0')
    expect(card.className).toContain('overflow-hidden')
    expect(card.textContent).toContain('marina@example.com')
  })
})
