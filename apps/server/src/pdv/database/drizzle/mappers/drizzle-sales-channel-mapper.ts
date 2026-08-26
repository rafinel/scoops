import type { SalesChannel } from '@scoops/core/pdv/domain/entities'

import type { DrizzleSalesChannel } from '@/pdv/database/drizzle/types'

export class DrizzleSalesChannelMapper {
  static toDomain(record: DrizzleSalesChannel): SalesChannel {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      name: record.name,
      percentage: Number(record.percentage),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
