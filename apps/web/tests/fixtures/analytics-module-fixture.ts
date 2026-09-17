import type { Page } from '@playwright/test'

export const salesAnalyticsJson = () => ({
  period: 'last-30-days',
  selected: {
    timeZone: 'America/Sao_Paulo',
    localStartDate: '2026-08-15',
    localEndDate: '2026-09-13',
    startAt: '2026-08-15T03:00:00.000Z',
    endAt: '2026-09-14T03:00:00.000Z',
  },
  comparison: {
    timeZone: 'America/Sao_Paulo',
    localStartDate: '2026-07-16',
    localEndDate: '2026-08-14',
    startAt: '2026-07-16T03:00:00.000Z',
    endAt: '2026-08-15T03:00:00.000Z',
  },
  updatedAt: '2026-09-13T13:00:00.000Z',
  summary: {
    netSalesCents: 125000,
    validOrders: 42,
    averageTicketCents: 2976,
    comparison: {
      netSales: { absolute: 10000, percentage: 8.7 },
      validOrders: { absolute: 3, percentage: 7.7 },
      averageTicket: { absolute: 120, percentage: 4.2 },
    },
  },
  margin: {
    coveredNetSalesCents: 120000,
    cogsCents: 48000,
    grossMarginCents: 72000,
    grossMarginPercentage: 60,
    coveragePercentage: 96,
    uncoveredNetSalesCents: 5000,
    affectedProducts: [],
  },
  cancellations: { count: 2, valueCents: 4500 },
  evolution: [
    {
      key: '2026-09-13',
      label: '13/09',
      startAt: '2026-09-13T03:00:00.000Z',
      endAt: '2026-09-14T03:00:00.000Z',
      netSalesCents: 125000,
      validOrders: 42,
    },
  ],
  products: { byNetSales: [], byQuantity: [] },
  channels: [
    {
      snapshotId: null,
      name: 'Sem canal',
      currentId: null,
      netSalesCents: 125000,
      sharePercentage: 100,
      validOrders: 42,
      averageTicketCents: 2976,
    },
  ],
})

export const stockAttentionJson = () => ({
  updatedAt: '2026-09-13T13:00:00.000Z',
  items: [
    {
      productId: 'product-1',
      productName: 'Chocolate',
      kind: 'below-ideal',
      severity: 2,
      availableQuantity: 1,
      idealQuantity: 5,
      maximumProducibleQuantity: null,
      destination: 'stock',
    },
  ],
})

export async function mockAnalytics(page: Page) {
  await page.route('**/analytics/sales?period=*', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify(salesAnalyticsJson()),
    })
  })
  await page.route('**/analytics/stock-attention', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      status: 200,
      body: JSON.stringify(stockAttentionJson()),
    })
  })
}
