import type { StockAdjustmentType } from '#mrp/domain/structures/stock-adjustment-type.ts'

export type StockAdjustment = {
  readonly establishmentId: string
  readonly productId: string
  readonly brandId?: string
  readonly type: StockAdjustmentType
  readonly quantity: number
  readonly performedBy: string
  readonly occurredAt: Date
}
