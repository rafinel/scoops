import type { Product } from '#mrp/domain/entities/product.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ProductUpdatedEvent extends Event<{
  productId: Product['id']
  establishmentId: Product['establishmentId']
  updatedAt: Product['updatedAt']
}> {
  static readonly _NAME = 'mrp/product.updated'

  constructor(payload: ProductUpdatedEvent['payload']) {
    super(ProductUpdatedEvent._NAME, payload)
  }
}
