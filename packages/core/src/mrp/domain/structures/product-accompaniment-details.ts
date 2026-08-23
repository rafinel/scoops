import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type ProductAccompanimentDetails = {
  readonly id: string
  readonly accompanimentProductId: string
  readonly accompanimentProductName: string
  readonly accompanimentTypeId: string
  readonly accompanimentTypeName: string
  readonly unit: ProductUnit
  readonly quantityPerPortion: number
  readonly brandId?: string
  readonly brandName?: string
  readonly unitCost?: number
  readonly estimatedCost?: number
}
