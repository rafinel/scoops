import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNotificationToast } from '../use-notification-toast'

describe('useNotificationToast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('dismisses after five active seconds and pauses during hover', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useNotificationToast(onDismiss))

    act(() => vi.advanceTimersByTime(3_000))
    act(() => result.current.handleMouseEnter())
    act(() => vi.advanceTimersByTime(10_000))
    expect(onDismiss).not.toHaveBeenCalled()

    act(() => result.current.handleMouseLeave())
    act(() => vi.advanceTimersByTime(2_000))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('dismisses once on Escape without stealing focus', () => {
    const onDismiss = vi.fn()
    const { result } = renderHook(() => useNotificationToast(onDismiss))
    const preventDefaultMock = vi.fn()
    const stopPropagationMock = vi.fn()

    act(() =>
      result.current.handleKeyDown({
        key: 'Escape',
        preventDefault: preventDefaultMock,
        stopPropagation: stopPropagationMock,
      } as never),
    )
    act(() => result.current.handleDismiss())

    expect(onDismiss).toHaveBeenCalledOnce()
    expect(preventDefaultMock).toHaveBeenCalledOnce()
    expect(stopPropagationMock).toHaveBeenCalledOnce()
  })
})
