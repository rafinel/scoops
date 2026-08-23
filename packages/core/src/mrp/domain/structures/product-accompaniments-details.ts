import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'

export type ProductAccompanimentsDetails = {
  readonly product: Product
  readonly accompaniments: readonly ProductAccompanimentDetails[]
}
