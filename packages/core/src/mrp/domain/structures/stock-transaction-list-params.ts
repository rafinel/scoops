import type { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'

export type StockTransactionListParams = {
  readonly type?: StockAdjustmentType
  readonly brandId?: string
  readonly from?: Date
  readonly to?: Date
  readonly page: number
  readonly limit: number
}
