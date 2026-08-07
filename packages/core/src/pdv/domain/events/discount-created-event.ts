import type { Discount } from '#pdv/domain/entities/discount.ts'
import { Event } from '#shared/domain/events/event.ts'

export class DiscountCreatedEvent extends Event<{
  discountId: Discount['id']
  establishmentId: Discount['establishmentId']
  type: Discount['type']
  createdAt: Discount['createdAt']
}> {
  static readonly _NAME = 'pdv/discount.created'

  constructor(payload: DiscountCreatedEvent['payload']) {
    super(DiscountCreatedEvent._NAME, payload)
  }
}
