import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

export function makeSalesChannel(overrides: Partial<SalesChannel> = {}): SalesChannel {
  const timestamp = new Date('2026-01-01T00:00:00.000Z')
  return {
    id: 'channel-1',
    establishmentId: 'establishment-1',
    name: 'Delivery próprio',
    percentage: 12,
    status: 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  }
}
