import type {
  SalesChannel,
  SalesChannelCreate,
  SalesChannelUpdate,
} from '#pdv/domain/entities/sales-channel.ts'

export interface SalesChannelsRepository {
  add(input: SalesChannelCreate): Promise<SalesChannel>
  findById(establishmentId: string, channelId: string): Promise<SalesChannel | undefined>
  findByName(establishmentId: string, name: string): Promise<SalesChannel | undefined>
  findMany(establishmentId: string): Promise<readonly SalesChannel[]>
  replace(
    establishmentId: string,
    channelId: string,
    changes: SalesChannelUpdate,
  ): Promise<SalesChannel>
  remove(establishmentId: string, channelId: string): Promise<void>
}
