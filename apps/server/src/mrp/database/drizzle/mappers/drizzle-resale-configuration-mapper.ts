import type { ResaleConfiguration } from '@scoops/core/mrp/domain/entities'

import type { DrizzleResaleConfiguration } from '@/mrp/database/drizzle/types'

export class DrizzleResaleConfigurationMapper {
  static toDomain(record: DrizzleResaleConfiguration): ResaleConfiguration {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      brandId: record.brandId ?? undefined,
      price: Number(record.price),
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
