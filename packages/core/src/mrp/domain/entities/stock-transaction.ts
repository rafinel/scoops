import type { StockTransactionType } from '#mrp/domain/structures/stock-transaction-type.ts'
import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import type { Entity } from '#shared/domain/entities/entity.ts'

export type StockTransaction = Entity & {
  readonly establishmentId: string
  readonly productId: string
  readonly brandId?: string
  readonly productionId?: string
  readonly productName: string
  readonly brandName?: string
  readonly unit: ProductUnit
  readonly type: StockTransactionType
  readonly quantity: number
  readonly balanceAfter: number
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
}
