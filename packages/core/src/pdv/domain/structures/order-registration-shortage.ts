import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type OrderRegistrationShortage = {
  readonly productId: string
  readonly productName: string
  readonly brandId?: string
  readonly brandName?: string
  readonly unit: ProductUnit
  readonly requiredQuantity: number
  readonly availableQuantity: number
}
