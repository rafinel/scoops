import type { Charge } from '#billing/domain/entities/charge.ts'
import { Event } from '#shared/domain/events/event.ts'

export class ChargePaidEvent extends Event<{
  chargeId: Charge['id']
  establishmentId: Charge['establishmentId']
  paidAt: Charge['paidAt']
}> {
  static readonly _NAME = 'billing/charge.paid'

  constructor(payload: ChargePaidEvent['payload']) {
    super(ChargePaidEvent._NAME, payload)
  }
}
