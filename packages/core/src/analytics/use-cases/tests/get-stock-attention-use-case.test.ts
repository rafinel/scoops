import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsStockFactsProvider } from '#analytics/interfaces/analytics-stock-facts-provider.ts'
import { GetStockAttentionUseCase } from '#analytics/use-cases/get-stock-attention-use-case.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

describe('Get Stock Attention Use Case', () => {
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

  it('orders by attention kind, severity and product ID before limiting the result', async () => {
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
    const fact = (
      productId: string,
      kind: 'zero-stock' | 'below-ideal' | 'limited-production',
      severity: number,
    ) => ({
      productId,
      productName: productId,
      kind,
      severity,
      availableQuantity: 0,
      idealQuantity: 10,
      maximumProducibleQuantity: null,
      destination: 'stock' as const,
    })
    stockFactsProvider.list.mockResolvedValue([
      fact('limited-high', 'limited-production', 10),
      fact('below-b', 'below-ideal', 4),
      fact('zero-low', 'zero-stock', 3),
      fact('below-high', 'below-ideal', 10),
      fact('zero-b', 'zero-stock', 8),
      fact('limited-low', 'limited-production', 1),
      fact('zero-a', 'zero-stock', 8),
      fact('below-a', 'below-ideal', 4),
    ])

    const result = await useCase.execute({ actor })

    expect(result.items.map(({ productId }) => productId)).toEqual([
      'zero-a',
      'zero-b',
      'zero-low',
      'below-high',
      'below-a',
    ])
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

    contextProvider.resolve.mockResolvedValue({
      establishmentId: 'another-shop',
      establishmentIsActive: true,
      timeZone: 'America/Sao_Paulo',
    })
    await expect(useCase.execute({ actor })).rejects.toThrow('Acesso não autorizado.')
    expect(stockFactsProvider.list).not.toHaveBeenCalled()
  })
})
