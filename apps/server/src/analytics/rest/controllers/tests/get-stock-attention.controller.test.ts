import { UserProfile } from '@scoops/core/identity/domain/structures'
import type {
  AnalyticsContextProvider,
  AnalyticsStockFactsProvider,
} from '@scoops/core/analytics/interfaces'
import type { DatetimeProvider } from '@scoops/core/shared/interfaces'
import { AccountFaker } from '@scoops/core/identity/domain/entities/fakers'
import { describe, expect, it, vi } from 'vitest'
import { GetStockAttentionController } from '@/analytics/rest/controllers/get-stock-attention.controller'
import { MrpAnalyticsStockFactsProvider } from '@/shared/provision/analytics/mrp-analytics-stock-facts-provider'

describe('GetStockAttentionController', () => {
  it('returns the bounded stock attention projection', async () => {
    const context: AnalyticsContextProvider = {
      resolve: vi.fn().mockResolvedValue({
        establishmentId: 'establishment-1',
        establishmentIsActive: true,
        commercialAccess: 'full',
        timeZone: 'America/Sao_Paulo',
      }),
    }
    const facts: AnalyticsStockFactsProvider = {
      list: vi.fn().mockResolvedValue([
        {
          productId: 'product-1',
          productName: 'Morango',
          kind: 'zero-stock',
          severity: 10,
          availableQuantity: 0,
          idealQuantity: 5,
          maximumProducibleQuantity: null,
          destination: 'stock',
        },
      ]),
    }
    const datetimeProvider: DatetimeProvider = {
      now: () => new Date('2026-09-13T13:00:00.000Z'),
    }
    const controller = new GetStockAttentionController(context, facts, datetimeProvider)
    const response = await controller.handle(
      AccountFaker.fake({
        id: 'user-1',
        establishmentId: 'establishment-1',
        profile: UserProfile.Manager,
      }),
    )

    expect(response.items).toHaveLength(1)
    expect(response.items[0].kind).toBe('zero-stock')
  })

  it('adapts nullable stock thresholds from the owning MRP use case', async () => {
    const execute = vi.fn().mockResolvedValue([
      {
        establishmentId: 'establishment-1',
        productId: 'product-1',
        productName: 'Morango',
        kind: 'attention',
        severity: 5,
        availableQuantity: 2,
        idealQuantity: undefined,
        maximumProducibleQuantity: undefined,
        destination: 'production',
      },
    ])
    const provider = new MrpAnalyticsStockFactsProvider({ execute })

    await expect(provider.list('establishment-1')).resolves.toEqual([
      expect.objectContaining({ idealQuantity: null, maximumProducibleQuantity: null }),
    ])
    expect(execute).toHaveBeenCalledWith({ establishmentId: 'establishment-1' })
  })
})
