import type { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'

export type StockTransactionListParams = {
  readonly type?: StockTransactionType
  readonly brandId?: string
  readonly from?: Date
  readonly to?: Date
  readonly page: number
  readonly limit: number
}
