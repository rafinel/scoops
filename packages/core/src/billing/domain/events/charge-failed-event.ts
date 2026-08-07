import type { Charge } from '#billing/domain/entities/charge.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ChargeFailedEvent extends Event<{
  chargeId: Charge['id']
  establishmentId: Charge['establishmentId']
  status: Charge['status']
}> {
  static readonly _NAME = 'billing/charge.failed'

  constructor(payload: ChargeFailedEvent['payload']) {
    super(ChargeFailedEvent._NAME, payload)
  }
}
