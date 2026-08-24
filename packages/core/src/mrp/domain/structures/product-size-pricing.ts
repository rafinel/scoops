import type { ProductSize } from '#mrp/domain/entities/product-size.ts'

export type ProductSizePricing = {
  size: ProductSize
  operatingCost?: number
  profit?: number
  marginPercentage?: number
}
