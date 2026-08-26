import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelCreate } from '#pdv/domain/structures/sales-channel-create.ts'
import type { SalesChannelStatus } from '#pdv/domain/structures/sales-channel-status.ts'
import type { SalesChannelUpdate } from '#pdv/domain/structures/sales-channel-update.ts'

type SalesChannelReplace = SalesChannelUpdate | { status: SalesChannelStatus }

export interface SalesChannelsRepository {
  add(input: SalesChannelCreate): Promise<SalesChannel>
  findById(establishmentId: string, channelId: string): Promise<SalesChannel | undefined>
  findByNormalizedName(
    establishmentId: string,
    normalizedName: string,
  ): Promise<SalesChannel | undefined>
  findMany(establishmentId: string): Promise<readonly SalesChannel[]>
  findActive(establishmentId: string): Promise<readonly SalesChannel[]>
  replace(
    establishmentId: string,
    channelId: string,
    changes: SalesChannelReplace,
  ): Promise<SalesChannel>
  remove(establishmentId: string, channelId: string): Promise<void>
  removeAll(): Promise<void>
}
