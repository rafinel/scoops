import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Account } from '@scoops/core/identity/domain/entities'
import { UserProfile } from '@scoops/core/identity/domain/structures'

import { getSidebarItems, SIDEBAR_SECONDARY_ITEMS } from '@/constants/sidebar-items'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import type { AuthContextValue } from '@/ui/shared/contexts/auth-context/types/auth-context-value'
import { showErrorToast } from '@/ui/shared/notifications'
import { useLogoutAction } from '@/ui/identity/hooks/use-logout-action'
import { useAppLayout } from '../use-app-layout'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

vi.mock('@/ui/identity/hooks/use-logout-action', () => ({
  useLogoutAction: vi.fn(),
}))

vi.mock('@/ui/shared/notifications', () => ({
  showErrorToast: vi.fn(),
}))

const useAuthContextMock = vi.mocked(useAuthContext)
const useLogoutActionMock = vi.mocked(useLogoutAction)
const showErrorToastMock = vi.mocked(showErrorToast)

const managerAccount: Account = {
  id: 'manager-id',
  establishmentId: 'establishment-id',
  establishmentName: 'Scoops',
  name: 'Manager',
  email: 'manager@example.com',
  profile: UserProfile.Manager,
}

const operatorAccount: Account = {
  ...managerAccount,
  id: 'operator-id',
  name: 'Operator',
  email: 'operator@example.com',
  profile: UserProfile.Operator,
}

const logoutMock = vi.fn<() => Promise<void>>()

function createAuthContextValue(account: Account | null): AuthContextValue {
  return {
    account,
    status: account ? 'authenticated' : 'anonymous',
    session: null,
    isPasswordRecovery: false,
    isOnboardingConfirmation: false,
    isInvitationAcceptance: false,
    getSession: async () => null,
    refreshAccount: async () => account,
    signIn: async () => undefined,
    signOut: async () => undefined,
    requestPasswordReset: async () => undefined,
    resetPassword: async () => undefined,
    retryLocalAccess: async () => undefined,
    activateOnboardingConfirmation: async () => false,
    completeOnboardingConfirmation: async () => undefined,
    clearInvitationAcceptance: async () => undefined,
    activateInvitationAcceptance: async () => false,
  }
}

describe('useAppLayout', () => {
  beforeEach(() => {
    useAuthContextMock.mockReturnValue(createAuthContextValue(managerAccount))
    useLogoutActionMock.mockReturnValue({
      error: null,
      isPending: false,
      logout: logoutMock,
    })
    logoutMock.mockReset().mockResolvedValue(undefined)
    showErrorToastMock.mockReset()
  })

  it('returns navigation for the authenticated profile and current logout state', () => {
    const { result } = renderHook(() => useAppLayout())

    expect(result.current.account).toBe(managerAccount)
    expect(result.current.error).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isMobileSidebarOpen).toBe(false)
    expect(result.current.primaryItems).toEqual(getSidebarItems(UserProfile.Manager))
    expect(result.current.secondaryItems).toEqual(
      getSidebarItems(UserProfile.Manager, SIDEBAR_SECONDARY_ITEMS),
    )
  })

  it('uses the Operator destinations and leaves profile navigation empty without an account', () => {
    useAuthContextMock.mockReturnValue(createAuthContextValue(operatorAccount))
    const operator = renderHook(() => useAppLayout())

    expect(operator.result.current.primaryItems).toEqual(
      getSidebarItems(UserProfile.Operator),
    )
    expect(operator.result.current.secondaryItems).toEqual(
      getSidebarItems(UserProfile.Operator, SIDEBAR_SECONDARY_ITEMS),
    )

    useAuthContextMock.mockReturnValue(createAuthContextValue(null))
    const unavailable = renderHook(() => useAppLayout())

    expect(unavailable.result.current.account).toBeNull()
    expect(unavailable.result.current.primaryItems).toEqual(getSidebarItems(null))
    expect(unavailable.result.current.secondaryItems).toEqual(
      getSidebarItems(null, SIDEBAR_SECONDARY_ITEMS),
    )
    expect(
      unavailable.result.current.primaryItems.some(
        (item) => item.route === 'salesChannels',
      ),
    ).toBe(false)
  })

  it('opens the mobile sidebar and closes it after navigation', () => {
    const { result } = renderHook(() => useAppLayout())

    act(() => result.current.handleMobileSidebarOpenChange(true))
    expect(result.current.isMobileSidebarOpen).toBe(true)

    act(() => result.current.handleMobileSidebarNavigate())
    expect(result.current.isMobileSidebarOpen).toBe(false)

    act(() => result.current.handleMobileSidebarOpenChange(true))
    act(() => result.current.handleMobileSidebarOpenChange(false))
    expect(result.current.isMobileSidebarOpen).toBe(false)
  })

  it('logs out and reports a recovered failure', async () => {
    const { result } = renderHook(() => useAppLayout())

    await act(async () => result.current.handleLogout())
    expect(logoutMock).toHaveBeenCalledOnce()
    expect(showErrorToastMock).not.toHaveBeenCalled()

    logoutMock.mockRejectedValueOnce(new Error('Sessão indisponível'))
    await act(async () => result.current.handleLogout())

    expect(logoutMock).toHaveBeenCalledTimes(2)
    expect(showErrorToastMock).toHaveBeenCalledWith('Sessão indisponível')
  })
})
