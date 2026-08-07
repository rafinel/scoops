import type { StockSituation } from '#mrp/domain/structures/stock-situation.ts'

export type StockBalance = {
  readonly productId: string
  readonly brandId?: string
  readonly quantity: number
  readonly idealQuantity?: number
  readonly situation: StockSituation
}
