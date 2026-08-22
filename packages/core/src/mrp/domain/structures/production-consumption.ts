export type ProductionConsumption = {
  readonly ingredientProductId: string
  readonly ingredientProductName: string
  readonly ingredientBrandId?: string
  readonly ingredientBrandName?: string
  readonly unit: import('#mrp/domain/structures/product-unit.ts').ProductUnit
  readonly quantity: number
  readonly unitCost: number
  readonly lineCost: number
  readonly currentBalance: number
  readonly projectedBalance: number
  readonly missingQuantity: number
  readonly allowsNegativeStock: boolean
}
