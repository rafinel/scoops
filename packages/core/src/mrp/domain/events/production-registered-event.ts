import type { ProductionRequest } from '#mrp/domain/structures/production-request.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ProductionRegisteredEvent extends Event<ProductionRequest> {
  static readonly _NAME = 'mrp/production.registered'

  constructor(payload: ProductionRegisteredEvent['payload']) {
    super(ProductionRegisteredEvent._NAME, payload)
  }
}
