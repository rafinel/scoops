import type { OrderRegisteredEvent } from '#pdv/domain/events/order-registered-event.ts'

export interface StockConsumer {
  consume(event: OrderRegisteredEvent): Promise<void>
}
