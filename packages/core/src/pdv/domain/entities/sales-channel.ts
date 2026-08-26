import type { Entity } from '#shared/domain/entities/entity.ts'
import type { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'

export type { SalesChannelCreate } from '#pdv/domain/structures/sales-channel-create.ts'
export type { SalesChannelUpdate } from '#pdv/domain/structures/sales-channel-update.ts'

export type SalesChannel = Entity & {
  establishmentId: string
  name: string
  percentage: number
  status: SalesChannelStatus
  createdAt: Date
  updatedAt: Date
}
