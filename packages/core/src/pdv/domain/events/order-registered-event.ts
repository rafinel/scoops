import type { Order } from '#pdv/domain/entities/order.ts'
import { Event } from '#shared/domain/events/event.ts'

export class OrderRegisteredEvent extends Event<{
  orderId: Order['id']
  establishmentId: Order['establishmentId']
  sequenceNumber: Order['sequenceNumber']
  createdAt: Order['createdAt']
}> {
  static readonly _NAME = 'pdv/order.registered'

  constructor(payload: OrderRegisteredEvent['payload']) {
    super(OrderRegisteredEvent._NAME, payload)
  }
}
