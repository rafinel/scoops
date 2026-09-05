import type { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'

export type AdjustProductStockInput = {
  readonly brandId?: string
  readonly type: StockAdjustmentType
  readonly quantity: number
  readonly currentUnitCost?: number
  readonly justification?: string
}
