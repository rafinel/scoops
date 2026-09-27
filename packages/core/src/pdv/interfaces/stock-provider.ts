import type { OrderRegisteredEvent } from '#pdv/domain/events/order-registered-event.ts'
import type { OrderStockRestoration } from '#pdv/domain/structures/order-stock-restoration.ts'
import type { StockRestorationRequest } from '#pdv/domain/structures/stock-restoration-request.ts'

export interface StockProvider {
  consume(event: OrderRegisteredEvent): Promise<void>
  restore(request: StockRestorationRequest): Promise<readonly StockProviderRestoration[]>
}

/** Results returned by MRP; `lost` is a PDV disposition and never a stock-provider result. */
export type StockProviderRestoration = Omit<
  OrderStockRestoration,
  'linePosition' | 'outcome'
> & {
  readonly linePosition: number
  readonly outcome: 'restored' | 'skipped'
}
