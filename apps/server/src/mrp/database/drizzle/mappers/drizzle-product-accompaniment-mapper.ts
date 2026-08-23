import type { ProductAccompaniment } from '@scoops/core/mrp/domain/entities'

import type { DrizzleProductAccompaniment } from '../types'

export class DrizzleProductAccompanimentMapper {
  static toDomain(record: DrizzleProductAccompaniment): ProductAccompaniment {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      accompanimentProductId: record.accompanimentProductId,
      accompanimentTypeId: record.accompanimentTypeId,
      quantityPerPortion: Number(record.quantityPerPortion),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
