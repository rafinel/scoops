import type { StockRestorationTarget } from '#pdv/domain/structures/stock-restoration-target.ts'

export type StockRestorationRequest = {
  readonly establishmentId: string
  readonly orderId: string
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
  readonly targets: readonly StockRestorationTarget[]
}
