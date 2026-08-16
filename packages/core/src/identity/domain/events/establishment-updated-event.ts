import type { Establishment } from '#identity/domain/entities/establishment.ts'
import { Event } from '#shared/domain/events/event.ts'

export class EstablishmentUpdatedEvent extends Event<{
  establishmentId: Establishment['id']
  actorUserId: string
  previousName: string
  name: Establishment['name']
  updatedAt: Establishment['updatedAt']
}> {
  static readonly _NAME = 'identity/establishment.updated'

  constructor(payload: EstablishmentUpdatedEvent['payload']) {
    super(EstablishmentUpdatedEvent._NAME, payload)
  }
}
