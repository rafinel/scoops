import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsStockFactsProvider } from '#analytics/interfaces/analytics-stock-facts-provider.ts'
import { GetStockAttentionUseCase } from '#analytics/use-cases/get-stock-attention-use-case.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

describe('GetStockAttentionUseCase', () => {
  let contextProvider: MockProxy<AnalyticsContextProvider>
  let stockFactsProvider: MockProxy<AnalyticsStockFactsProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: GetStockAttentionUseCase

  beforeEach(() => {
    contextProvider = mock<AnalyticsContextProvider>()
    stockFactsProvider = mock<AnalyticsStockFactsProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-09-13T12:00:00.000Z'))
    useCase = new GetStockAttentionUseCase(
      contextProvider,
      stockFactsProvider,
      datetimeProvider,
    )
  })

  it('enforces active manager access and returns the five most urgent facts', async () => {
    const actor: AnalyticsActor = {
      userId: 'user-1',
      establishmentId: 'shop-1',
      profile: 'manager',
    }
    contextProvider.resolve.mockResolvedValue({
      establishmentId: actor.establishmentId,
      establishmentIsActive: true,
      timeZone: 'America/Sao_Paulo',
    })
    stockFactsProvider.list.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        productId: `product-${index}`,
        productName: `Product ${index}`,
        kind: index === 5 ? ('zero-stock' as const) : ('below-ideal' as const),
        severity: index,
        availableQuantity: index,
        idealQuantity: 5,
        maximumProducibleQuantity: null,
        destination: 'stock' as const,
      })),
    )

    const result = await useCase.execute({ actor })
    expect(result.items).toHaveLength(5)
    expect(result.items[0]).toMatchObject({ productId: 'product-5' })
    expect(stockFactsProvider.list).toHaveBeenCalledWith(actor.establishmentId)
  })

  it('fails closed when the establishment is inactive', async () => {
    const actor: AnalyticsActor = {
      userId: 'user-1',
      establishmentId: 'shop-1',
      profile: 'manager',
    }
    contextProvider.resolve.mockResolvedValue({
      establishmentId: actor.establishmentId,
      establishmentIsActive: false,
      timeZone: 'America/Sao_Paulo',
    })

    await expect(useCase.execute({ actor })).rejects.toThrow('Acesso não autorizado.')
    expect(stockFactsProvider.list).not.toHaveBeenCalled()
  })
})
