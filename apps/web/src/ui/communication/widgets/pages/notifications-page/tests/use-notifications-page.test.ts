import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn(),
  useRouter: vi.fn(),
  useSearch: vi.fn(),
}))

vi.mock('@/ui/communication/hooks/use-notifications-query', () => ({
  useNotificationsQuery: vi.fn(),
}))

import { useNavigate, useRouter, useSearch } from '@tanstack/react-router'
import { useNotificationsQuery } from '@/ui/communication/hooks/use-notifications-query'
import { ROUTES } from '@/constants/routes'

import { useNotificationsPage } from '../use-notifications-page'

const useNavigateMock = vi.mocked(useNavigate)
const useRouterMock = vi.mocked(useRouter)
const useSearchMock = vi.mocked(useSearch)
const useNotificationsQueryMock = vi.mocked(useNotificationsQuery)

describe('useNotificationsPage', () => {
  const navigateMock = vi.fn()
  const backMock = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    useNavigateMock.mockReturnValue(navigateMock as never)
    useRouterMock.mockReturnValue({
      history: { back: backMock, canGoBack: () => true },
    } as never)
    useSearchMock.mockReturnValue({ period: 'last-30-days' } as never)
    useNotificationsQueryMock.mockReturnValue({
      data: undefined,
      error: null,
      fetchNextNotifications: vi.fn(),
      hasLoadedNotifications: false,
      hasNextPage: false,
      isError: false,
      isFetchingNextPage: false,
      isLoading: true,
      isLoadingNextNotifications: false,
      isLoadingNotifications: true,
      nextCursor: undefined,
      notifications: [],
      notificationsError: null,
      refetchNotifications: vi.fn(),
      isRefreshingNotifications: false,
      unreadCount: 0,
    } as never)
  })

  it('converts the default period into inclusive browser-local bounds after mount', async () => {
    const { result } = renderHook(() => useNotificationsPage())

    await waitFor(() => expect(result.current.bounds.occurredFrom).toBeInstanceOf(Date))
    expect(result.current.bounds.occurredTo).toBeInstanceOf(Date)
    expect(result.current.bounds.occurredFrom?.getHours()).toBe(0)
    expect(result.current.bounds.occurredTo?.getHours()).toBe(23)
    expect(useNotificationsQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, limit: 20 }),
    )
    expect(useNotificationsQueryMock).toHaveBeenCalledWith({ enabled: true, limit: 1 })
    expect(result.current.isRefreshingNotifications).toBe(false)
  })

  it('changes the URL period and resets to the documented default', () => {
    const { result } = renderHook(() => useNotificationsPage())

    act(() => result.current.handlePeriodChange('all'))
    expect(navigateMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: expect.any(Function) }),
    )
    act(() => result.current.handleResetPeriod())
    expect(navigateMock).toHaveBeenCalledTimes(2)
  })

  it('returns to the previous page when browser history is available', () => {
    const { result } = renderHook(() => useNotificationsPage())
    const preventDefault = vi.fn()

    act(() => result.current.handleBack({ preventDefault } as never))

    expect(preventDefault).toHaveBeenCalledOnce()
    expect(backMock).toHaveBeenCalledOnce()
  })

  it('falls back to the authenticated home route without browser history', () => {
    useRouterMock.mockReturnValue({
      history: { back: backMock, canGoBack: () => false },
    } as never)
    const { result } = renderHook(() => useNotificationsPage())

    act(() => result.current.handleBack({ preventDefault: vi.fn() } as never))

    expect(navigateMock).toHaveBeenCalledWith({ to: ROUTES.app })
    expect(backMock).not.toHaveBeenCalled()
  })
})
