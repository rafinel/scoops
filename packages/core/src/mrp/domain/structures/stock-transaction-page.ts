import type { StockTransaction } from '#mrp/domain/entities/stock-transaction.ts'

export type StockTransactionPage = {
  readonly items: readonly StockTransaction[]
  readonly page: number
  readonly limit: number
  readonly total: number
}
