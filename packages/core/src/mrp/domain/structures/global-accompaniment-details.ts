import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

export type GlobalAccompanimentDetails = {
  readonly accompanimentProductId: string
  readonly accompanimentProductName: string
  readonly isGlobal: boolean
  readonly unit: ProductUnit
  readonly salePrice: number | null
  readonly globalAccompanimentId?: string
  readonly accompanimentTypeId?: string
  readonly accompanimentTypeName?: string
  readonly quantityPerPortion?: number
  readonly brandId?: string
  readonly brandName?: string
  readonly unitCost?: number
  readonly estimatedCost?: number
}
