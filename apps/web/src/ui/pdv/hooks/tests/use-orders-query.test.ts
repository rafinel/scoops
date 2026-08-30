import { createElement, type ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OrderStatus } from '@scoops/core/pdv/domain/structures'
import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { useAuthContext } from '@/ui/shared/hooks/use-auth-context'
import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

import { useOrdersQuery } from '../use-orders-query'

vi.mock('@/ui/shared/hooks/use-auth-context', () => ({ useAuthContext: vi.fn() }))
vi.mock('@/ui/shared/hooks/use-rest-context', () => ({ useRestContext: vi.fn() }))

const useAuthContextMock = vi.mocked(useAuthContext)
const useRestContextMock = vi.mocked(useRestContext)

describe('useOrdersQuery', () => {
  const input = {
    channelId: null,
    createdFrom: new Date('2026-08-01T00:00:00.000Z'),
    createdTo: new Date('2026-08-28T23:59:59.999Z'),
    isPeriodReady: true,
    page: 2,
    pageSize: 6,
    search: '124',
    status: OrderStatus.Registered,
  }

  beforeEach(() => vi.clearAllMocks())
  afterEach(cleanup)

  it('maps a successful service response to the orders page', async () => {
    const ordersPage = { items: [], page: 2, pageSize: 6, total: 0, totalPages: 0 }
    const listOrdersMock = vi
      .fn()
      .mockResolvedValue(new RestResponse({ body: ordersPage }))
    useAuthContextMock.mockReturnValue({
      account: { establishmentId: 'establishment-1' },
    } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { listOrders: listOrdersMock },
    } as never)

    const { result } = renderHook(() => useOrdersQuery(input), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.ordersPage).toEqual(ordersPage))

    expect(listOrdersMock).toHaveBeenCalledWith({
      channelId: null,
      createdFrom: input.createdFrom,
      createdTo: input.createdTo,
      page: 2,
      pageSize: 6,
      search: '124',
      status: OrderStatus.Registered,
    })
    expect(result.current.ordersError).toBeNull()
    expect(result.current.isLoadingOrders).toBe(false)
  })

  it('keeps the query disabled until both account and period are ready', () => {
    const listOrdersMock = vi.fn()
    useRestContextMock.mockReturnValue({
      pdvService: { listOrders: listOrdersMock },
    } as never)

    const { result, rerender } = renderHook(
      ({ account, isPeriodReady }: { account: unknown; isPeriodReady: boolean }) => {
        useAuthContextMock.mockReturnValue({ account } as never)
        return useOrdersQuery({ ...input, isPeriodReady })
      },
      {
        initialProps: { account: null as unknown, isPeriodReady: true },
        wrapper: createQueryWrapper(),
      },
    )

    expect(result.current.isLoadingOrders).toBe(true)
    expect(listOrdersMock).not.toHaveBeenCalled()

    rerender({ account: { establishmentId: 'establishment-1' }, isPeriodReady: false })
    expect(listOrdersMock).not.toHaveBeenCalled()
  })

  it('exposes a service failure when the response throws its domain error', async () => {
    const listOrdersMock = vi
      .fn()
      .mockResolvedValue(
        new RestResponse({ statusCode: 503, errorMessage: 'Unavailable' }),
      )
    useAuthContextMock.mockReturnValue({
      account: { establishmentId: 'establishment-1' },
    } as never)
    useRestContextMock.mockReturnValue({
      pdvService: { listOrders: listOrdersMock },
    } as never)

    const { result } = renderHook(() => useOrdersQuery(input), {
      wrapper: createQueryWrapper(),
    })

    await waitFor(() => expect(result.current.ordersError).toBeInstanceOf(Error))
    expect(result.current.ordersPage).toBeUndefined()
  })
})

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
}
