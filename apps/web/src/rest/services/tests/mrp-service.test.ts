import { describe, expect, it, vi } from 'vitest'

import { RestResponse } from '@scoops/core/shared/responses/rest-response'

import { MrpService } from '../mrp-service'

describe('MrpService', () => {
  it('serializes list filters with repeated categories and maps catalog dates', async () => {
    const restClient = { get: vi.fn() }
    restClient.get.mockResolvedValue(
      new RestResponse({
        body: {
          items: [createCatalogRowJson()],
          page: 1,
          pageSize: 10,
          totalItems: 1,
          totalPages: 1,
          kpis: { products: 1, brands: 2, lowStock: 1 },
        },
      }),
    )
    const service = MrpService(restClient as never)

    const response = await service.listProducts({
      search: 'milk',
      categories: ['ingredient', 'resale'],
      status: 'active',
      stockSituation: 'low',
      sortBy: 'name',
      sortDirection: 'asc',
      page: 1,
      pageSize: 10,
    })

    expect(restClient.get).toHaveBeenCalledWith(
      '/products?search=milk&category=ingredient&category=resale&status=active&stockSituation=low&sortBy=name&sortDirection=asc&page=1&pageSize=10',
    )
    expect(response.body.items[0]?.product.createdAt).toBeInstanceOf(Date)
    expect(response.body.kpis).toEqual({ products: 1, brands: 2, lowStock: 1 })
  })

  it('sends only registration fields and preserves failed responses', async () => {
    const restClient = {
      post: vi
        .fn()
        .mockResolvedValueOnce(new RestResponse({ body: createProductJson() }))
        .mockResolvedValueOnce(new RestResponse({ statusCode: 422 })),
    }
    const service = MrpService(restClient as never)
    const input = {
      name: 'Milk',
      unit: 'l' as const,
      categories: ['ingredient' as const],
      stockControl: 'single' as const,
      allowNegativeStock: true,
      idealStock: 10,
    }

    const response = await service.registerProduct(input)
    const failedResponse = await service.registerProduct(input)

    expect(restClient.post).toHaveBeenNthCalledWith(1, '/products', input)
    expect(response.body.createdAt).toBeInstanceOf(Date)
    expect(failedResponse.statusCode).toBe(422)
  })
})

function createProductJson() {
  return {
    id: 'product-id',
    establishmentId: 'establishment-id',
    name: 'Milk',
    unit: 'l' as const,
    categories: ['ingredient' as const],
    stockControl: 'single' as const,
    status: 'active' as const,
    idealStock: 10,
    createdAt: '2026-08-17T12:00:00.000Z',
    updatedAt: '2026-08-17T12:00:00.000Z',
  }
}

function createCatalogRowJson() {
  return {
    product: createProductJson(),
    brandCount: 2,
    stockQuantity: 0,
    idealStock: 10,
    stockSituation: 'low' as const,
  }
}
