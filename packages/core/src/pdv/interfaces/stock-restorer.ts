import type { OrderStockRestoration } from '#pdv/domain/structures/order-stock-restoration.ts'
import type { StockRestorationRequest } from '#pdv/domain/structures/stock-restoration-request.ts'

export interface StockRestorer {
  restore(request: StockRestorationRequest): Promise<readonly OrderStockRestoration[]>
}
