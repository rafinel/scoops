import type { ProductAccompanimentDetails } from '#mrp/domain/structures/product-accompaniment-details.ts'

export type AccompanimentPortionDetails = ProductAccompanimentDetails & {
  readonly portionProductId: string
  readonly portionProductName: string
}
