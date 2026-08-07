import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import { Event } from '#shared/domain/events/event.ts'

export class SalesChannelCreatedEvent extends Event<{
  channelId: SalesChannel['id']
  establishmentId: SalesChannel['establishmentId']
  createdAt: SalesChannel['createdAt']
}> {
  static readonly _NAME = 'pdv/sales-channel.created'

  constructor(payload: SalesChannelCreatedEvent['payload']) {
    super(SalesChannelCreatedEvent._NAME, payload)
  }
}
