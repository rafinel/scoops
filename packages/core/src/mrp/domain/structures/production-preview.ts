import type { ProductionConsumption } from '#mrp/domain/structures/production-consumption.ts'

export type ProductionPreview = {
  readonly productId: string
  readonly unit: ProductUnit
  readonly quantity: number
  readonly recipeYield: number
  readonly batches?: number
  readonly consumptions: readonly ProductionConsumption[]
  readonly totalCost: number
  readonly currentOutputStock: number
  readonly projectedOutputStock: number
  readonly canProduce: boolean
  readonly blockReasons: readonly string[]
}
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
