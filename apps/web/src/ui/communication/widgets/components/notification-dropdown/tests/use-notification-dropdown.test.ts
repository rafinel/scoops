import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

vi.mock('@/ui/communication/hooks/use-recent-notifications-query', () => ({
  useRecentNotificationsQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

import { useRecentNotificationsQuery } from '@/ui/communication/hooks/use-recent-notifications-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'

import { useNotificationDropdown } from '../use-notification-dropdown'

const useRecentNotificationsQueryMock = vi.mocked(useRecentNotificationsQuery)
const useNavigationMock = vi.mocked(useNavigation)

describe('useNotificationDropdown', () => {
  const navigateToMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateToPath: vi.fn(),
    })
    useRecentNotificationsQueryMock.mockReturnValue({
      isLoadingRecentNotifications: false,
      recentNotifications: [NotificationFaker.fake()],
      recentNotificationsError: null,
      refetchRecentNotifications: vi.fn(),
      unreadCount: 1,
    } as never)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toggles, closes on Escape and restores focus to the trigger', () => {
    const { result } = renderHook(() => useNotificationDropdown())
    const trigger = document.createElement('button')
    document.body.append(trigger)
    result.current.triggerRef.current = trigger

    act(() => result.current.handleToggle())
    expect(result.current.isOpen).toBe(true)

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    })
    expect(result.current.isOpen).toBe(false)
    act(() => vi.runAllTimers())
    expect(document.activeElement).toBe(trigger)
  })

  it('closes on outside interaction and navigates through the footer action', () => {
    const { result } = renderHook(() => useNotificationDropdown())
    const trigger = document.createElement('button')
    const outside = document.createElement('button')
    document.body.append(trigger)
    document.body.append(outside)
    result.current.triggerRef.current = trigger

    act(() => result.current.handleToggle())
    act(() => outside.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })))
    expect(result.current.isOpen).toBe(false)

    act(() => result.current.handleOpenAll())
    expect(navigateToMock).toHaveBeenCalledWith('notifications')
    act(() => vi.runAllTimers())
    expect(document.activeElement).toBe(trigger)
  })
})
