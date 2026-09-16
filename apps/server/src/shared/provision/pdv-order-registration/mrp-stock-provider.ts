import type { OrderRegisteredEvent } from '@scoops/core/pdv/domain/events'
import type { StockProvider } from '@scoops/core/pdv/interfaces'
import type { OrderStockConsumption } from '@scoops/core/mrp/domain/structures'
import type {
  ConsumeOrderStockUseCase,
  RestoreOrderStockUseCase,
} from '@scoops/core/mrp/use-cases'
import type { StockRestorationRequest } from '@scoops/core/pdv/domain/structures'
import { Injectable } from '@nestjs/common'

@Injectable()
export class MrpStockProvider implements StockProvider {
  constructor(
    private readonly consumeOrderStock: Pick<ConsumeOrderStockUseCase, 'execute'>,
    private readonly restoreOrderStock: Pick<RestoreOrderStockUseCase, 'execute'>,
  ) {}

  consume(event: OrderRegisteredEvent): Promise<void> {
    const input: OrderStockConsumption = {
      establishmentId: event.payload.establishmentId,
      orderId: event.payload.orderId,
      performedBy: event.payload.actorId,
      performedByName: event.payload.actorName,
      occurredAt: event.payload.occurredAt,
      consumptions: event.payload.consumptions,
    }
    return this.consumeOrderStock.execute(input)
  }

  restore(request: StockRestorationRequest) {
    return this.restoreOrderStock.execute({ ...request })
  }
}
