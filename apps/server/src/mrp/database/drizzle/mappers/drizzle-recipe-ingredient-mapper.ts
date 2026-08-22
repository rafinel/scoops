import type { RecipeIngredient } from '@scoops/core/mrp/domain/entities'

import type { DrizzleRecipeIngredient } from '../types'

export class DrizzleRecipeIngredientMapper {
  static toDomain(record: DrizzleRecipeIngredient): RecipeIngredient {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      recipeId: record.recipeId,
      ingredientProductId: record.ingredientProductId,
      quantity: Number(record.quantity),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
