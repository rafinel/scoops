import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'

import type { NotificationKind } from '#communication/domain/structures/notification-kind.ts'

type FactBase = {
  readonly sourceEventId: string
  readonly establishmentId: string
  readonly occurredAt: Date
}

export type InProductNotificationFact =
  | (FactBase & {
      readonly kind: typeof NotificationKind.StockBelowIdeal
      readonly productId: string
      readonly productName: string
      readonly unit: ProductUnit
      readonly availableQuantity: number
      readonly idealQuantity: number
    })
  | (FactBase & {
      readonly kind: typeof NotificationKind.StockZero
      readonly productId: string
      readonly productName: string
      readonly unit: ProductUnit
      readonly availableQuantity: number
      readonly idealQuantity?: number
    })
  | (FactBase & {
      readonly kind:
        | typeof NotificationKind.UserAdded
        | typeof NotificationKind.UserPromoted
        | typeof NotificationKind.UserDemoted
        | typeof NotificationKind.UserInactivated
        | typeof NotificationKind.UserReactivated
      readonly affectedUserId: string
      readonly affectedUserName: string
    })
