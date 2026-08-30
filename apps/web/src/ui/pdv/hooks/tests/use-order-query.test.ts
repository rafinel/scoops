import { createElement, type ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useOrderQuery } from '../use-order-query'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)

describe('useOrderQuery', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('maps the requested order from the domain service', async () => {
    const order = { id: 'order-1', sequenceNumber: 124 }
    const getOrderMock = vi.fn().mockResolvedValue(new RestResponse({ body: order }))
    useAuthContextMock.mockReturnValue({
      account: { establishmentId: 'establishment-1' },
    } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { getOrder: getOrderMock },
    } as never)

    const { result } = renderHook(() => useOrderQuery('order-1'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.order).toEqual(order))
    expect(getOrderMock).toHaveBeenCalledWith('order-1')
    expect(result.current.orderError).toBeNull()
    expect(result.current.isLoadingOrder).toBe(false)
  })

  it('keeps the query disabled when establishment or order identity is missing', () => {
    const getOrderMock = vi.fn()
    useRestContextMock.mockReturnValue({
      pdvService: { getOrder: getOrderMock },
    } as never)

    const { result, rerender } = renderHook(
      ({ account, orderId }: { account: unknown; orderId: string }) => {
        useAuthContextMock.mockReturnValue({ account } as never)
        return useOrderQuery(orderId)
      },
      {
        initialProps: { account: null as unknown, orderId: 'order-1' },
        wrapper: createQueryWrapper(),
      },
    )

    expect(result.current.isLoadingOrder).toBe(true)
    expect(getOrderMock).not.toHaveBeenCalled()

    rerender({ account: { establishmentId: 'establishment-1' }, orderId: '' })
    expect(getOrderMock).not.toHaveBeenCalled()
  })

  it('exposes a missing-order service failure through the query error state', async () => {
    const getOrderMock = vi
      .fn()
      .mockResolvedValue(new RestResponse({ statusCode: 404, errorMessage: 'Not found' }))
    useAuthContextMock.mockReturnValue({
      account: { establishmentId: 'establishment-1' },
    } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { getOrder: getOrderMock },
    } as never)

    const { result } = renderHook(() => useOrderQuery('missing-order'), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.orderError).toBeInstanceOf(Error))
    expect(result.current.order).toBeUndefined()
  })
})

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}
