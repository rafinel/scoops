import type { ProductionConsumption } from '#mrp/domain/structures/production-consumption.ts'

export type ProductionPreview = {
  readonly productId: string
  readonly quantity: number
  readonly recipeYield: number
  readonly consumptions: readonly ProductionConsumption[]
  readonly resultingStock: number
  readonly canProduce: boolean
}
