import type { Product } from '#mrp/domain/entities/product.ts'
import type { ProductBrandStock } from '#mrp/domain/structures/product-brand-stock.ts'
import type { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export type ProductStockDetails = {
  readonly product: Product
  readonly stockQuantity: number
  readonly idealStock?: number
  readonly stockSituation: StockSituation
  readonly brands: readonly ProductBrandStock[]
}
