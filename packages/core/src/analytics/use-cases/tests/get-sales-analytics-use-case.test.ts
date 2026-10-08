import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { AnalyticsActor } from '#analytics/domain/structures/analytics-actor.ts'
import type { AnalyticsContextProvider } from '#analytics/interfaces/analytics-context-provider.ts'
import type { AnalyticsSalesFactsProvider } from '#analytics/interfaces/analytics-sales-facts-provider.ts'
import { GetSalesAnalyticsUseCase } from '#analytics/use-cases/get-sales-analytics-use-case.ts'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider.ts'

describe('Get Sales Analytics Use Case', () => {
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

  it('reconciles selected and comparison periods across products, channels and cancellations', async () => {
    const actor: AnalyticsActor = {
      userId: 'user-1',
      establishmentId: 'shop-1',
      profile: 'manager',
    }
    salesFactsProvider.forEachBatch.mockImplementation(async (input, consume) => {
      expect(input.establishmentId).toBe(actor.establishmentId)
      expect(input.selected.startAt).toEqual(new Date('2026-09-13T03:00:00.000Z'))
      expect(input.selected.endAt).toEqual(new Date('2026-09-14T03:00:00.000Z'))
      expect(input.comparison.startAt).toEqual(new Date('2026-09-12T03:00:00.000Z'))
      expect(input.comparison.endAt).toEqual(new Date('2026-09-13T03:00:00.000Z'))
      await consume([
        {
          orderId: 'selected-direct',
          registeredAt: new Date('2026-09-13T04:00:00.000Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 1000,
          channel: { snapshotId: null, name: 'Direct', currentId: null },
          lines: [
            {
              productSnapshotId: 'snapshot-covered',
              productName: 'Vanilla',
              currentProductId: 'product-vanilla',
              quantity: 2,
              allocatedNetSalesCents: 1000,
              cogsCents: 400,
            },
          ],
        },
        {
          orderId: 'selected-web',
          registeredAt: new Date('2026-09-13T14:00:00.000Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 2000,
          channel: { snapshotId: 'web', name: 'Website', currentId: 'web-current' },
          lines: [
            {
              productSnapshotId: 'snapshot-covered',
              productName: 'Vanilla',
              currentProductId: 'product-vanilla',
              quantity: 3,
              allocatedNetSalesCents: 1200,
              cogsCents: 500,
            },
            {
              productSnapshotId: 'snapshot-uncovered',
              productName: 'Mango',
              currentProductId: null,
              quantity: 7,
              allocatedNetSalesCents: 800,
              cogsCents: null,
            },
          ],
        },
        {
          orderId: 'selected-canceled',
          registeredAt: new Date('2026-09-13T15:00:00.000Z'),
          status: 'canceled',
          canceledAt: new Date('2026-09-13T16:00:00.000Z'),
          totalCents: 500,
          channel: { snapshotId: 'web', name: 'Website', currentId: 'web-current' },
          lines: [],
        },
        {
          orderId: 'selected-end-boundary',
          registeredAt: new Date('2026-09-14T03:00:00.000Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 9000,
          channel: { snapshotId: 'web', name: 'Website', currentId: 'web-current' },
          lines: [],
        },
        {
          orderId: 'comparison-start-boundary',
          registeredAt: new Date('2026-09-12T03:00:00.000Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 1000,
          channel: { snapshotId: null, name: 'Direct', currentId: null },
          lines: [],
        },
        {
          orderId: 'before-comparison',
          registeredAt: new Date('2026-09-12T02:59:59.999Z'),
          status: 'registered',
          canceledAt: null,
          totalCents: 20000,
          channel: { snapshotId: null, name: 'Direct', currentId: null },
          lines: [],
        },
      ])
    })

    const result = await useCase.execute({ actor, period: 'today' })

    expect(result.summary).toEqual({
      netSalesCents: 3000,
      validOrders: 2,
      averageTicketCents: 1500,
      comparison: {
        netSales: { absolute: 2000, percentage: 200 },
        validOrders: { absolute: 1, percentage: 100 },
        averageTicket: { absolute: 500, percentage: 50 },
      },
    })
    expect(result.margin).toMatchObject({
      coveredNetSalesCents: 2200,
      cogsCents: 900,
      grossMarginCents: 1300,
      grossMarginPercentage: expect.closeTo((1300 / 2200) * 100),
      coveragePercentage: expect.closeTo((2200 / 3000) * 100),
      uncoveredNetSalesCents: 800,
      affectedProducts: [
        {
          name: 'Mango',
          currentProductId: null,
        },
      ],
    })
    expect(result.cancellations).toEqual({ count: 1, valueCents: 500 })
    expect(
      result.products.byNetSales.map(({ productSnapshotId }) => productSnapshotId),
    ).toEqual(['snapshot-covered', 'snapshot-uncovered'])
    expect(result.products.byNetSales).toEqual([
      expect.objectContaining({
        productSnapshotId: 'snapshot-covered',
        currentProductId: 'product-vanilla',
        quantity: 5,
        netSalesCents: 2200,
        cogsCents: 900,
        marginPercentage: expect.closeTo((1300 / 2200) * 100),
        coveragePercentage: 100,
      }),
      expect.objectContaining({
        productSnapshotId: 'snapshot-uncovered',
        currentProductId: null,
        netSalesCents: 800,
        cogsCents: 0,
        marginPercentage: null,
        coveragePercentage: 0,
      }),
    ])
    expect(
      result.products.byQuantity.map(({ productSnapshotId }) => productSnapshotId),
    ).toEqual(['snapshot-uncovered', 'snapshot-covered'])
    expect(result.channels).toEqual([
      expect.objectContaining({
        snapshotId: 'web',
        currentId: 'web-current',
        netSalesCents: 2000,
        validOrders: 1,
        sharePercentage: expect.closeTo((2000 / 3000) * 100),
        averageTicketCents: 2000,
      }),
      expect.objectContaining({
        snapshotId: null,
        currentId: null,
        netSalesCents: 1000,
        validOrders: 1,
        sharePercentage: expect.closeTo((1000 / 3000) * 100),
        averageTicketCents: 1000,
      }),
    ])
    expect(result.evolution).toHaveLength(24)
    expect(result.evolution[1]).toMatchObject({
      key: '2026-09-13T01',
      netSalesCents: 1000,
    })
    expect(result.evolution[11]).toMatchObject({
      key: '2026-09-13T11',
      netSalesCents: 2000,
    })
    expect(result.evolution.reduce((sum, bucket) => sum + bucket.netSalesCents, 0)).toBe(
      3000,
    )
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

    contextProvider.resolve.mockResolvedValue({
      establishmentId: 'another-shop',
      establishmentIsActive: true,
      timeZone: 'America/Sao_Paulo',
    })
    await expect(
      useCase.execute({
        actor: { ...actor, profile: 'manager' },
        period: 'last-30-days',
      }),
    ).rejects.toThrow('Acesso não autorizado.')
    expect(salesFactsProvider.forEachBatch).not.toHaveBeenCalled()
  })
})
