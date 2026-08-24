import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductSizePricing } from '#mrp/domain/structures/product-size-pricing.ts'
import type { ResalePricing } from '#mrp/domain/structures/resale-pricing.ts'

export type ProductPricingDetails = {
  product: Product
  mode: 'portion' | 'resale-single' | 'resale-by-brand'
  sizes: readonly ProductSizePricing[]
  resale: readonly ResalePricing[]
}
