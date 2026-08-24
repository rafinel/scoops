import type { ProductionIngredient } from '#mrp/domain/entities/production-ingredient.ts'

export interface ProductionIngredientsRepository {
  addMany(
    input: readonly Omit<ProductionIngredient, 'id'>[],
  ): Promise<readonly ProductionIngredient[]>
  removeAll(): Promise<void>
}
