import type { Discount } from '#pdv/domain/entities/discount.ts'
import { Event } from '#shared/domain/events/event.ts'

export class DiscountDeletedEvent extends Event<{
  discountId: Discount['id']
  establishmentId: Discount['establishmentId']
  type: Discount['type']
}> {
  static readonly _NAME = 'pdv/discount.deleted'

  constructor(payload: DiscountDeletedEvent['payload']) {
    super(DiscountDeletedEvent._NAME, payload)
  }
}
