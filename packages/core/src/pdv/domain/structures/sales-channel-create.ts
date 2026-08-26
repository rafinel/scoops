import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'

export type SalesChannelCreate = {
  establishmentId: SalesChannel['establishmentId']
  name: SalesChannel['name']
  percentage: SalesChannel['percentage']
  status: SalesChannelStatus
}
