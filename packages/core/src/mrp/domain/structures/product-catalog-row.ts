import type { Product } from '#mrp/domain/entities/product.ts'
import type { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export type ProductCatalogRow = {
  readonly product: Product
  readonly brandCount: number
  readonly stockQuantity: number
  readonly idealStock?: number
  readonly stockSituation: StockSituation
}
