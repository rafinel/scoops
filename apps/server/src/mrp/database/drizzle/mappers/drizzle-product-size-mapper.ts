import type { ProductSize } from '@scoops/core/mrp/domain/entities'

import type { DrizzleProductSize } from '@/mrp/database/drizzle/types'

export class DrizzleProductSizeMapper {
  static toDomain(record: DrizzleProductSize): ProductSize {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      name: record.name,
      quantity: Number(record.quantity),
      price: Number(record.price),
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
