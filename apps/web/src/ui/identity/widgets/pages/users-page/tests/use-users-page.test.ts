import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import { UserProfile, UserStatus } from '@scoops/core/identity/domain/structures'

const {
  accountState,
  cancelAction,
  navigateMock,
  profileAction,
  resendAction,
  statusAction,
  useNavigateMock,
} = vi.hoisted(() => ({
  accountState: { account: null as { id: string } | null },
  cancelAction: { cancelUserInvitation: vi.fn(), error: null, isPending: false },
  navigateMock: vi.fn(),
  profileAction: { changeUserProfile: vi.fn(), error: null, isPending: false },
  resendAction: { error: null, isPending: false, resendUserInvitation: vi.fn() },
  statusAction: { changeUserStatus: vi.fn(), error: null, isPending: false },
  useNavigateMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: useNavigateMock,
  useSearch: () => ({ search: '', page: 1 }),
}))

vi.mock('@/ui/identity/hooks/use-invite-user-action', () => ({
  useInviteUserAction: () => ({
    error: null,
    inviteUser: vi.fn(),
    isPending: false,
  }),
}))

vi.mock('@/ui/identity/hooks/use-cancel-user-invitation-action', () => ({
  useCancelUserInvitationAction: () => cancelAction,
}))

vi.mock('@/ui/identity/hooks/use-change-user-profile-action', () => ({
  useChangeUserProfileAction: () => profileAction,
}))

vi.mock('@/ui/identity/hooks/use-change-user-status-action', () => ({
  useChangeUserStatusAction: () => statusAction,
}))

vi.mock('@/ui/identity/hooks/use-resend-user-invitation-action', () => ({
  useResendUserInvitationAction: () => resendAction,
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => accountState,
}))

vi.mock('@/ui/identity/hooks/use-users-query', () => ({
  useUsersQuery: () => ({
    isError: false,
    isLoading: false,
    pagination: undefined,
    summary: undefined,
    refetch: vi.fn(),
    users: [],
  }),
}))

import { useUsersPage } from '../use-users-page'

describe('useUsersPage', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    accountState.account = null
    useNavigateMock.mockReturnValue(navigateMock)
  })

  it('uses the public users path when changing profile filters', () => {
    useNavigateMock.mockReturnValue(navigateMock)
    const { result } = renderHook(() => useUsersPage())

    expect(useNavigateMock).toHaveBeenCalledWith({ from: '/users/' })

    act(() => result.current.setProfile(UserProfile.Manager))

    const [{ search }] = navigateMock.mock.calls[0]
    expect(search({ search: '', page: 1 })).toMatchObject({
      page: 1,
      profile: UserProfile.Manager,
    })
  })

  it('keeps self-protection in the page-owned action state', () => {
    accountState.account = { id: 'self-id' }
    const { result } = renderHook(() => useUsersPage())

    const items = result.current.getUserActionItems({
      id: 'self-id',
      name: 'Carlo Mendes',
      email: 'carlo@example.com',
      profile: UserProfile.Manager,
      status: UserStatus.Active,
      lastAccessAt: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    expect(items).toEqual([
      expect.objectContaining({ action: 'demote', disabled: true }),
      expect.objectContaining({ action: 'deactivate', disabled: true }),
    ])
  })

  it('orchestrates the selected status action from the page hook', async () => {
    const { result } = renderHook(() => useUsersPage())
    const user = {
      id: 'user-id',
      name: 'Marina Alves',
      email: 'marina@example.com',
      profile: UserProfile.Operator,
      status: UserStatus.Active,
      lastAccessAt: undefined,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    }

    act(() => result.current.handleOpenAction(user, 'deactivate'))
    expect(result.current.actionState?.action).toBe('deactivate')

    await act(async () => {
      await result.current.handleConfirmAction()
    })

    expect(statusAction.changeUserStatus).toHaveBeenCalledWith({
      userId: 'user-id',
      status: UserStatus.Inactive,
    })
    expect(result.current.actionState).toBeNull()
  })
})
