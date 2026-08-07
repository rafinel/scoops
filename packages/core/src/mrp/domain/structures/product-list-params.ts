import type { ProductCategory } from '#mrp/domain/structures/product-category.ts'
import type { ProductStatus } from '#mrp/domain/structures/product-status.ts'
import type { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export type ProductListParams = {
  readonly establishmentId: string
  readonly search?: string
  readonly category?: ProductCategory
  readonly status?: ProductStatus
  readonly stockSituation?: StockSituation
  readonly page: number
  readonly pageSize: number
}
