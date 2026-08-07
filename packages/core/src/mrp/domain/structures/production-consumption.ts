export type ProductionConsumption = {
  readonly ingredientProductId: string
  readonly ingredientBrandId?: string
  readonly quantity: number
  readonly currentBalance: number
  readonly projectedBalance: number
}
