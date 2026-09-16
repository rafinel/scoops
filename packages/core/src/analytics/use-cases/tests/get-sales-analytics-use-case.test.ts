import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsSalesFactsProvider } from '#analytics/interfaces/analytics-sales-facts-provider.ts'
import { GetSalesAnalyticsUseCase } from '#analytics/use-cases/get-sales-analytics-use-case.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

describe('GetSalesAnalyticsUseCase', () => {
  let contextProvider: MockProxy<AnalyticsContextProvider>
  let salesFactsProvider: MockProxy<AnalyticsSalesFactsProvider>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: GetSalesAnalyticsUseCase

  beforeEach(() => {
    contextProvider = mock<AnalyticsContextProvider>()
    salesFactsProvider = mock<AnalyticsSalesFactsProvider>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-09-13T12:00:00.000Z'))
    contextProvider.resolve.mockResolvedValue({
      establishmentId: 'shop-1',
      establishmentIsActive: true,
      commercialAccess: 'full',
      timeZone: 'America/Sao_Paulo',
    })
    salesFactsProvider.forEachBatch.mockImplementation(async (_input, consume) => {
      await consume([
        {
          orderId: 'order-1',
          registeredAt: new Date('2026-09-13T14:00:00.000Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 1000,
          channel: { snapshotId: null, name: 'No channel', currentId: null },
          lines: [
            {
              productSnapshotId: 'product-1',
              productName: 'Chocolate',
              currentProductId: 'product-current-1',
              quantity: 2,
              allocatedNetSalesCents: 1000,
              cogsCents: 400,
            },
          ],
        },
      ])
    })
    useCase = new GetSalesAnalyticsUseCase(
      contextProvider,
      salesFactsProvider,
      datetimeProvider,
    )
  })

  it('returns exact summary, interval and reconciled projections', async () => {
    const actor: AnalyticsActor = {
      userId: 'user-1',
      establishmentId: 'shop-1',
      profile: 'manager',
    }

    await expect(useCase.execute({ actor, period: 'today' })).resolves.toMatchObject({
      period: 'today',
      selected: {
        timeZone: 'America/Sao_Paulo',
        localStartDate: '2026-09-13',
        localEndDate: '2026-09-13',
      },
      summary: { netSalesCents: 1000, validOrders: 1, averageTicketCents: 1000 },
      margin: {
        coveredNetSalesCents: 1000,
        cogsCents: 400,
        grossMarginCents: 600,
        uncoveredNetSalesCents: 0,
      },
      products: { byNetSales: [expect.objectContaining({ netSalesCents: 1000 })] },
      channels: [expect.objectContaining({ netSalesCents: 1000, validOrders: 1 })],
    })
  })

  it('fails closed before reading facts for an operator', async () => {
    const actor: AnalyticsActor = {
      userId: 'user-1',
      establishmentId: 'shop-1',
      profile: 'operator',
    }

    await expect(useCase.execute({ actor, period: 'last-30-days' })).rejects.toThrow(
      'Acesso não autorizado.',
    )
    expect(contextProvider.resolve).not.toHaveBeenCalled()
    expect(salesFactsProvider.forEachBatch).not.toHaveBeenCalled()
  })
})
