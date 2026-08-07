import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SalesChannelUpdatedEvent extends Event<{
  channelId: SalesChannel['id']
  establishmentId: SalesChannel['establishmentId']
  updatedAt: SalesChannel['updatedAt']
}> {
  static readonly _NAME = 'pdv/sales-channel.updated'

  constructor(payload: SalesChannelUpdatedEvent['payload']) {
    super(SalesChannelUpdatedEvent._NAME, payload)
  }
}
