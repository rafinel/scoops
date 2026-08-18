import { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export const ProductStockSituation = StockSituation
export type ProductStockSituation =
  (typeof ProductStockSituation)[keyof typeof ProductStockSituation]
