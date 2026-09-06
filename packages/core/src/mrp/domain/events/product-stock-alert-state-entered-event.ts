import type { ProductUnit } from '#mrp/domain/structures/product-unit.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ProductStockAlertStateEnteredEvent extends Event<{
  establishmentId: string
  productId: string
  productName: string
  unit: ProductUnit
  state: 'below-ideal' | 'zero'
  availableQuantity: number
  idealQuantity?: number
  occurredAt: Date
}> {
  static readonly _NAME = 'mrp/product.stock-alert-state-entered'

  constructor(payload: ProductStockAlertStateEnteredEvent['payload']) {
    super(ProductStockAlertStateEnteredEvent._NAME, payload)
  }
}
