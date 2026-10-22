import type { GlobalAccompaniment } from '@scoops/core/mrp/domain/entities'

import type { DrizzleGlobalAccompaniment } from '../types'

export class DrizzleGlobalAccompanimentMapper {
  static toDomain(record: DrizzleGlobalAccompaniment): GlobalAccompaniment {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      accompanimentProductId: record.accompanimentProductId,
      accompanimentTypeId: record.accompanimentTypeId,
      quantityPerPortion: Number(record.quantityPerPortion),
      accompanimentPrice:
        record.accompanimentPrice === null
          ? undefined
          : Number(record.accompanimentPrice),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
