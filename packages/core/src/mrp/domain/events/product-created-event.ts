import type { Product } from '#mrp/domain/entities/product.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ProductCreatedEvent extends Event<{
  productId: Product['id']
  establishmentId: Product['establishmentId']
  createdAt: Product['createdAt']
}> {
  static readonly _NAME = 'mrp/product.created'

  constructor(payload: ProductCreatedEvent['payload']) {
    super(ProductCreatedEvent._NAME, payload)
  }
}
