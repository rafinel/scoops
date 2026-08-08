import type { Establishment } from '#identity/domain/entities/establishment.ts'
import { Event } from '#shared/domain/events/event.ts'

export class EstablishmentActivatedEvent extends Event<{
  establishmentId: Establishment['id']
  status: Establishment['status']
  activatedAt: Establishment['activatedAt']
}> {
  static readonly _NAME = 'identity/establishment.activated'

  constructor(payload: EstablishmentActivatedEvent['payload']) {
    super(EstablishmentActivatedEvent._NAME, payload)
  }
}
