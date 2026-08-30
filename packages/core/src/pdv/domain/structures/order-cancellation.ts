import type { OrderStockRestoration } from '#pdv/domain/structures/order-stock-restoration.ts'

export type OrderCancellation = {
  readonly canceledAt: Date
  readonly canceledBy: string
  readonly canceledByName: string
  readonly reason?: string
  readonly restorations: readonly OrderStockRestoration[]
}
