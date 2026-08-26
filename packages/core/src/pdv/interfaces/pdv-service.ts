import type { SalesChannel } from '#pdv/domain/entities/sales-channel.ts'
import type { SalesChannelCreate } from '#pdv/domain/structures/sales-channel-create.ts'
import type { SalesChannelUpdate } from '#pdv/domain/structures/sales-channel-update.ts'
import type { RestResponse } from '#shared/responses/rest-response.ts'

export interface PdvService {
  listSalesChannels(): Promise<RestResponse<readonly SalesChannel[]>>
  listActiveSalesChannels(): Promise<RestResponse<readonly SalesChannel[]>>
  createSalesChannel(
    input: Omit<SalesChannelCreate, 'establishmentId'>,
  ): Promise<RestResponse<SalesChannel>>
  updateSalesChannel(
    channelId: string,
    input: SalesChannelUpdate,
  ): Promise<RestResponse<SalesChannel>>
  inactivateSalesChannel(channelId: string): Promise<RestResponse<SalesChannel>>
  reactivateSalesChannel(channelId: string): Promise<RestResponse<SalesChannel>>
  removeSalesChannel(channelId: string): Promise<RestResponse<void>>
}
