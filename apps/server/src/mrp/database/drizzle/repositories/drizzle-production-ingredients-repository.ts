import type { ProductionIngredient } from '@scoops/core/mrp/domain/entities'
import type { ProductionIngredientsRepository } from '@scoops/core/mrp/interfaces'
import { Injectable } from '@nestjs/common'

import { DrizzleRepository } from '@/shared/database/drizzle/drizzle-repository'

import { DrizzleProductionIngredientMapper } from '../mappers/drizzle-production-ingredient-mapper'
import { productionIngredientModel } from '../models/production-ingredient-model'

@Injectable()
export class DrizzleProductionIngredientsRepository
  extends DrizzleRepository
  implements ProductionIngredientsRepository
{
  async addMany(
    inputs: readonly Omit<ProductionIngredient, 'id'>[],
  ): Promise<readonly ProductionIngredient[]> {
    if (inputs.length === 0) return []
    const records = await this.database
      .insert(productionIngredientModel)
      .values(
        inputs.map((input) => ({
          id: crypto.randomUUID(),
          establishmentId: input.establishmentId,
          productionId: input.productionId,
          ingredientProductId: input.ingredientProductId,
          ingredientProductName: input.ingredientProductName,
          ingredientBrandId: input.ingredientBrandId ?? null,
          ingredientBrandName: input.ingredientBrandName ?? null,
          unit: input.unit,
          quantity: String(input.quantity),
          balanceAfter: String(input.balanceAfter),
          unitCost: String(input.unitCost),
          lineCost: String(input.lineCost),
        })),
      )
      .returning()
    return records.map(DrizzleProductionIngredientMapper.toDomain)
  }
}
