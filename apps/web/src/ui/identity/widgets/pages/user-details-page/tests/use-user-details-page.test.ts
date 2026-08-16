import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook } from '@testing-library/react'

import {
  UserAuditAction,
  UserAuditActorType,
  UserProfile,
  UserStatus,
} from '@scoops/core/identity/domain/structures'
import type { UserDetails } from '@scoops/core/identity/domain/structures'

const { accountState, navigateMock, queryState } = vi.hoisted(() => ({
  accountState: { account: null },
  navigateMock: vi.fn(),
  queryState: {
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
    userDetails: undefined as UserDetails | undefined,
  },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('@/ui/identity/hooks/use-user-details-query', () => ({
  useUserDetailsQuery: () => queryState,
}))

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: () => accountState,
}))

vi.mock('@/ui/identity/hooks/use-cancel-user-invitation-action', () => ({
  useCancelUserInvitationAction: () => actionState('cancelUserInvitation'),
}))

vi.mock('@/ui/identity/hooks/use-change-user-profile-action', () => ({
  useChangeUserProfileAction: () => actionState('changeUserProfile'),
}))

vi.mock('@/ui/identity/hooks/use-change-user-status-action', () => ({
  useChangeUserStatusAction: () => actionState('changeUserStatus'),
}))

vi.mock('@/ui/identity/hooks/use-correct-user-invitation-action', () => ({
  useCorrectUserInvitationAction: () => actionState('correctUserInvitation'),
}))

vi.mock('@/ui/identity/hooks/use-correct-user-name-action', () => ({
  useCorrectUserNameAction: () => actionState('correctUserName'),
}))

vi.mock('@/ui/identity/hooks/use-resend-user-invitation-action', () => ({
  useResendUserInvitationAction: () => actionState('resendUserInvitation'),
}))

import { useUserDetailsPage } from '../use-user-details-page'

describe('useUserDetailsPage', () => {
  afterEach(() => {
    cleanup()
    queryState.userDetails = undefined
    vi.clearAllMocks()
  })

  it('paginates audit records and clamps navigation to available pages', () => {
    queryState.userDetails = {
      user: {
        id: 'user-id',
        establishmentId: 'establishment-id',
        name: 'Marina Alves',
        email: 'marina@example.com',
        profile: UserProfile.Manager,
        status: UserStatus.Active,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      auditRecords: Array.from({ length: 7 }, (_, index) => ({
        id: `audit-${index}`,
        establishmentId: 'establishment-id',
        affectedUserId: 'user-id',
        affectedUserName: 'Marina Alves',
        actorType: UserAuditActorType.User,
        actorName: 'Carlo Mendes',
        action: UserAuditAction.UserRegistered,
        occurredAt: new Date(`2026-01-0${index + 1}T00:00:00.000Z`),
      })),
    }

    const { result } = renderHook(() => useUserDetailsPage({ userId: 'user-id' }))

    expect(result.current.historyPageSize).toBe(5)
    expect(result.current.historyPage).toBe(1)
    expect(result.current.historyRecords).toHaveLength(5)
    expect(result.current.historyTotal).toBe(7)
    expect(result.current.historyTotalPages).toBe(2)

    act(() => result.current.setHistoryPage(2))

    expect(result.current.historyPage).toBe(2)
    expect(result.current.historyRecords).toHaveLength(2)
    expect(result.current.historyRecords[0]?.id).toBe('audit-1')

    act(() => result.current.setHistoryPage(99))
    expect(result.current.historyPage).toBe(2)

    act(() => result.current.setHistoryPage(0))
    expect(result.current.historyPage).toBe(1)
  })
})

function actionState(operation: string) {
  return {
    error: null,
    isPending: false,
    [operation]: vi.fn(),
  }
}
