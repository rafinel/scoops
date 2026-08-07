import type { StockConsumptionRequest } from '#pdv/domain/structures/stock-consumption-request.ts'

export interface StockConsumer {
  consume(input: StockConsumptionRequest): Promise<void>
}
