import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'

export type StockConsumptionRequest = {
  readonly establishmentId: string
  readonly consumptions: readonly StockConsumption[]
  readonly performedBy: string
  readonly occurredAt: Date
}
