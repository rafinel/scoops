import type { ProductionIngredient } from '@scoops/core/mrp/domain/entities'

import type { DrizzleProductionIngredient } from '../types'

export class DrizzleProductionIngredientMapper {
  static toDomain(record: DrizzleProductionIngredient): ProductionIngredient {
    return {
      id: record.id,
      establishmentId: record.establishmentId,
      productionId: record.productionId,
      ingredientProductId: record.ingredientProductId,
      ingredientProductName: record.ingredientProductName,
      ingredientBrandId: record.ingredientBrandId ?? undefined,
      ingredientBrandName: record.ingredientBrandName ?? undefined,
      unit: record.unit as ProductionIngredient['unit'],
      quantity: Number(record.quantity),
      balanceAfter: Number(record.balanceAfter),
      unitCost: Number(record.unitCost),
      lineCost: Number(record.lineCost),
    }
  }
}
