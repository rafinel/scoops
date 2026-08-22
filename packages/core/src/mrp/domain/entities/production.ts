import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { Entity } from '#shared/domain/entities/entity.ts'

export type Production = Entity & {
  readonly establishmentId: string
  readonly productId: string
  readonly productName: string
  readonly unit: ProductUnit
  readonly recipeId: string
  readonly recipeYield: number
  readonly quantity: number
  readonly totalCost: number
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
}
