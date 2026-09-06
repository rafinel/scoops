import { createElement } from 'react'
import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { NotificationFaker } from '@scoops/core/communication/domain/entities/fakers'

vi.mock('@/ui/communication/hooks/use-mark-notifications-read-action', () => ({
  useMarkNotificationsReadAction: vi.fn(),
}))

import { useMarkNotificationsReadAction } from '@/ui/communication/hooks/use-mark-notifications-read-action'

import { useNotificationList } from '../use-notification-list'

const useMarkNotificationsReadActionMock = vi.mocked(useMarkNotificationsReadAction)

type ObserverCallback = (entries: IntersectionObserverEntry[]) => void

class TestIntersectionObserver {
  static callback: ObserverCallback
  static observed: Element | null = null

  constructor(callback: ObserverCallback) {
    TestIntersectionObserver.callback = callback
  }

  observe(target: Element) {
    TestIntersectionObserver.observed = target
  }

  disconnect() {}
}

describe('useNotificationList', () => {
  const markNotificationsReadMock = vi.fn(() => Promise.resolve())

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    TestIntersectionObserver.observed = null
    useMarkNotificationsReadActionMock.mockReturnValue({
      error: null,
      isPending: false,
      markNotificationsRead: markNotificationsReadMock,
    })
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('requires the 50 percent threshold and batches each visible unread row once', async () => {
    const notification = NotificationFaker.fake({ id: 'notification-visible' })
    const Harness = () => {
      const { listRef } = useNotificationList({
        isObservationEnabled: true,
        notifications: [notification],
      })
      return createElement(
        'div',
        { ref: listRef },
        createElement('div', { 'data-notification-id': notification.id }),
      )
    }
    render(createElement(Harness))
    const target = TestIntersectionObserver.observed
    expect(target).not.toBeNull()

    act(() => {
      TestIntersectionObserver.callback([
        {
          isIntersecting: true,
          intersectionRatio: 0.49,
          target,
        } as IntersectionObserverEntry,
      ])
      vi.runAllTimers()
    })
    expect(markNotificationsReadMock).not.toHaveBeenCalled()

    await act(async () => {
      TestIntersectionObserver.callback([
        {
          isIntersecting: true,
          intersectionRatio: 0.5,
          target,
        } as IntersectionObserverEntry,
      ])
      vi.runAllTimers()
      await Promise.resolve()
    })
    expect(markNotificationsReadMock).toHaveBeenCalledWith([notification.id])

    await act(async () => {
      TestIntersectionObserver.callback([
        {
          isIntersecting: true,
          intersectionRatio: 1,
          target,
        } as IntersectionObserverEntry,
      ])
      vi.runAllTimers()
      await Promise.resolve()
    })
    expect(markNotificationsReadMock).toHaveBeenCalledTimes(1)
  })

  it('does not observe rows while the surface is closed', () => {
    const notification = NotificationFaker.fake({ id: 'notification-closed' })
    const Harness = () => {
      const { listRef } = useNotificationList({
        isObservationEnabled: false,
        notifications: [notification],
      })
      return createElement(
        'div',
        { ref: listRef },
        createElement('div', { 'data-notification-id': notification.id }),
      )
    }
    render(createElement(Harness))
    expect(TestIntersectionObserver.observed).toBeNull()
  })
})
