import type { OrderRegisteredEvent } from '#pdv/domain/events/order-registered-event.ts'
import type { OrderStockRestoration } from '#pdv/domain/structures/order-stock-restoration.ts'
import type { StockRestorationRequest } from '#pdv/domain/structures/stock-restoration-request.ts'

export interface StockProvider {
  consume(event: OrderRegisteredEvent): Promise<void>
  restore(request: StockRestorationRequest): Promise<readonly OrderStockRestoration[]>
}
