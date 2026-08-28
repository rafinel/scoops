import type { Order } from '#pdv/domain/entities/order.ts'
import type { StockConsumption } from '#pdv/domain/structures/stock-consumption.ts'
import { Event } from '#shared/domain/events/event.ts'

export class OrderRegisteredEvent extends Event<{
  orderId: Order['id']
  establishmentId: Order['establishmentId']
  sequenceNumber: Order['sequenceNumber']
  createdAt: Order['createdAt']
  actorId: string
  actorName: string
  occurredAt: Date
  consumptions: readonly StockConsumption[]
}> {
  static readonly _NAME = 'pdv/order.registered'

  constructor(payload: OrderRegisteredEvent['payload']) {
    super(OrderRegisteredEvent._NAME, payload)
  }
}
