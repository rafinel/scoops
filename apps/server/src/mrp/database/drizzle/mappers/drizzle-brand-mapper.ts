import type { Brand } from '@scoops/core/mrp/domain/entities'

import type { DrizzleBrand } from '../types'

export class DrizzleBrandMapper {
  static toDomain(record: DrizzleBrand): Brand {
    return {
      id: record.id,
      productId: record.productId,
      name: record.name,
      packageQuantity: Number(record.packageQuantity ?? 0),
      packagePrice: Number(record.packageValue ?? 0),
      isPrimary: record.isPrimary,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
