import { describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { PdvService } from '../pdv-service'

describe('PdvService', () => {
  it('serializes order list filters and maps order and cancellation dates', async () => {
    const restClient = { get: vi.fn() }
    restClient.get.mockResolvedValue(
      new RestResponse({
        body: {
          items: [createOrderJson()],
          page: 2,
          pageSize: 6,
          total: 1,
          totalPages: 1,
        },
      }),
    )
    const service = PdvService(restClient as never)

    const response = await service.listOrders({
      channelId: null,
      createdFrom: new Date('2026-08-01T00:00:00.000Z'),
      createdTo: new Date('2026-08-28T23:59:59.999Z'),
      page: 2,
      pageSize: 6,
      search: '124',
      status: 'registered',
    })

    expect(restClient.get).toHaveBeenCalledWith(
      '/orders?page=2&pageSize=6&search=124&createdFrom=2026-08-01T00%3A00%3A00.000Z&createdTo=2026-08-28T23%3A59%3A59.999Z&channelId=none&status=registered',
    )
    expect(response.body.items[0]?.createdAt).toBeInstanceOf(Date)
    expect(response.body.items[0]?.cancellation?.canceledAt).toBeInstanceOf(Date)
  })

  it('maps order details and sends cancellation reasons while preserving failures', async () => {
    const restClient = {
      get: vi.fn().mockResolvedValueOnce(new RestResponse({ body: createOrderJson() })),
      patch: vi
        .fn()
        .mockResolvedValueOnce(new RestResponse({ body: createOrderJson() }))
        .mockResolvedValueOnce(new RestResponse({ statusCode: 409 })),
    }
    const service = PdvService(restClient as never)

    const detailsResponse = await service.getOrder('order-1')
    const cancellationResponse = await service.cancelOrder('order-1', {
      reason: 'pedido duplicado',
    })
    const failedResponse = await service.cancelOrder('order-1', { reason: undefined })

    expect(restClient.get).toHaveBeenCalledWith('/orders/order-1')
    expect(restClient.patch).toHaveBeenNthCalledWith(1, '/orders/order-1/cancel', {
      reason: 'pedido duplicado',
    })
    expect(detailsResponse.body.createdAt).toBeInstanceOf(Date)
    expect(cancellationResponse.body.cancellation?.canceledAt).toBeInstanceOf(Date)
    expect(failedResponse.statusCode).toBe(409)
  })

  it('omits optional list parameters when they are absent', async () => {
    const restClient = {
      get: vi.fn().mockResolvedValue(
        new RestResponse({
          body: { items: [], page: 1, pageSize: 6, total: 0, totalPages: 0 },
        }),
      ),
    }
    const service = PdvService(restClient as never)

    await service.listOrders({ page: 1, pageSize: 6 })

    expect(restClient.get).toHaveBeenCalledWith('/orders?page=1&pageSize=6')
  })
})

function createOrderJson() {
  return {
    id: 'order-1',
    establishmentId: 'establishment-1',
    idempotencyKey: 'key-1',
    sequenceNumber: 124,
    createdBy: 'user-1',
    createdByName: 'Carlo — Gerente',
    status: 'registered' as const,
    lines: [],
    discounts: [],
    subtotal: 42.56,
    totalDiscount: 0,
    total: 42.56,
    createdAt: '2026-08-28T15:42:00.000Z',
    cancellation: {
      canceledAt: '2026-08-28T16:42:00.000Z',
      canceledBy: 'user-1',
      canceledByName: 'Carlo — Gerente',
      reason: 'pedido duplicado',
      restorations: [],
    },
  }
}
