import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRouterState } from '@tanstack/react-router'

import {
  ROUTE_TRANSITION_DELAY,
  useRouteTransitionStatus,
} from '../use-route-transition-status'

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
}))

const useRouterStateMock = vi.mocked(useRouterState)

function setRouterStatus(status: 'idle' | 'pending') {
  useRouterStateMock.mockReturnValue(status as never)
}

function setReducedMotion(matches: boolean) {
  const addEventListener = vi.fn()
  const removeEventListener = vi.fn()
  vi.stubGlobal('matchMedia', () => ({
    matches,
    addEventListener,
    removeEventListener,
  }))
  return { addEventListener, removeEventListener }
}

describe('useRouteTransitionStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setRouterStatus('idle')
    setReducedMotion(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('suppresses fast navigation feedback', () => {
    const { result, rerender } = renderHook(() => useRouteTransitionStatus())

    setRouterStatus('pending')
    rerender()
    act(() => vi.advanceTimersByTime(ROUTE_TRANSITION_DELAY - 1))
    expect(result.current.isVisible).toBe(false)

    setRouterStatus('idle')
    rerender()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.isVisible).toBe(false)
  })

  it('shows and clears delayed feedback as the router changes state', () => {
    const { result, rerender } = renderHook(() => useRouteTransitionStatus())

    setRouterStatus('pending')
    rerender()
    act(() => vi.advanceTimersByTime(ROUTE_TRANSITION_DELAY))
    expect(result.current.isVisible).toBe(true)

    setRouterStatus('idle')
    rerender()
    expect(result.current.isVisible).toBe(false)
  })

  it('keeps reduced-motion feedback static and cleans up observers', () => {
    const mediaQuery = setReducedMotion(true)
    const { result, unmount } = renderHook(() => useRouteTransitionStatus())

    expect(result.current.isReducedMotion).toBe(true)
    unmount()
    expect(mediaQuery.removeEventListener).toHaveBeenCalledOnce()
  })

  it('cleans a pending timer when navigation is restarted or unmounted', () => {
    const { result, rerender, unmount } = renderHook(() => useRouteTransitionStatus())

    setRouterStatus('pending')
    rerender()
    act(() => vi.advanceTimersByTime(ROUTE_TRANSITION_DELAY - 1))

    setRouterStatus('idle')
    rerender()
    act(() => vi.advanceTimersByTime(1))
    expect(result.current.isVisible).toBe(false)

    setRouterStatus('pending')
    rerender()
    unmount()
    act(() => vi.advanceTimersByTime(ROUTE_TRANSITION_DELAY))
    expect(result.current.isVisible).toBe(false)
  })
})
