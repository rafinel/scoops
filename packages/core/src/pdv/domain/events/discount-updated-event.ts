import type { Discount } from '#pdv/domain/entities/discount.ts'
import { Event } from '#shared/domain/events/event.ts'

export class DiscountUpdatedEvent extends Event<{
  discountId: Discount['id']
  establishmentId: Discount['establishmentId']
  type: Discount['type']
  updatedAt: Discount['updatedAt']
}> {
  static readonly _NAME = 'pdv/discount.updated'

  constructor(payload: DiscountUpdatedEvent['payload']) {
    super(DiscountUpdatedEvent._NAME, payload)
  }
}
