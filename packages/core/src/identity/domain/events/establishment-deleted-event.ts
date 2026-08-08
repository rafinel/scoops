import type { Establishment } from '#identity/domain/entities/establishment.ts'
import { Event } from '#shared/domain/events/event.ts'

export class EstablishmentDeletedEvent extends Event<{
  establishmentId: Establishment['id']
  status: Establishment['status']
  updatedAt: Establishment['updatedAt']
}> {
  static readonly _NAME = 'identity/establishment.deleted'

  constructor(payload: EstablishmentDeletedEvent['payload']) {
    super(EstablishmentDeletedEvent._NAME, payload)
  }
}
