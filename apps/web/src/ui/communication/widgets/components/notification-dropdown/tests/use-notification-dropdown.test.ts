import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

vi.mock('@/ui/communication/hooks/use-recent-notifications-query', () => ({
  useRecentNotificationsQuery: vi.fn(),
}))

vi.mock('@/ui/shared/hooks/use-navigation', () => ({
  useNavigation: vi.fn(),
}))

vi.mock('@/ui/communication/hooks/use-notification-shell-context', () => ({
  useOptionalNotificationShellContext: vi.fn(),
}))

import { useRecentNotificationsQuery } from '@/ui/communication/hooks/use-recent-notifications-query'
import { useNavigation } from '@/ui/shared/hooks/use-navigation'
import { useOptionalNotificationShellContext } from '@/ui/communication/hooks/use-notification-shell-context'

import { useNotificationDropdown } from '../use-notification-dropdown'

const useRecentNotificationsQueryMock = vi.mocked(useRecentNotificationsQuery)
const useNavigationMock = vi.mocked(useNavigation)
const useOptionalNotificationShellContextMock = vi.mocked(
  useOptionalNotificationShellContext,
)

describe('useNotificationDropdown', () => {
  const navigateToMock = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useNavigationMock.mockReturnValue({
      navigateTo: navigateToMock,
      navigateToPath: vi.fn(),
    })
    useOptionalNotificationShellContextMock.mockReturnValue(null)
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

  it('clears a selected notification pin after the refreshed row is read', () => {
    const selected = NotificationFaker.fake({
      id: 'selected-notification',
      readAt: new Date('2026-01-01T00:05:00.000Z'),
    })
    const clearSelectedNotification = vi.fn()
    useOptionalNotificationShellContextMock.mockReturnValue({
      clearSelectedNotification,
      closeNotifications: vi.fn(),
      dismissNotification: vi.fn(),
      isNotificationsOpen: false,
      openNotification: vi.fn(),
      openNotifications: vi.fn(),
      selectedNotification: NotificationFaker.fake({
        id: 'selected-notification',
        readAt: undefined,
      }),
    })
    useRecentNotificationsQueryMock.mockReturnValue({
      isLoadingRecentNotifications: false,
      recentNotifications: [selected],
      recentNotificationsError: null,
      refetchRecentNotifications: vi.fn(),
      unreadCount: 0,
    } as never)

    renderHook(() => useNotificationDropdown())

    expect(clearSelectedNotification).toHaveBeenCalledOnce()
  })
})
