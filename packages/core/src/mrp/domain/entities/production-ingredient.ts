import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { Entity } from '#shared/domain/entities/entity.ts'

export type ProductionIngredient = Entity & {
  readonly establishmentId: string
  readonly productionId: string
  readonly ingredientProductId: string
  readonly ingredientProductName: string
  readonly ingredientBrandId?: string
  readonly ingredientBrandName?: string
  readonly unit: ProductUnit
  readonly quantity: number
  readonly unitCost: number
  readonly lineCost: number
  readonly balanceAfter: number
}
