import type { Production } from '@scoops/core/mrp/domain/entities'

import type { DrizzleProduction } from '../types'

export class DrizzleProductionMapper {
  static toDomain(record: DrizzleProduction): Production {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      productName: record.productName,
      unit: record.unit as Production['unit'],
      recipeId: record.recipeId,
      recipeYield: Number(record.recipeYield),
      quantity: Number(record.quantity),
      totalCost: Number(record.totalCost),
      performedBy: record.performedBy,
      performedByName: record.performedByName,
      occurredAt: record.occurredAt,
    }
  }
}
