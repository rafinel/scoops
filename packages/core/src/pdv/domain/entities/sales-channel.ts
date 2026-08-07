import type { Entity } from '#shared/domain/entities/entity.ts'
import type { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'

export type SalesChannel = Entity & {
  establishmentId: string
  name: string
  percentage: number
  status: SalesChannelStatus
  createdAt: Date
  updatedAt: Date
}

export type SalesChannelCreate = Omit<SalesChannel, 'id' | 'createdAt' | 'updatedAt'>

export type SalesChannelUpdate = Partial<
  Pick<SalesChannel, 'name' | 'percentage' | 'status'>
>
