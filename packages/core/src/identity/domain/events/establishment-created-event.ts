import type { Establishment } from '#identity/domain/entities/establishment.ts'
import { Event } from '#shared/domain/events/event.ts'

export class EstablishmentCreatedEvent extends Event<{
  establishmentId: Establishment['id']
  status: Establishment['status']
  createdAt: Establishment['createdAt']
}> {
  static readonly _NAME = 'identity/establishment.created'

  constructor(payload: EstablishmentCreatedEvent['payload']) {
    super(EstablishmentCreatedEvent._NAME, payload)
  }
}
