import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useRouter } from '@tanstack/react-router'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'

import { useAuthRouteUnavailableState } from '../use-auth-route-unavailable-state'

const { invalidateMock, retryLocalAccessMock } = vi.hoisted(() => ({
  invalidateMock: vi.fn(),
  retryLocalAccessMock: vi.fn(),
}))

vi.mock('@tanstack/react-router', () => ({ useRouter: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-auth-context', () => ({
  useAuthContext: vi.fn(),
}))

const useRouterMock = vi.mocked(useRouter)
const useAuthContextMock = vi.mocked(useAuthContext)

describe('useAuthRouteUnavailableState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRouterMock.mockReturnValue({ invalidate: invalidateMock } as never)
    useAuthContextMock.mockReturnValue({
      retryLocalAccess: retryLocalAccessMock,
    } as never)
  })

  afterEach(() => {
    cleanup()
  })

  it('invalidates the route after local access retry succeeds', async () => {
    retryLocalAccessMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuthRouteUnavailableState())

    act(() => result.current.handleRetry())

    await waitFor(() => expect(invalidateMock).toHaveBeenCalledOnce())
    expect(retryLocalAccessMock).toHaveBeenCalledOnce()
  })

  it('invalidates the route after local access retry rejects without an unhandled rejection', async () => {
    retryLocalAccessMock.mockRejectedValue(new Error('local access unavailable'))
    const { result } = renderHook(() => useAuthRouteUnavailableState())

    act(() => result.current.handleRetry())

    await waitFor(() => expect(invalidateMock).toHaveBeenCalledOnce())
    expect(retryLocalAccessMock).toHaveBeenCalledOnce()
  })
})
