import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
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
    handleInviteOpenChange: vi.fn(),
    inviteError: null,
    inviteUser: vi.fn(),
    isError: false,
    isInviting: false,
    isInviteOpen: false,
    isMobileLayout: true,
    isLoading: false,
    page: 1,
    pagination: { total: 1, totalPages: 1 },
    profile: undefined,
    refetch: vi.fn(),
    search: '',
    setPage: vi.fn(),
    setProfile: vi.fn(),
    setSearch: vi.fn(),
    setStatus: vi.fn(),
    status: undefined,
    summary: { total: 8, managers: 3, operators: 5 },
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
  useUsersPage: vi.fn(),
}))

vi.mock('../user-invite-dialog', () => ({
  UserInviteDialog: () => null,
}))

import { UsersPage } from '../index'

import { useUsersPage } from '../use-users-page'

const useUsersPageMock = vi.mocked(useUsersPage)

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUsersPageMock.mockReturnValue(pageState as never)
  })

  afterEach(cleanup)

  it('renders the global summary independently from filtered pagination', () => {
    render(<UsersPage />)

    expect(screen.getByRole('heading', { name: /Usuários/ }).textContent).toContain('(8)')
    expect(screen.getByText('8 usuários').textContent).toBe('8 usuários')
    expect(screen.getByText('3 gerentes · 5 operadores').textContent).toBe(
      '3 gerentes · 5 operadores',
    )
    expect(screen.getByRole('button', { name: /Todos\s*8/ }).textContent).toContain('8')
    expect(screen.getByRole('button', { name: /Gerentes\s*3/ }).textContent).toContain(
      '3',
    )
    expect(screen.getByRole('button', { name: /Operadores\s*5/ }).textContent).toContain(
      '5',
    )
    expect(screen.getByText('Mostrando 1 de 1 usuários').textContent).toBe(
      'Mostrando 1 de 1 usuários',
    )
  })

  it('renders users as bounded cards for narrow layouts', () => {
    render(<UsersPage />)

    const card = screen.getByRole('article', { name: 'Usuário Marina Alves' })

    expect(card.className).toContain('min-w-0')
    expect(card.className).toContain('overflow-hidden')
    expect(card.textContent).toContain('marina@example.com')
  })
})
