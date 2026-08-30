import { createElement, type ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { orderQueryKeys } from '../order-query-keys'
import { useCancelOrderAction } from '../use-cancel-order-action'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)

describe('useCancelOrderAction', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('maps a successful cancellation and invalidates list and detail caches', async () => {
    const canceledOrder = { id: 'order-1', status: 'canceled' }
    const cancelOrderMock = vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: canceledOrder }))
    const queryClient = new QueryClient()
    const invalidateQueriesMock = vi.spyOn(queryClient, 'invalidateQueries')
    useAuthContextMock.mockReturnValue({
      account: { establishmentId: 'establishment-1' },
    } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { cancelOrder: cancelOrderMock },
    } as never)

    const { result } = renderHook(() => useCancelOrderAction(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await expect(
        result.current.cancelOrder({ orderId: 'order-1', reason: 'pedido duplicado' }),
      ).resolves.toEqual(canceledOrder)
    })

    expect(cancelOrderMock).toHaveBeenCalledWith('order-1', {
      reason: 'pedido duplicado',
    })
    expect(invalidateQueriesMock).toHaveBeenNthCalledWith(1, {
      queryKey: orderQueryKeys.all,
    })
    expect(invalidateQueriesMock).toHaveBeenNthCalledWith(2, {
      queryKey: orderQueryKeys.detail('establishment-1', 'order-1'),
    })
    expect(result.current.cancelOrderError).toBeNull()
  })

  it('passes an omitted reason through to the service and exposes failures', async () => {
    const cancelOrderMock = vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ statusCode: 503, errorMessage: 'Unavailable' }),
      )
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    })
    useAuthContextMock.mockReturnValue({ account: null } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { cancelOrder: cancelOrderMock },
    } as never)

    const { result } = renderHook(() => useCancelOrderAction(), {
      wrapper: createQueryWrapper(queryClient),
    })

    await act(async () => {
      await expect(
        result.current.cancelOrder({ orderId: 'order-1' }),
      ).rejects.toBeInstanceOf(Error)
    })

    expect(cancelOrderMock).toHaveBeenCalledWith('order-1', { reason: undefined })
    await waitFor(() => expect(result.current.cancelOrderError).toBeInstanceOf(Error))
    expect(result.current.isCancelingOrder).toBe(false)
  })

  it('exposes the pending state while cancellation is in flight', async () => {
    let resolveCancellation!: (response: RestResponse<{ id: string }>) => void
    const cancelOrderMock = vi.fn().mockImplementation(
      () =>
        new Promise<RestResponse<{ id: string }>>((resolve) => {
          resolveCancellation = resolve
        }),
    )
    const queryClient = new QueryClient()
    useAuthContextMock.mockReturnValue({ account: null } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { cancelOrder: cancelOrderMock },
    } as never)

    const { result } = renderHook(() => useCancelOrderAction(), {
      wrapper: createQueryWrapper(queryClient),
    })

    let cancellationPromise: Promise<unknown>
    act(() => {
      cancellationPromise = result.current.cancelOrder({ orderId: 'order-1' })
    })
    await waitFor(() => expect(result.current.isCancelingOrder).toBe(true))

    resolveCancellation(
      new RestResponse({ statusCode: 503, errorMessage: 'Unavailable' }),
    )
    await act(async () => {
      await expect(cancellationPromise).rejects.toBeInstanceOf(Error)
    })
    await waitFor(() => expect(result.current.cancelOrderError).toBeInstanceOf(Error))
    expect(result.current.isCancelingOrder).toBe(false)
  })
})

function createQueryWrapper(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}
