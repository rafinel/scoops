import type { Recipe } from '@scoops/core/mrp/domain/entities'

import type { DrizzleRecipe } from '../types'

export class DrizzleRecipeMapper {
  static toDomain(record: DrizzleRecipe): Recipe {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productId: record.productId,
      yieldQuantity: Number(record.yieldQuantity),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
