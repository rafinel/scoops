import type { StockRestorationTarget } from '#pdv/domain/structures/stock-restoration-target.ts'

export type StockRestorationRequest = {
  readonly establishmentId: string
  readonly orderId: string
  readonly performedBy: string
  readonly performedByName: string
  readonly occurredAt: Date
  /** One target per consumed item; retain line attribution even for matching stock items. */
  readonly targets: readonly StockRestorationTarget[]
}
