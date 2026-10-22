import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'

export type AccompanimentPortionCandidate = {
  readonly productId: string
  readonly name: string
  readonly status: ProductStatus
}
