import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement, type PropsWithChildren } from 'react'

import { AccountFaker } from '@scoops/core/identity/domain/entities/fakers'
import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { showNotificationToast } from '@/ui/shared/notifications'

import { useNotificationShellProvider } from '../use-notification-shell-provider'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/notifications', () => ({ showNotificationToast: vi.fn() }))
vi.mock('sonner', () => ({ toast: { dismiss: vi.fn() } }))

class FakeBroadcastChannel {
  static instances: FakeBroadcastChannel[] = []
  readonly name: string
  readonly postMessage = vi.fn()
  readonly listeners = new Set<(event: MessageEvent) => void>()
  readonly close = vi.fn()

  constructor(name: string) {
    this.name = name
    FakeBroadcastChannel.instances.push(this)
  }

  addEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners.add(listener)
  }

  removeEventListener(_type: string, listener: (event: MessageEvent) => void) {
    this.listeners.delete(listener)
  }

  emit(data: unknown) {
    for (const listener of this.listeners) listener({ data } as MessageEvent)
  }
}

const useAuthContextMock = vi.mocked(useAuthContext)
const showNotificationToastMock = vi.mocked(showNotificationToast)

describe('useNotificationShellProvider', () => {
  let account: ReturnType<typeof AccountFaker.fake>

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
    FakeBroadcastChannel.instances = []
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    setBrowserAvailability('visible', true)
    account = AccountFaker.fake()
    useAuthContextMock.mockReturnValue({
      account,
      status: 'authenticated',
    } as never)
    showNotificationToastMock.mockReturnValue('toast-1')
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.unstubAllGlobals()
  })

  function setBrowserAvailability(
    visibilityState: 'hidden' | 'visible',
    onLine: boolean,
  ) {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: visibilityState,
    })
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      value: onLine,
    })
  }

  function createWrapper() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client: queryClient }, children)
  }

  it('accepts only the authenticated account scope and deduplicates notifications', async () => {
    const { result } = renderHook(() => useNotificationShellProvider(), {
      wrapper: createWrapper(),
    })
    const notification = NotificationFaker.fake({
      recipientUserId: account.id,
      establishmentId: account.establishmentId,
    })
    const foreign = NotificationFaker.fake()

    await act(async () => {
      await result.current.onNotification(foreign)
      await result.current.onNotification(notification)
      await result.current.onNotification(notification)
    })

    expect(showNotificationToastMock).toHaveBeenCalledOnce()
    expect(result.current.visibleNotifications).toHaveLength(1)
  })

  it('keeps three notifications visible and queues later arrivals in order', async () => {
    const { result } = renderHook(() => useNotificationShellProvider(), {
      wrapper: createWrapper(),
    })
    const notifications = Array.from({ length: 4 }, (_, index) =>
      NotificationFaker.fake({
        id: `notification-${index}`,
        recipientUserId: account.id,
        establishmentId: account.establishmentId,
      }),
    )

    for (const notification of notifications) {
      await act(async () => result.current.onNotification(notification))
    }

    expect(result.current.visibleNotifications.map(({ id }) => id)).toEqual([
      'notification-2',
      'notification-1',
      'notification-0',
    ])
    expect(result.current.queuedNotifications.map(({ id }) => id)).toEqual([
      'notification-3',
    ])
  })

  it('stops leadership while hidden or offline and resumes without replay', async () => {
    const { result } = renderHook(() => useNotificationShellProvider(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLeader).toBe(true))

    act(() => {
      setBrowserAvailability('hidden', true)
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current.isLeader).toBe(false)

    act(() => {
      setBrowserAvailability('visible', false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.isLeader).toBe(false)

    await act(async () => {
      setBrowserAvailability('visible', true)
      window.dispatchEvent(new Event('online'))
    })
    await waitFor(() => expect(result.current.isLeader).toBe(true))
    expect(showNotificationToastMock).not.toHaveBeenCalled()
  })

  it('does not fall back to a lease when a Web Lock is held elsewhere', () => {
    const requestMock = vi.fn(
      async (
        _name: string,
        _options: { ifAvailable: boolean },
        callback: (lock: null) => unknown,
      ) => callback(null),
    )
    vi.stubGlobal('navigator', { ...navigator, locks: { request: requestMock } })

    const { result, unmount } = renderHook(() => useNotificationShellProvider(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLeader).toBe(false)
    expect(localStorage.length).toBe(0)
    unmount()
  })

  it('ignores malformed or foreign invalidation messages', async () => {
    const queryClient = new QueryClient()
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }: PropsWithChildren) =>
      createElement(QueryClientProvider, { client: queryClient }, children)
    renderHook(() => useNotificationShellProvider(), { wrapper })

    const channel = FakeBroadcastChannel.instances.at(-1)
    expect(channel?.name).toContain(
      encodeURIComponent(`authenticated:${account.id}:${account.establishmentId}`),
    )
    channel?.emit({ type: 'notifications.invalidate', version: 1 })
    channel?.emit({
      type: 'notifications.invalidate',
      version: 1,
      authScope: 'authenticated:foreign:foreign',
    })
    channel?.emit({
      type: 'notifications.invalidate',
      version: 1,
      authScope: `authenticated:${account.id}:${account.establishmentId}`,
    })

    await act(async () => undefined)
    expect(invalidateQueriesSpy).toHaveBeenCalledOnce()
  })

  it('clears toasts, queue and selection when the auth identity changes', async () => {
    let currentAccount = account
    useAuthContextMock.mockImplementation(
      () => ({ account: currentAccount, status: 'authenticated' }) as never,
    )
    const { result, rerender } = renderHook(() => useNotificationShellProvider(), {
      wrapper: createWrapper(),
    })
    const notification = NotificationFaker.fake({
      recipientUserId: account.id,
      establishmentId: account.establishmentId,
    })

    await act(async () => {
      await result.current.onNotification(notification)
      result.current.openNotification(notification)
    })
    expect(result.current.visibleNotifications).toHaveLength(1)
    expect(result.current.selectedNotification).toEqual(notification)

    currentAccount = AccountFaker.fake({
      id: 'new-account-id',
      establishmentId: 'new-establishment-id',
    })
    rerender()
    await act(async () => undefined)

    expect(result.current.visibleNotifications).toEqual([])
    expect(result.current.queuedNotifications).toEqual([])
    expect(result.current.selectedNotification).toBeNull()
    expect(result.current.isNotificationsOpen).toBe(false)
  })
})
