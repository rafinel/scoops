import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserProfile } from '@scoops/core/identity/domain/structures'
import { useOrderQuery } from '@/ui/pdv/hooks/use-order-query'
import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useOrderDetailsPage } from '../use-order-details-page'

vi.mock('@/ui/pdv/hooks/use-order-query', () => ({ useOrderQuery: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-navigation', () => ({ useNavigation: vi.fn() }))

const useOrderQueryMock = vi.mocked(useOrderQuery)
const useAuthContextMock = vi.mocked(useAuthContext)
const useNavigationMock = vi.mocked(useNavigation)

describe('useOrderDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useOrderQueryMock.mockReturnValue({
      isLoadingOrder: false,
      order: { id: 'order-1', status: 'registered' } as never,
      orderError: null,
      refetchOrder: vi.fn(),
    })
    useAuthContextMock.mockReturnValue({
      account: { profile: UserProfile.Manager },
    } as never)
    useNavigationMock.mockReturnValue({ navigateTo: vi.fn(), navigateToPath: vi.fn() })
  })

  it('exposes Manager cancellation only for a Registered order and owns dialog state', () => {
    const { result } = renderHook(() => useOrderDetailsPage('order-1'))
    expect(result.current.canCancel).toBe(true)
    act(() => result.current.handleOpenCancel())
    expect(result.current.isCancelOpen).toBe(true)
    act(() => result.current.handleCancelOpenChange(false))
    expect(result.current.isCancelOpen).toBe(false)
  })
})
