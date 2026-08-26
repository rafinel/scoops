import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'

export type SalesChannelUpdate = Pick<SalesChannel, 'name' | 'percentage'>
